// interaction_machine.js
//  - Interaction machine for messages and events.

var _ = require("lodash");
var Q = require("q");

var utils = require("./utils");
var BaseError = utils.BaseError;

var metrics = require("./metrics");
var MetricStore = metrics.MetricStore;

var user = require("./user");
var User = user.User;

var config = require("./config");
var SandboxConfig = config.SandboxConfig;
var IMConfig = config.IMConfig;

var states = require("./states");
var StateInputEvent = states.StateInputEvent;
var StateEnterEvent = states.StateEnterEvent;
var StateExitEvent = states.StateExitEvent;

var events = require("./events");
var Event = events.Event;
var Eventable = events.Eventable;

var translate = require('./translate');
var Translator = translate.Translator;


var ApiError = BaseError.extend(function(self, reply) {
    /**class:ApiError(message)
        Thrown when an error occurs when the sandbox api returns a failure
        response (when ``success`` is ``false``).

        :param object reply: the failure reply given by the api.
    */
    self.name = 'ApiError';
    self.reply = reply;
    self.message = self.reply.reason;
});

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

    :param InteractionMachine im:
        the interaction machine firing the event.
    :param object cmd:
        the API request cmd containing the inbound user message.
    */
    IMEvent.call(self, 'inbound_message', im);
    self.cmd = cmd;
    self.msg = cmd.msg;
});

var InboundEventEvent = IMEvent.extend(function(self, im, cmd) {
   /**class:InboundEventEvent(im, cmd)

    Emitted when an message status event is received. Typically, this is either
    an acknowledgement or a delivery report for an outbound message that was
    sent from the sandbox application.

    :param InteractionMachine im:
        the interaction machine emitting the event.
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

    Emitted when a command without a handler is received.

    :param InteractionMachine im:
        the interaction machine emitting the event.
    :param object cmd:
        the API request that no command handler was found for.

    The event type is ``unknown_command``.
    */
    IMEvent.call(self, 'unknown_command', im);
    self.cmd = cmd;
});

var SessionNewEvent = IMEvent.extend(function(self, im) {
    /**class:SessionNewEvent(im)

    Emitted when a new user session starts.

    :param InteractionMachine im:
        the interaction machine emitting the event.

    The event type is ``session:new``.
    */
    IMEvent.call(self, 'session:new', im);
});

var SessionNewEvent = IMEvent.extend(function(self, im) {
    /**class:SessionNewEvent(im)

    Emitted when a new user session starts.

    :param InteractionMachine im:
        the interaction machine emitting the event.

    The event type is ``session:new``.
    */
    IMEvent.call(self, 'session:new', im);
});

var SessionCloseEvent = IMEvent.extend(function(self, im, user_terminated) {
    /**class:SessionCloseEvent(im, user_terminated)

    Emitted when a user session ends.

    :param InteractionMachine im:
        the interaction machine emitting the event.
    :param boolean user_terminated:
        true if the session was terminated by the user (including
        when the user session times out) and false if the session
        was closed explicitly by the sandbox application.

    The event type is ``session:close``.
    */

    IMEvent.call(self, 'session:close', im);
    self.user_terminated = user_terminated;
});

var SessionResumeEvent = IMEvent.extend(function(self, im) {
    /**class:SessionResumeEvent(im)

    Emitted when a new user message arrives for an existing user session.

    :param InteractionMachine im:
        the interaction machine emitting the event.

    The event type is ``session:resume``.
    */

    IMEvent.call(self, 'session:resume', im);
});

var IMErrorEvent = IMEvent.extend(function(self, im, error) {
    /**class:IMErrorEvent(im)

    Emitted when an error occurs during a run of the im.

    :param InteractionMachine im:
        the interaction machine emitting the event.
    :param InteractionMachine error:
        the error that occured.

    The event type is ``im:error``.
    */

    IMEvent.call(self, 'im:error', im);
    self.error = error;
});

var IMShutdownEvent = IMEvent.extend(function(self, im) {
    /**class:IMShutdownEvent(im)

    Occurs when the im is about to shutdown.

    :param InteractionMachine im:
        the interaction machine emitting the event.

    The event type is ``im:shutdown``.
    */

    IMEvent.call(self, 'im:shutdown', im);
});


