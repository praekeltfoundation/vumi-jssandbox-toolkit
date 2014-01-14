// state_machine.js
//  - Interaction machine for messages and events.

var jed = require("jed");
var Q = require("q");

var utils = require("./utils");
var metrics = require("./metrics");
var MetricStore = metrics.MetricStore;

var states = require("./states");
var StateError = states.StateError;
var EndState = states.EndState;


function IMEvent(event, im, data) {
    /**class:IMEvent

    An event fired by the interaction machine.

    :param string ev: the event type.
    :param InteractionMachine im: the interaction machine firing the event.
    :param object data: additional event data.
    */

    var self = this;

    self.event = event; // event type
    self.im = im; // interaction machine
    self.data = data; // event data
}

function ConfigReadEvent(im, config) {
    /**class:ConfigReadEvent

    :class:`IMEvent` fired immediately after sandbox configuration is read.

    :param InteractionMachine im: the interaction machine firing the event.
    :param object config: the config object.

    The event type is ``config_read``.
    */

    return new IMEvent('config_read', im, {config: config});
}

function SessionNewEvent(im) {
    /**class:SessionNewEvent

    :class:`IMEvent` fired when a new user session starts.

    :param InteractionMachine im: the interaction machine firing the event.

    The event type is ``session_new``.
    */
    return new IMEvent('session_new', im, {});
}

// TODO: rename possible_timeout
function SessionCloseEvent(im, possible_timeout) {
    /**class:SessionCloseEvent

    :class:`IMEvent` fired when a user session ends.

    :param InteractionMachine im: the interaction machine firing the event.
    :param possible_timeout boolean:
        true if the session was terminated by the user (including
        when the user session times out) and false if the session
        was closed explicitly by the sandbox application.

    The event type is ``session_close``.
    */

    return new IMEvent('session_close', im,
                       {possible_timeout: possible_timeout});
}

function SessionResumeEvent(im) {
    /**class:SessionResumeEvent

    :class:`IMEvent` fired when a new user message arrives for an existing
    user session.

    :param InteractionMachine im: the interaction machine firing the event.

    The event type is ``session_resume``.
    */

    return new IMEvent('session_resume', im, {});
}

function NewUserEvent(im, user_addr, user) {
    /**class:NewUserEvent

    :class:`IMEvent` fired when a message arrives from a user for whom
    there is no user state (i.e. a new unique user).

    :param InteractionMachine im: the interaction machine firing the event.

    The event type is ``new_user``.
    */

    return new IMEvent('new_user', im, {user_addr: user_addr, user: user});
}

// TODO: add user parameter
function StateEnterEvent(im, state) {
    /**class:StateEnterEvent

    :class:`IMEvent` fired when a user enters a state from a different
    state.

    :param InteractionMachine im: the interaction machine firing the event.
    :param object state: the state object being entered.

    The event type is ``state_enter``.
    */

    return new IMEvent('state_enter', im, {state: state});
}

function StateExitEvent(im, state, user) {
    /**class:StateExitEvent

    :class:`IMEvent` fired when a user exits a state to a different state.

    :param InteractionMachine im: the interaction machine firing the event.
    :param object state: the state being left.
    :param object user: the user leaving the state.

    The event type is ``state_exit``.
    */

    return new IMEvent('state_exit', im, {state:state});
}

function InboundEventEvent(im, event) {
    /**class:InboundEventEvent

    :class:`IMEvent` fired when an message status event is
    received. Typically this is either an acknowledgement or a
    delivery report for an outbound message that was sent from the
    sandbox application.

    :param InteractionMachine im: the interaction machine firing the event.
    :param object event: the event message received.

    The event type is ``inbound_event``.
    */

    return new IMEvent('inbound_event', im, {event: event});
}

