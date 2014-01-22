// interaction_machine.js
//  - Interaction machine for messages and events.

var jed = require("jed");
var Q = require("q");

var utils = require("./utils");

var metrics = require("./metrics");
var MetricStore = metrics.MetricStore;

var user = require("./user");
var User = user.User;

var config = require("./config");
var SandboxConfig = config.SandboxConfig;
var IMConfig = config.IMConfig;

var states = require("./states");
var EndState = states.EndState;
var StateInputEvent = states.StateInputEvent;
var StateEnterEvent = states.StateEnterEvent;
var StateExitEvent = states.StateExitEvent;

var events = require("./events");
var Event = events.Event;
var Eventable = events.Eventable;


var IMEvent = Event.extend(function(self, name, im) {
    /**class:IMEvent
    An event relating to an interaction machine.

    :param string name:
        the event type's name.
    :param InteractionMachine im:
        the interaction machine associated to the event
    */
    Event.call(self, name);
    self.im = im;
});

var InboundMessageEvent = IMEvent.extend(function(self, im, cmd) {
    /**class:InboundMessageEvent(im, cmd)
    Emitted when an inbound user message is received by the interaction machine.
    */
    /**:InteractionMachine.on "inbound_message" (event)

    Handles an inbound user message, triggering state transitions and events
    as necessary.

    :param InteractionMachine im:
        the interaction machine firing the event.
    :param object cmd:
        the API request cmd containing the inbound user message.

    The steps performed by this method are roughly:

        * :func:`InteractionMachine.setup_config`
        * :func:`InteractionMachine.setup_metrics`
        * :func:`InteractionMachine.load_user` Switch to the user's
        * previous state using :func:`InteractionMachine.switch_state`.
        * Delegate to one of the interaction machine's message handlers
        * based on the session event type
          (see :object:InteractionMachine.message_handlers).
        * Fire a :class:`SessionCloseEvent`, :class:`SessionNewEvent` or
          :class:`SessionResumeEvent` event as appropriate.
        * Fire a :class:`StateInputEvent` on the current state for resumed
        * sessions
          or the current state's ``new_session_event`` method for new
          sessions.
        * Send a reply from the current state if the session was not
          closed.
    */
    IMEvent.call(self, 'inbound_message', im);
    self.cmd = cmd;
    self.msg = cmd.msg;
});

var InboundEventEvent = IMEvent.extend(function(self, im, cmd) {
   /**class:InboundEventEvent(im, cmd)
    :class:`IMEvent` fired when an message status event is
    received. Typically this is either an acknowledgement or a
    delivery report for an outbound message that was sent from the
    sandbox application.

    :param InteractionMachine im:
        the interaction machine firing the event.
    :param object cmd:
        the API request cmd containing the inbound user message.

    The event type is ``inbound_event``.
    */
    IMEvent.call(self, 'inbound_event', im);
    self.cmd = cmd;
    self.event = cmd.msg;
});

var UnknownCommandEvent = IMEvent.extend(function(self, im, cmd) {
    /**class:UnknownCommandEvent(im, cmd)
    :class:`IMEvent` fired when a command without a handler is
    received.

    :param InteractionMachine im:
        the interaction machine firing the event.
    :param object cmd:
        the API request that no command handler was found for.

    The event type is ``unknown_command``.
    */
    IMEvent.call(self, 'unknown_command', im);
    self.cmd = cmd;
});

var SessionNewEvent = IMEvent.extend(function(self, im) {
    /**class:SessionNewEvent(im)

    :class:`IMEvent` fired when a new user session starts.

    :param InteractionMachine im: the interaction machine firing the event.

    The event type is ``session_new``.
    */
    IMEvent.call(self, 'session:new', im);
});

var SessionCloseEvent = IMEvent.extend(function(self, im, timed_out) {
    /**class:SessionCloseEvent(im, possible_timeout)

    :class:`IMEvent` fired when a user session ends.

    :param InteractionMachine im: the interaction machine firing the event.
    :param boolean timed_out:
        true if the session was terminated by the user (including
        when the user session times out) and false if the session
        was closed explicitly by the sandbox application.

    The event type is ``session:close``.
    */

    IMEvent.call(self, 'session:close', im);
    self.timed_out = timed_out;
});