var InteractionMachine = Eventable.extend(function(self, api, app) {
    /**class:InteractionMachine(api, app)

    :param SandboxAPI api:
        a sandbox API providing access to external resources and
        inbound messages.
    :param App app:
        a collection of states defining an application.

    A controller that handles inbound messages and fires events and
    handles state transitions in response to those messages. In addition, it
    serves as a bridge between a :class:`App` (i.e. set of states
    defining an application) and resources provided by the sandbox API.
    */
    Eventable.call(self);

    /**attribute:InteractionMachine.api
    A reference to the sandbox API.
    */
    self.api = api;

    /**attribute:InteractionMachine.app
    A reference to the :class:`App`.
    */
    self.app = app;

    /**attribute:InteractionMachine.msg
    The message command currently being processed. Available when
    setup is complete (see :meth:`InteractionMachine.setup`).
    */
    self.msg = null;

    /**attribute:InteractionMachine.user
    A :class:`User` instance for the current user. Available when
    setup is complete (see :meth:`InteractionMachine.setup`).
    */
    self.user = new User(self);

    /**attribute:InteractionMachine.state
    The current :class:`State` object. Updated whenever a new state is entered
    via a call to
    :meth:`InteractionMachine.switch_state`, 
    :meth:`InteractionMachine.switch_to_user_state` or 
    :meth:`InteractionMachine.switch_to_start_state`.
    */
    self.state = null;

    /**attribute:InteractionMachine.sandbox_config
    A :class:`SandboxConfig` instance for accessing the sandbox's config data.
    Available when setup is complete (see :meth:`InteractionMachine.setup`).
    */
    self.sandbox_config = new SandboxConfig(self);

    /**attribute:InteractionMachine.config
    A :class:`IMConfig` instance for the IM's config data. Available when
    setup is complete (see :meth:`InteractionMachine.setup`).
    */
    self.config = new IMConfig(self);

    /**attribute:InteractionMachine.metrics
    A default :class:`MetricStore` instance for emitting metrics. Available when
    setup is complete (see :meth:`InteractionMachine.setup`)
    */
    self.metrics = new MetricStore(self);

    self.attach = function() {
        /**:InteractionMachine.attach()

        Sets the sandbox API's event handlers to emit the respective events on
        the interaction machine, then terminate the sandbox once their
        listeners are done.
        */
        var done = self.done;
        var err = self.err;

        self.api.on_unknown_command = function(cmd) {
            var e = new UnknownCommandEvent(self, cmd);
            self.emit(e).done(done, err);
        };

        self.api.on_inbound_event = function(cmd) {
            var e = new InboundEventEvent(self, cmd);
            self.emit(e).done(done, err);
        };

        self.api.on_inbound_message = function(cmd) {
            var e = new InboundMessageEvent(self, cmd);
            self.emit(e).done(done, err);
        };
    };

    self.setup = function(msg, opts) {
        /**:InteractionMachine.setup(msg[, opts])
        Sets up the interaction machine using the given message.

        :param object msg:
            the received message to be used to set up the interaction machine.
        :param boolean opts.reset:
            whether to reset the user's data, or load them from the kv store

        The IM sets up its attributes in the following order:
            * sanbox config
            * im config
            * metric store
            * user
            * app

        Finally, a :class:`SetupEvent` is emitted. A promise is returned, which
        will be fulfilled once all event listeners are done.
        */
        opts = _.defaults(opts || {}, {reset: false});

        return Q()
            .then(function() {
                return self.sandbox_config.setup();
            })
            .then(function() {
                return self.config.do.setup();
            })
            .then(function() {
                return self.metrics.setup({
                    store_name: self.config.metric_store
                             || self.config.name
                });
            })
            .then(function() {
                var user_opts = {
                    lang: self.config.default_lang,
                    store_name: self.config.user_store
                             || self.config.name
                };

                return opts.reset
                    ? self.user.reset(msg.from_addr, user_opts)
                    : self.user.load_or_create(msg.from_addr, user_opts);
            })
            .then(function() {
                self.log("Loaded user: " + JSON.stringify(self.user));
                return self.app.setup(self);
            })
            .then(function() {
                return self.emit.setup();
            });
    };

    self.is_in_state = function(state_name) {
        /**:InteractionMachine.is_in_state([state_name])

        Determines whether the IM is in the state represented by
        ``state_name``, or whether the IM is in any state at all if no
        arguments are given.
        
        :param string state_name: the name of the state compare with
        */
        return typeof state_name == 'undefined'
            ? self.state !== null
            : !!self.state && self.state.name === state_name;
    };
    
    self.switch_to_user_state = function() {
        /**:InteractionMachine.switch_to_user_state()

        Delegates to :meth:`InteractionMachine.switch_state`` to switch the IM
        to the user's current state. Returns a promise that is fulfulled once
        the switch has completed.
        */
        var state = self.user.state;
        return self.switch_state(
            state.name,
            state.metadata,
            state.creator_opts);
    };

    self.switch_to_start_state = function() {
        /**:InteractionMachine.switch_to_start_state()

        Delegates to :meth:`InteractionMachine.switch_state`` to switch the IM
        to its start configured start state. Returns a promise that is
        fulfulled once the switch has completed.
        */
        return self.switch_state(self.app.start_state_name, {}, {});
    };

    self.switch_state = function(state_name, metadata, creator_opts) {
        /**:InteractionMachine.switch_state(state_name, metadata, creator_opts)

        Switches the IM to the requested state. Returns a promise that is
        fulfulled once the switch has completed.

        :param string state_name:
            the name of the state to switch to
        :param object metadata:
            metadata about the state.
        :param object creator_opts:
            options to pass to the state creator.

        The following steps are taken:
            * If the IM is already in the requested state, no switch occurs.
            * The IM delegates to its :class:`App`'s ``create_state``.
              to create the new state.
            * An exit event is emitted for both the IM and the IM's current
              state (if it exists).
            * The user's state is reset to the newly created state (the user
              may have already been on this state in some cases, this step just
              ensures this happens for all cases).
            * We update the IM's current state to the new state.
            * An enter event is emitted for both the IM and the new state.
        */
        if (self.is_in_state(state_name)) {
            return Q();
        }

        var p = Q(self.app.states.create(state_name, creator_opts));
        return p.then(function(new_state) {
            return new_state
                .setup(self, metadata)
                .then(function() {
                    return self.emit.state.exit();
                })
                .then(function() {
                    self.state = new_state;
                    self.user.state.reset(new_state, {
                        creator_opts: creator_opts
                    });
                    return self.emit.state.enter(new_state);
                });
        });
    };

    self.fetch_translation = function(lang) {
        /**:InteractionMachine.fetch_translation(lang)

        Retrieve a :class:`Translator` instance corresponding to the
        translations for the given language. Returns a promise that will be
        fulfilled with the retrieved translator.

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

                return new Translator(jed_data);
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
        return self.api_request('log.info', {msg: msg});
    };

    self.err = function(e) {
        /**InteractionMachine.err()
        Invoked when an error is thrown during a run of the IM. Logs the thrown
        error, then terminates the sandbox.
        */
        return self
            .emit(new IMErrorEvent(self, e))
            .then(function() {
                return self.log(e.message);
            })
            .then(function() {
                return self.api.done();
            });
    };

    self.done = function() {
        /**:InteractionMachine.done()
        Saves the user, then terminates the sandbox instance.
        */
        return self
            .emit(new IMShutdownEvent(self))
            .then(function() {
                return self.user.save();
            })
            .then(function() {
                return self.api.done();
            });
    };

    self.api_request = function(cmd_name, cmd) {
        /**:InteractionMachine.api_request(cmd_name, cmd)

        Raw request to the sandbox API.

        :param string cmd_name:
            name of the API request to make.
        :param object cmd:
            API request data.

        Returns a promise fulfilled with the response to the API request, or
        rejected with a :class:`ApiError` if a failure response was given.
        */
        var d = new Q.defer();
        self.api.request(cmd_name, cmd, function(reply) {
            if (reply.success) {
                d.resolve(reply);
            } else {
                d.reject(new ApiError(reply));
            }
        });
        return d.promise;
    };

    self.reply = function(msg, opts) {
        /**:InteractionMachine.reply(msg)

        Send a response from the current state to the user.

        :param boolean opts.translate:
            whether the state should be translated before displaying content to
            the user. The default is ``true``.

        Returns a promise which is fulfilled once the response has been sent.
        */
        opts = opts || {};

        return self
            .switch_to_user_state()
            .then(function() {
                return self.state.continue_session();
            })
            .then(function(continue_session) {
                opts.continue_session = continue_session;

                if (continue_session) { return; }
                var e = new SessionCloseEvent(self, false);
                return self.emit(e);
            })
            .then(function() {
                return self.state.send_reply();
            })
            .then(function(send_reply) {
                if (!send_reply) { return; }
                return self.reply.send(msg, opts);
            });
    };

    self.reply.send = function(msg, opts) {
        opts = _.defaults(opts || {}, {translate: true});

        return Q()
            .then(function() {
                if (!opts.translate) { return; }
                return self.state.translate(self.user.i18n);
            })
            .then(function() {
                return self.state.display();
            })
            .then(function(content) {
                return self.api_request("outbound.reply_to", {
                    content: content,
                    in_reply_to: msg.message_id,
                    continue_session: opts.continue_session
                });
            });
    };

    self.handle_message = function(msg) {
        /**:InteractionMachine.handle_message(msg)

        Delegates to its subordinate message handlers to handle an inbound
        message based on the message's session event type. The fallback message
        handler is defined by
        :func:`InteractionMachine.handle_message.fallback`, which by default
        is an alias for :func:`InteractionMachine.handle_message.resume`.

        :param object msg: the received inbound message.
         **/
        var handler = self.handle_message[msg.session_event];
        handler = handler || self.handle_message.fallback;
        return handler.call(self, msg);
    };

    self.handle_message.close = function(msg) {
        /**:InteractionMachine.handle_message.close(msg)

        Invoked when an inbound message is received with a ``close`` session
        event type. Emits a :class:`SessionCloseEvent` on the interaction
        machine and waits for its listeners to complete their work.

        :param object msg: the received inbound message.
        */
        return self.emit(new SessionCloseEvent(self, true));
    };

    self.handle_message.new = function(msg) {
        /**:InteractionMachine.handle_message.new(msg)

        Invoked when an inbound message is received with a ``new`` session
        event type.

        :param object msg: the received inbound message.

        Does roughly the following:

            * Emits a :class:`SessionNewEvent` on the interaction machine and
              waits for its listeners to complete their work
            * Sends a reply from the current state.
        */
        var e = new SessionNewEvent(self);
        return self
            .emit(e)
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
              and waits for its listeners to complete their work
            * If the message contains usable content, emit a
              :class:`StateInputEvent` on the interaction machine and the
              current state. This allows listeners to change the user to a
              different state (this change is usually performed by the
              currently active state).
            * Send a reply from the current state.
        */
        var p = self.emit(new SessionResumeEvent(self));

        if (msg.content) {
            var e = new StateInputEvent(self.state, msg.content);
            p = p.then(function() {
                return self.state.emit(e);
            });
        }

        return p.then(function() {
            return self.reply(msg);
        });
    };

    self.handle_message.fallback = self.handle_message.resume;

    self.emit.state = {};

    self.emit.state.exit = function() {
        if (!self.is_in_state()) {
            return Q();
        }

        var e = new StateExitEvent(self.state);
        return self
            .emit(e)
            .then(function() {
                return self.state.emit(e);
            });
    };

    self.emit.state.enter = function(state) {
        var e = new StateEnterEvent(state);

        return self
            .emit(e)
            .then(function() {
                return state.emit(e);
            });
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
            * Set up the IM (see :meth:`InteractionMachine.setup`)
            * If the user is currently in a state (from a previous IM run),
              switch to this state.
            * Otherwise, this is a new user, so switch to the IM's configured
              start state
            * Handle the message based on its session event type (see
              :meth:`InteractionMachine.handle_message`).
        */
        var msg = event.cmd.msg;
        self.msg = msg;
        self.log("Received inbound message: " + msg.content);

        var reset = false;
        if (msg.content == "!reset") {
            reset = true;
            msg.content = "";
        }

        return self
            .setup(msg, {reset: reset})
            .then(function() {
                return self.user.is_in_state()
                    ? self.switch_to_user_state()
                    : self.switch_to_start_state();
            })
            .then(function() {
                self.log("Switched to state: " + self.state.name);
                return self.handle_message(msg);
            });
    });

    self.attach();
});


this.InteractionMachine = InteractionMachine;

this.IMEvent = IMEvent;
this.InboundMessageEvent = InboundMessageEvent;
this.InboundEventEvent = InboundEventEvent;
this.UnknownCommandEvent = UnknownCommandEvent;
this.SessionNewEvent = SessionNewEvent;
this.SessionResumeEvent = SessionResumeEvent;
this.SessionCloseEvent = SessionCloseEvent;