function InteractionMachine(api, state_creator) {
    /**class:InteractionMachine

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

    var self = this;

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
    :meth:`InteractionMachine.on_inbound_message` is called.
    */
    self.msg = null;

    /**attribute:InteractionMachine.user

    User data for the current user. Available once
    :meth:`InteractionMachine.load_user` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.user = null;

    /**attribute:InteractionMachine.user_addr

    Address of current user (e.g. their MSISDN). Available
    once :meth:`InteractionMachine.load_user` has been called
    by :meth:`InteractionMachine.on_inbound_message`.
    */
    self.user_addr = null;

    /**attribute:InteractionMachine.i18n

    A jed gettext object for the current user. Updated whenever a new state is
    entered via a called to :meth:`InteractionMachine.switch_state`.
    */
    self.i18n = null;

    /**attribute:InteractionMachine.i18n_lang

    Two-letter language code for the user's language. Updated whenever a new
    state is entered via a called to :meth:`InteractionMachine.switch_state`.
    */
    self.i18n_lang = null;

    /**attribute:InteractionMachine.current_state

    The current :class:`State` object. Updated whenever a new state is entered
    via a called to :meth:`InteractionMachine.switch_state`.
    */
    self.current_state = null;

    /**attribute:InteractionMachine.config

    The value of the `config` key retrieved from the sandbox config resource.
    Available once :meth:`InteractionMachine.setup_config` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.config = null;

    /**attribute:InteractionMachine.metrics

    A default :class:`MetricStore` instance. Available once
    :meth:`InteractionMachine.setup_metrics` has been called by
    :meth:`InteractionMachine.on_inbound_message`.
    */
    self.metrics = null;

    self.get_msg = function() {
        /**:InteractionMachine.get_msg()

        Returns the inbound user msg object currently being processed by
        the interaction machine. Returns ``null`` if no message is being
        processed.
        */
      return JSON.parse(JSON.stringify(self.msg));
    };

    //TODO: create a richer user object.
    self.set_user_lang = function(lang) {
        /**:InteractionMachine.set_user_lang(lang)

        :param string lang:
            The two-letter code of the language the user has selected.
            E.g. `en`, `sw`.
        */
        self.user.lang = lang;
    };

    self.set_user_answer = function(state_name, answer) {
        /**:InteractionMachine.set_user_answer(state_name, answer)

        Sets the answer for the given state.

        :param string state_name: name of the state the answer is for.
        :param object value: value of the answer (usually a string).

        This is called by :class:`State` objects when they determine that
        the user has submitted an answer.
        */
        if (!self.user.answers) self.user.answers = {};
        self.user.answers[state_name] = answer;
    };

    self.get_user_answer = function(state_name) {
        /**:InteractionMachine.get_user_answer(state_name)

        Return the answer stored for a particular state.

        :param string state_name:
            name of the state to retrieve the answer for.

        Returns the value stored or ``null`` if no value is found.
        */
        if (!self.user.answers) return null;
        var answer = self.user.answers[state_name];
        return (typeof answer == 'undefined') ? null : answer;
    };

    self.set_user_state = function(state_name) {
        /**:InteractionMachine.set_user_state(state_name)

        Sets the stored value of the user's current state.

        :param string state_name:
            name of the state the user is now in.

        This only sets the stored value of the user's state. Actual state
        changes are handled by ``switch_state()`` which calls this method.
        */
        self.user.current_state = state_name;
    };

    // TODO: perhaps this should just be called automatically when
    //       the interaction machine is creatd?
    self.attach = function() {
        /**:InteractionMachine.attach()

        Register the interaction machine's ``on_unknown_command``,
        ``on_inbound_message`` and ``on_inbound_event`` with the sandbox
        API and set the interaction machine itself as ``api.im``.
        */
        self.api.on_unknown_command = self.on_unknown_command;
        self.api.on_inbound_message = self.on_inbound_message;
        self.api.on_inbound_event = self.on_inbound_event;
        self.api.im = self;
    };

    self.on_event = function(event) {
        /**:InteractionMachine.event(event)

        Fire an event from the interaction machine to its state creator.

        :param IMEvent event: the event to fire.
        */
        return self.state_creator.on_event(event);
    };

    self.get_current_state_name = function() {
        return self.current_state
            ? self.current_state.name
            : self.user.current_state;
    };

    self.set_current_state = function(new_state) {
        self.current_state = new_state;
        self.user.current_state = new_state.name;
    };

    self.switch_state = function(state_name) {
        /**:InteractionMachine.switch_state(state_name)

        Switch to a new state.

        :param string state_name:
            Name of the state to switch to.


        This method returns a promise that fires once the state transition is
        complete.

        The steps taken here are as follows:
            1. If the current state has the same name as ``state_name``, no
            state transition occurs. Fires :class:`StateExitEvent` and
            :class:`StateEnterEvent` events as appropriate
            2. Otherwise, we refresh the user's language settings (in case
            these may have changed)
            3. We delegate to the interaction machine's ``state_creator`` to
            switch to the state associated to ``state_name``
            4. If the interaction machine's current state is set:
                4.1. Fire a :class:`StateExitEvent` on the interaction machine
                4.2. Invoke the current state's ``on_exit`` handler
            5. Set the current state to the newly created state
            6. Fire a :class:`StateEnterEvent` on the interaction machine
            7. Call the new state's ``setup_state`` with the interaction machine
            8. Invoke the new state's ``on_enter`` handler
        */

        var p = Q();

        if (self.get_current_state_name() === state_name) {
            return p;
        }

        return p
            .then(self.refresh_i18n())
            .then(function () {
                return self.state_creator.switch_state(state_name, self);
            })
            .then(function(new_state) {
                var p = Q();
                var e;

                if (self.current_state) {
                    e = new StateExitEvent(self, self.current_state);

                    p = p
                        .then(self.on_event(e))
                        .then(function() {
                            return self.current_state.on_exit();
                        });
                }

                self.set_current_state(new_state);

                e = new StateEnterEvent(self, new_state);
                return p
                    .then(self.on_event(e))
                    .then(function() {
                        return new_state.setup_state(self);
                    })
                    .then(function() {
                        return new_state.on_enter();
                    });
            });
    };

    self.refresh_i18n = function() {
        /**:InteractionMachine.refresh_i18n()

        Re-fetches the appropriate language translations if the user's language
        setting has changed since translations were last loaded. Sets
        ``self.i18n`` to a new ``jed`` instance and sets ``self.i18n_lang`` to
        ``self.user.lang``.

        Returns a promise that fires once the translations have been
        refreshed.
        */
        var p = Q();
        var lang = self.user.lang || self.config.default_lang;

        if (!lang) {
            self.i18n_lang = null;
            self.i18n = new jed({});
            return p;
        }

        if ((!self.i18n) || (lang != self.i18n_lang)) {
            p.then(self.fetch_translation(lang)).then(function (i18n) {
                self.i18n_lang = lang;
                self.i18n = i18n;
            });
        }

        return p;
    };

    self.fetch_config_value = function(key, opts) {
        /**:InteractionMachine.fetch_config_value(key, json)

        Retrieve a value from the sandbox application's Vumi Go config. Returns
        a promise that will be fulfilled with the config value.

        :param string key:
            name of the configuration item to retrieve.
        :param boolean opts.json:
            whether to parse the returned value using ``JSON.parse``.
            Defaults to ``false``.
        */
        opts = utils.set_defaults(opts || {}, {json: false});

        return self
            .api_request("config.get", {key: key})
            .then(function(reply) {
                return typeof reply.value != "undefined" && opts.json
                    ? JSON.parse(reply.value)
                    : reply.value;
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
        return self
            .fetch_config_value("translation." + lang, {json: true})
            .then(function(domain_data) {
                var jed_data = {};

                if (domain_data) {
                    jed_data.domain = "messages";
                    jed_data.locale_data = {messages: domain_data};
                }

                return new jed(jed_data);
            });
    };

    self.setup_config = function() {
        /**:InteractionMachine.setup_config()

        Retrieves the sandbox config and stores it on the interaction machine
        as ``self.config`` for later use. Fires a :class:`ConfigReadEvent` so
        that state creators may perform application specific setup. Returns a
        promised that will be fulfilled once the config has been stored and the
        config read event handled.
        */
        return self
            .fetch_config_value("config", {json: true})
            .then(function (config) {
                self.config = config || {};
                return self.on_event(new ConfigReadEvent(self, self.config));
            });
    };

    self.setup_metrics = function() {
        /**:InteractionMachine.setup_metrics()

        Assign a :class:`MetricStore` instance to ``self.metrics``. The store
        name is read from ``self.config.metric_store`` (with the name ``default``
        as the default).
        */
        var store = self.config.metric_store || 'default';
        self.metrics = new MetricStore(self.api, store);
    };

    self.user_key = function(from_addr) {
        /**:InteractionMachine.user_key(from_addr)

        Return the key under which to store user state for the given
        ``from_addr``.

        :param string from_addr:
            The address (e.g. MSISDN) of the user.

        User state may be namespaced by setting ``config.user_store``
        to a prefix to store the application's users under.
        */
        return self.config.user_store
            ? "users." + self.config.user_store + '.' + from_addr
            : "users." + from_addr;
    };

    self.load_user = function(from_addr) {
        /**:InteractionMachine.load_user(from_addr)

        Load a user's current state from the key-value data store resource.

        :param string from_addr:
            The address (e.g. MSISN) of the user.

        Returns a promise that fires once the user data has been loaded.
        */

        self.user_addr = from_addr;
        return self
            .api_request("kv.get", {key: self.user_key(from_addr)})
            .then(function (reply) {
                self.user = reply.value || {};

                var e;
                var p;
                if (!reply.value) {
                    e = new NewUserEvent(self, self.user_addr, self.user);
                    p = self.on_event(e);
                }

                return p;
            });
    };

    self.store_user = function(from_addr, user) {
        /**:InteractionMachine.store_user(from_addr, user)

        Save a user's current state to the key-value data store resource.

        :param string from_addr:
            The address (e.g. MSISN) of the user.
        :param object user:
            The user state to save.

        Returns a promise that fires once the user data has been saved.
        */
        return self
            .api_request("kv.set", {
                key: self.user_key(from_addr),
                value: user
            })
            .then(function(result) {
                if (!result.success) {
                    throw new StateError(result.reason);
                }

                return result;
            });
    };

    self.on_unknown_command = function(cmd) {
        /**:InteractionMachine.on_unknown_command(cmd)

        Called by the sandbox API when a command without a handler is
        received. Logs an error and terminates the sandbox instance.

        :param object cmd:
            The API request that no command handler was found for.

        The handlers currently implemented are:

        * :func:`InteractionMachine.on_inbound_message`
        * :func:`InteractionMachine.on_inbound_event`
        */
        self.log("Received unknown command: " + JSON.stringify(cmd));
        self.done();
    };

    self.log = function(message) {
        /**:InteractionMachine.log(message)

        Log a message to the sandbox logging resource at the ``info`` level.

        :param string message:
            the log message.

        Returns a promise that fires once the log message as been
        acknowledged by the logging resource.
        */
        return self.api_request('log.info', {
            'msg': message
        });
    };

    self.done = function() {
        /**:InteractionMachine.done()

        Terminate this sandbox instance.
        */
        self.api.done();
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
        /**:InteractionMachine.reply(msg, save_user)

        Send a response from the current state to the user.

        :param object msg:
            the inbound message being replied to.
        :param boolean opts.save_user:
            whether to save the user state. Defaults to ``false``.

        Returns a promise which fires once the response has been sent and
        the user state successfully stored.
        */
        opts = utils.set_defaults(opts || {}, {save_user: false});

        return self
            .switch_state(self.user.current_state)
            .then(function() {
                if (!self.current_state.continue_session()) {
                    return self.on_event(new SessionCloseEvent(self, false));
                }
            })
            .then(function() {
                if (opts.save_user) {
                    self.log("Ending in state: " + self.current_state.name);
                    self.log("Saving user: " + JSON.stringify(self.user));
                    return self.store_user(msg.from_addr, self.user);
                }
            })
            .then(function () {
                return self.current_state.display();
            })
            .then(function (content) {
                if (self.current_state.send_reply) {
                    return self.api_request("outbound.reply_to", {
                        content: content,
                        in_reply_to: msg.message_id,
                        continue_session: self.current_state.continue_session()
                    });
                }
            });
    };

    self.on_inbound_message = function(cmd) {
        /**:InteractionMachine.on_inbound_message(cmd)

        Handle an inbound user message triggering state transitions and events
        as necessary.

        :param object cmd:
            The API request cmd containing the inbound user message.

        The steps performed by this method are roughly:

        * :func:`InteractionMachine.setup_config`
        * :func:`InteractionMachine.setup_metrics`
        * :func:`InteractionMachine.load_user`
        * Switch to the user's previous state using
          :func:`InteractionMachine.switch_state`.
        * Fire a :class:`SessionCloseEvent`, :class:`SessionNewEvent` or
          :class:`SessionResumeEvent` event as appropriate.
        * Call the current state's ``input_event`` method for resumed sessions
          of the current state's ``new_session_event`` method for new
          sessions.
        * Send a reply from the current state if the session was not closed.

        Afterwards this method terminates the sandbox.
        */
        var msg = self.msg = cmd.msg;

        return self
            .setup_config()
            .then(function() {
                return self.setup_metrics();
            })
            .then(function() {
                return self.load_user(msg.from_addr);
            })
            .then(function() {
                if (msg.content == "!restart") {
                    self.user = {};
                    msg.content = "";
                }

                self.log(
                    "Loaded user " + self.user_addr + ": " +
                    JSON.stringify(self.user));

                self.log("Content: " + msg.content);
                return self.switch_state(self.user.current_state);
            })
            .then(function() {
                self.log("Switched to state: " + self.current_state.name);
                var handler = self.message_handlers[msg.session_event];
                handler = handler || self.message_handlers.resume;
                return handler(msg);
            });
    };

    self.message_handlers = {};

    self.message_handlers.close = function(msg) {
        var e = new SessionCloseEvent(self, true);
        return Q(self.on_event(e)).then(function () {
            return self.store_user(msg.from_addr, self.user);
        });
    };

    self.message_handlers.new = function(msg) {
        return Q(self.on_event(new SessionNewEvent(self)))
            .then(function () {
                return self.current_state.new_session_event();
            })
            .then(function () {
                return self.reply(msg, {save_user: true});
            });
    };

    self.message_handlers.resume = function(msg) {
        return Q(self.on_event(new SessionResumeEvent(self)))
            .then(function() {
                if (msg.content || msg.content === '') {
                    return self.current_state.input_event(msg.content);
                }
            })
            .then(function() {
                return self.reply(msg, {save_user: true});
            });
    };

    self.on_inbound_event = function(cmd) {
        /**:InteractionMachine.on_inbound_event(cmd)

        Handle a message event (e.g. an acknowledgement or delivery report).

        :param object cmd:
            The API request cmd containing the message event.

        Fires an :class:`InboundEventEvent` containing the event.

        This method terminates the sandbox once the event has been processed.
        */
        var e = new InboundEventEvent(self, cmd.msg);
        return Q(self.on_event(e)).then(function() {
            return self.done();
        });
    };
}

function StateCreator(start_state) {
    /**class:StateCreator

    :param string start_state:
        Name of the initial state. New users will enter this
        state when they first interact with the sandbox
        application.

    A set of states defining a sandbox application. States may
    be either statically created via ``add_state``, dynamically
    loaded via ``add_creator`` or completely dynamically defined
    by overriding ``switch_state``.
    */
    var self = this;

    self.start_state = start_state;
    self.state_creators = {};

    self.on_event = function(event) {
        /**:StateCreator.on_event(event)

        :param IMEvent event: the event being fired.

        Called by the interaction machine when an :class:`IMEvent`
        is fired. This method dispatches events to handler methods
        named ``on_<event_type>`` if such a handler exist.

        Handlers should accept a single parameter, namely the event
        being fired.

        Handler methods may return promises.
        */

        var handler = self['on_' + event.event];
        if (typeof handler != 'undefined') {
            return maybe_promise(handler(event));
        }
        return success();
    };

    self.add_creator = function(state_name, state_creation_function) {
        /**:StateCreator.add_creator(state_name, state_creation_function)

        :param string state_name: name of the state
        :param function state_creation_function:
            A function ``func(state_name, im)`` for creating the
            state. This function should take the state name and
            interaction machine as parameters and should return a
            state object either directly or via a promise.
        */

        if (self.state_creators[state_name]) {
            throw new StateError("Duplicate state '" + state_name + "'");
        }
        self.state_creators[state_name] = state_creation_function;
    };

    self.add_state = function(state, translate) {
        /**:StateCreator.add_state(state, translate)

        :param State state: the state to add.
        :param boolean translate:
            whether the state should be re-translated each time it
            is accessed. The default is true.
        */
        translate = (typeof translate == 'undefined') ? true : translate;
        self.add_creator(state.name, function(state_name, im) {
            if (translate) {
                state.translate(im.i18n);
            }
            return state;
        });
    };

    self.error_state_creator = function(state_name, im) {
        /**:StateCreator.error_state_creator(state_name, im)

        :param string state_name:
            the name of the state for which an error occurred.
        :param InteractionMachine im:
            the interaction machine in which the error occurred.

        This default implementation creates an EndState with name
        ``state_name`` and content *"An error occurred. Please try again later"*.

        The end state created has the next state set to null so that:

        * It won't set the next state.
        * When ``switch_state()`` is next reached, we identify that the user
          currently has no state, and use the start state instead.

        If the start state still does not exist, another error state
        will be created.
        */
        return new EndState(
            state_name,
            "An error occurred. Please try again later.",
            null);
    };

    self.start_state_creator = function(state_name, im) {
        /**:State.start_state_creator(state_name, im)

        :param string state_name:
            the name of the start state.
        :param InteractionMachine im:
            the interaction machine the start state is for.

        This default implemenation looks up a creator for the state named
        ``state_name`` and calls that. If no such creator exists, it calls
        ``error_state_creator`` instead.

        */
        var creator = self.state_creators[state_name];
        if (creator) { return creator.call(self, state_name, im); }

        im.log("Unknown start state '" + state_name + "'. " +
               "Switching to" + " error state.");

        return self.error_state_creator.call(self, '__error__', im);
    };

    self.switch_state = function(state_name, im) {
        /**:StateCreator.switch_state(state_name, im)

        :param string state_name:
            the name of the state to switch to.
        :param InteractionMachine im:
            the interaction machine the state is for.

        Looks up a creator for the given state_name and calls it. If the
        state name is undefined, calls ``start_state_creator`` instead.

        This function returns a promise.

        It may be overridden by :class:`StateCreator` subclasses that wish
        to provide a completely dynamic set of states.
        */
        var creator;

        if (typeof state_name == "undefined") {
            // handles new users who have no current state
            creator = self.start_state_creator;
            state_name = self.start_state;
        } else if (!self.state_creators[state_name]) {
            // handles users who somehow have an unknown state
            // (possibly they are in a state from a previous version
            // of the js application).
            im.log("Unknown state '" + state_name + "'. Switching to" +
                   " start state, '" + self.start_state + "'.");
            creator = self.start_state_creator;
            state_name = self.start_state;
        } else {
            creator = self.state_creators[state_name];
        }

        return maybe_promise(creator.call(self, state_name, im));
    };
}


// export

this.InteractionMachine = InteractionMachine;
this.StateCreator = StateCreator;