var SessionResumeEvent = IMEvent.extend(function(self, im) {
    /**class:SessionResumeEvent(im)

    :class:`IMEvent` fired when a new user message arrives for an existing
    user session.

    :param InteractionMachine im: the interaction machine firing the event.

    The event type is ``session_resume``.
    */

    IMEvent.call(self, 'session:resume', im);
});


var InteractionMachine = Eventable.extend(function(self, api, state_creator) {
    /**class:InteractionMachine(api, state_creator)

    :param SandboxAPI api:
        a sandbox API providing access to external resources and
        inbound messages.
    :param StateCreator state_creator:
        a collection of states defining an application.

    A controller that handles inbound messages and fires events and
    handles state transitions in response to those messages. In addition it
    serves as a bridge between a :class:`StateCreator` (i.e. set of states
    defining an application) and resources provided by the sandbox API.
    */
    Eventable.call(self);

    /**attribute:InteractionMachine.api
    A reference to the sandbox API.
    */
    self.api = api;

    /**attribute:InteractionMachine.state_creator

    A reference to the :class:`StateCreator`.
    */
    self.state_creator = state_creator;

    /**attribute:InteractionMachine.msg

    The message command currently being processed. Available as soon as
    :class:`InboundMessageEvent` is handled by
    :data:`InteractionMachine.on "inbound_message"`.
    */
    self.msg = null;

    /**attribute:InteractionMachine.user

    User data for the current user. Available once
    :meth:`InteractionMachine.load_user` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.user = new User(self);

    /**attribute:InteractionMachine.current_state

    The current :class:`State` object. Updated whenever a new state is entered
    via a called to :meth:`InteractionMachine.switch_state`.
    */
    self.state = null;

    self.sandbox_config = new SandboxConfig(self);

    /**attribute:InteractionMachine.config

    The value of the `config` key retrieved from the sandbox config resource.
    Available once :meth:`InteractionMachine.setup_config` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.config = new IMConfig(self);

    /**attribute:InteractionMachine.metrics

    A default :class:`MetricStore` instance. Available once
    :meth:`InteractionMachine.setup_metrics` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.metrics = new MetricStore(self);

    self.setup = function(msg, opts) {
        opts = utils.set_defaults(opts || {}, {restart: false});

        return Q()
            .then(function() {
                return self.sandbox_config.setup();
            })
            .then(function() {
                return self.config.setup();
            })
            .then(function() {
                return self.metrics.setup({
                    store_name: self.config.get('metric_store_name')
                });
            })
            .then(function() {
                var user_opts = {
                    lang: self.config.get('default_lang'),
                    store_name: self.config.get('user_store_name')
                };

                return opts.restart
                    ? self.user.setup(msg.from_addr, opts)
                    : self.user.load_or_create(msg.from_addr, opts);
            })
            .then(function() {
                self.log("Loaded user: " + JSON.stringify(self.user));
                return self.state_creator.setup(self);
            })
            .then(function() {
                return self.emit.setup();
            });
    };

    // TODO: perhaps this should just be called automatically when
    //       the interaction machine is creatd?
    self.attach = function() {
        /**:InteractionMachine.attach()

        Does the following:
            * Sets the interaction machine itself as ``api.im``.  Sets the
            * sandbox API's event handlers to emit the respective
            events on the interaction machine, then terminate the sandbox once
            their listeners are done.
        */
        self.api.im = self;

        var done = self.done;
        var err = self.err;

        self.api.on_unknown_command = function(cmd) {
            self.emit(new UnknownCommandEvent(self, cmd)).done(done, err);
        };

        self.api.on_inbound_event = function(cmd) {
            self.emit(new InboundEventEvent(self, cmd)).done(done, err);
        };

        self.api.on_inbound_message = function(cmd) {
            self.emit(new InboundMessageEvent(self, cmd)).done(done, err);
        };
    };

    self.get_msg = function() {
        /**:InteractionMachine.get_msg()

        Returns the inbound user msg object currently being processed by
        the interaction machine. Returns ``null`` if no message is being
        processed.
        */
        return JSON.parse(JSON.stringify(self.msg));
    };

    self.is_in_state = function(name) {
        return typeof name != 'undefined'
            ? self.state !== null
            : self.state.name === name;
    };
    
    self.switch_to_user_state = function() {
        var state = self.user.state;
        return self.switch_state(state.get_name(), state.get_metadata());
    };

    self.switch_to_start_state = function() {
        return self.switch_state(self.state_creator.start_state_name);
    };

    self.switch_state = function(name, metadata) {
        var p = Q(self);

        if (self.is_in_state(name)) {
            return p;
        }

        p = Q(self.state_creator.switch_state(name));
        return p.then(function(new_state) {
            return new_state
                .setup(self, metadata)
                .then(function() {
                    return self.emit.state_exit();
                })
                .then(function() {
                    self.user.state.reset(new_state);
                    self.state = new_state;
                    return self.emit.state_enter(new_state);
                });
        });
    };

    self.fetch_translation = function(lang) {
        /**:InteractionMachine.fetch_translation(lang)

        Retrieve a ``jed`` instance containing translations for the given
        language. Returns a promise that will be fulfilled with the retrieved
        ``jed`` instance.

        :param string lang:
            two letter language code (e.g. ``sw``, ``en``).

        Translations are retrieved from the sandbox configuration resource
        by looking up keys named ``translation.<language-code>``.
        */
        return self.sandbox_config
            .get("translation." + lang, {json: true})
            .then(function(domain_data) {
                var jed_data = {};

                if (domain_data) {
                    jed_data.domain = "messages";
                    jed_data.locale_data = {messages: domain_data};
                }

                return new jed(jed_data);
            });
    };

    self.log = function(msg) {
        /**:InteractionMachine.log(message)

        Log a message to the sandbox logging resource at the ``info`` level.

        :param string message:
            the log message.

        Returns a promise that fires once the log message as been
        acknowledged by the logging resource.
        */
        return self.api_request('log.info', {'msg': msg});
    };

    self.err = function(e) {
        // TODO
        return self
            .log(e)
            .then(function() {
                return self.api.done();
            })
            .thenResolve(self);
    };

    self.done = function() {
        /**:InteractionMachine.done()
        Saves the user, then terminates the sandbox instance.
        */
        return self
            .user.save()
            .then(function() {
                return self.api.done();
            })
            .thenResolve(self);
    };

    self.api_request = function(cmd_name, cmd) {
        /**:InteractionMachine.api_request(cmd_name, cmd)

        Raw request to the sandbox API.

        :param string cmd_name:
            name of the API request to make.
        :param object cmd:
            API request data.

        Returns a promise that fires with the response to the API request.
        */
        var d = new Q.defer();
        self.api.request(cmd_name, cmd, d.resolve);
        return d.promise;
    };

    self.reply = function(msg, opts) {
        /**:InteractionMachine.reply(msg)

        Send a response from the current state to the user.

        :param object msg:
            the inbound message being replied to.

        Returns a promise which fires once the response has been sent and
        the user state successfully stored.
        */
        return self
            .switch_to_user_state()
            .then(function() {
                if (!self.state.continue_session) {
                    return self.emit(new SessionCloseEvent(self, false));
                }
            })
            .then(function () {
                return self.state.display();
            })
            .then(function (content) {
                if (self.state.send_reply) {
                    return self.api_request("outbound.reply_to", {
                        content: content,
                        in_reply_to: msg.message_id,
                        continue_session: self.state.continue_session
                    });
                }
            });
    };

    self.handle_message = function(msg) {
        /**:InteractionMachine.handle_message(msg)
         *
        Delegates to its subordinate message handlers to handle an inbound
        message based on the message's session event type. The fallback message
        handler is defined by
        :func:`InteractionMachine.handle_message.fallback`, which by default
        is an alias for :func:`InteractionMachine.handle_message.resume`.

        :param object msg: the received inbound message.
         **/
        // TODO check null session event
        var handler = self.handle_message[msg.session_event];
        handler = handler || self.handle_message.fallback;
        return handler.call(self, msg);
    };

    self.handle_message.close = function(msg) {
        /**:InteractionMachine.handle_message.close(msg)

        Invoked when an inbound message is received with a ``close`` session
        event type.

        :param object msg: the received inbound message.

        Does roughly the following:

            * Emits a :class:`SessionCloseEvent` on the interaction machine and
        waits for its listeners to complete their work
            * Saves the user's data (in case something has changed while this
              message was processed)
        */
        var e = new SessionCloseEvent(self, true);
        return self.emit(e).then(function () {
            return self.user.save();
        });
    };

    self.handle_message.new = function(msg) {
        /**:InteractionMachine.handle_message.new(msg)

        Invoked when an inbound message is received with a ``new`` session
        event type.

        :param object msg: the received inbound message.

        Does roughly the following:

            * Emits a :class:`SessionNewEvent` on the interaction machine and
        waits for its listeners to complete their work
            * Emits a :class:`SessionNewEvent` on the current state and
        waits for its listeners to complete their work
            * Send a reply from the current state.
        */
        var e = new SessionNewEvent(self);
        return self
            .emit(e)
            .then(function () {
                return self.current_state.emit(e);
            })
            .then(function () {
                return self.reply(msg);
            });
    };

    self.handle_message.resume = function(msg) {
        /**:InteractionMachine.handle_message.resume(msg)

        Invoked when an inbound message is received with a ``resume`` session
        event type.

        :param object msg: the received inbound message.

        Does roughly the following:

            * Emits a :class:`SessionResumeEvent` on the interaction machine
            * and waits for its listeners to complete their work
            * If the message contains usable content, emit a
              :class:`StateInputEvent` on the interaction machine and the
              current state.
            * Send a reply from the current state.
        */
        var p = self.emit(new SessionResumeEvent(self));

        if (msg.content || msg.content === '') {
            var e = new StateInputEvent(self.current_state, msg.content);

            p = p
                .then(function() {
                    return self.emit(e);
                })
                .then(function() {
                    return self.current_state.emit(e);
                });

            return self.current_state.emit.input(msg.content);
        }

        return p.then(function() {
            return self.reply(msg);
        });
    };

    self.handle_message.fallback = self.handle_message.resume;

    self.emit.state_exit = function() {
        if (!self.current_state) {
            return Q(self);
        }

        var e = new StateExitEvent(self.state);
        return self
            .emit(e)
            .then(function() {
                return self.state.emit(e);
            })
            .thenResolve(self);
    };

    self.emit.state_enter = function(state) {
        var e = new StateEnterEvent(state);
        return self
            .emit(e)
            .then(function() {
                return state.emit(e);
            })
            .thenResolve(self);
    };

    self.on('unknown_command', function(event) {
        /**:InteractionMachine.on "unknown_command" (event)

        Invoked by a :class:`UnknownCommandEvent` event when a command without
        a handler is received (see :class:`UnknownCommandEvent`). Logs an
        error.

        :param UnknownCommandEvent event: the fired event.
        */
        self.log("Received unknown command: " + JSON.stringify(event.cmd));
    });

    self.on('inbound_message', function(event) {
        /**:InteractionMachine.on "inbound_message" (event)

        Invoked an inbound user message, triggering state transitions and events
        as necessary.

        :param InboundMessageEvent event: the fired event.

        The steps performed by this method are roughly:

            * :func:`InteractionMachine.setup_config`
            * :func:`InteractionMachine.setup_metrics`
            * :func:`InteractionMachine.setup_user`.
            * Switch to the user's previous state using
              :func:`InteractionMachine.switch_state`.
            * Delegate to one of the interaction machine's message handlers
              based on the session event type
            * Save the user
        */
        self.log("Received inbound message: " + msg.content);

        var msg = event.cmd.msg;
        self.msg = msg;

        var restart = false;
        if (msg.content == "!restart") {
            // TODO emit event on restart?
            restart = true;
            msg.content = "";
        }

        return self
            .setup(msg, {restart: restart})
            .then(function() {
                return self.user.is_in_state()
                    ? self.switch_to_user_state()
                    : self.switch_to_start();
            })
            .then(function() {
                self.log("Switched to state: " + self.state.name);
                return self.handle_message(msg);
            });
    });
});


this.InteractionMachine = InteractionMachine;

this.IMEvent = IMEvent;
this.InboundMessageEvent = InboundMessageEvent;
this.InboundEventEvent = InboundEventEvent;
this.UnknownCommandEvent = UnknownCommandEvent;
this.SessionNewEvent = SessionNewEvent;
this.SessionResumeEvent = SessionResumeEvent;
this.SessionCloseEvent = SessionCloseEvent;
