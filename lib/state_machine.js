// state_machine.js
//  - Interaction machine for messages and events.

var jed = require("jed");

var promise = require("./promise.js");
var Promise = promise.Promise;
var maybe_promise = promise.maybe_promise;
var success = promise.success;

var metrics = require("./metrics.js");
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

    self.api = api;
    self.state_creator = state_creator;

    self.msg = null;
    self.user = null;
    self.user_addr = null;
    self.i18n = null;
    self.i18n_lang = null;
    self.current_state = null;
    self.config = null;
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

    self.switch_state = function(state_name) {
        /**:InteractionMachine.switch_state(state_name)

        Switch to a new state.

        :param string state_name:
            Name of the state to switch to.


        This method returns a promise that fires once the state transition is
        complete.

        If the current state has the same name as ``state_name``, no state
        transition occurs. Fires :class:`StateExitEvent` and
        :class:`StateEnterEvent` events as appropriate.
        */
        var p = new Promise();
        if (self.current_state && state_name == self.current_state.name) {
            p.callback();
            return p;
        }
        var old_state_name = (self.current_state ? self.current_state.name :
                              self.user.current_state);
        p.add_callback(self.refresh_i18n);
        p.add_callback(function () {
            return self.state_creator.switch_state(state_name, self);
        });
        p.add_callback(function (new_state) {
            var ev_p;
            if (self.current_state) {
                ev_p = self.on_event(new StateExitEvent(self,
                                                        self.current_state));
            } else {
                ev_p = success();
            }
            var on_exit = (self.current_state ?
                           self.current_state.on_exit :
                           function () {});
            var on_enter = (old_state_name != new_state.name ?
                            new_state.on_enter :
                            function () {});
            ev_p.add_callback(function () {
                return maybe_promise(on_exit());
            });
            ev_p.add_callback(function () {
                self.current_state = new_state;
                self.user.current_state = new_state.name;
                return self.on_event(new StateEnterEvent(self, new_state));
            });
            ev_p.add_callback(function() {
                return maybe_promise(new_state.setup_state(self));
            });
            ev_p.add_callback(function() {
                return maybe_promise(on_enter());
            });
            return ev_p;
        });
        p.callback();
        return p;
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
        var p = new Promise();
        var lang = self.user.lang || self.config.default_lang;
        if (!lang) {
            self.i18n_lang = null;
            self.i18n = new jed({});
            p.callback();
            return p;
        }
        if ((!self.i18n) || (lang != self.i18n_lang)) {
            self.fetch_translation(lang, function (i18n) {
                self.i18n_lang = lang;
                self.i18n = i18n;
                p.callback();
            });
            return p;
        }
        p.callback(); // cached case
        return p;
    };

    self.fetch_config_value = function(key, json, done) {
        /**:InteractionMachine.fetch_config_value(key, json, done)

        Retrieve a value from the sandbox application's Vumi Go
        config.

        :param string key:
            name of the configuration item to retrieve.
        :param boolean json:
            whether to parse the returned value using ``JSON.parse``.
            Defaults to false.
        :param function done:
            function ``f(value)`` to call once the value has been
            returned by the config resource.
        */
        self.api.request("config.get", {key: key},
            function(reply) {
                var value = null;
                if (reply.value && json) {
                    try { value = JSON.parse(reply.value); }
                    catch (e) {}
                }
                else {
                    value = reply.value;
                }
                done(value);
            });
    };

    self.fetch_translation = function(lang, done) {
        /**:InteractionMachine.fetch_translation(lang, done)

        Retrieve a ``jed`` instance containing translations for the given
        language.

        :param string lang:
            two letter language code (e.g. ``sw``, ``en``).
        :param function done:
            function ``f(jed)`` to call with the ``jed`` instance containing
            the translations.

        Translations are retrieve from the sandbox configuration resource
        by looking up keys named ``translation.<language-code>``.
        */
        self.fetch_config_value("translation." + lang, true,
            function(domain_data) {
                var jed_data = {};
                if (domain_data) {
                    jed_data.domain = "messages";
                    jed_data.locale_data = {"messages": domain_data};
                }
                var i18n = new jed(jed_data);
                done(i18n);
            });
    };

    self.setup_config = function() {
        /**:InteractionMachine.setup_config()

        Retrieves the sandbox config and stores it on the interaction machine
        as ``self.config`` for later use. Fires a :class:`ConfigReadEvent` so
        that state creators may perform application specific setup.
        */
        var p = new Promise();
        self.fetch_config_value("config", true,
            function (config) {
                self.config = config || {};
                p.callback();
            });
        p.add_callback(function (reply) {
            return self.on_event(new ConfigReadEvent(self, self.config));
        });
        return p;
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
        var prefix = (self.config.user_store ?
                      self.config.user_store + '.' : '');
        return "users." + prefix + from_addr;
    };

    self.load_user = function(from_addr) {
        /**:InteractionMachine.load_user(from_addr)

        Load a user's current state from the key-value data store resource.

        :param string from_addr:
            The address (e.g. MSISN) of the user.

        Returns a promise that fires once the user data has been loaded.
        */
        var p = new Promise();
        self.user_addr = from_addr;
        self.api.request("kv.get",
            {key: self.user_key(from_addr)},
            function(reply) {
                p.callback(reply);
            });
        p.add_callback(function (reply) {
            self.user = reply.value || {};
            if (!reply.value) {
                return self.on_event(new NewUserEvent(self,
                                                      self.user_addr,
                                                      self.user));
            }
        });
        return p;
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
        var p = new Promise();
        self.api.request("kv.set",
            {
                key: self.user_key(from_addr),
                value: user
            }, p.callback);
        p.add_callback(function(result) {
            if(!result.success) {
                throw new StateError(result.reason);
            }
            return result;
        });
        return p;
    };

    self.on_unknown_command = function(cmd) {
        self.log("Received unknown command: " + JSON.stringify(cmd));
        self.done();
    };

    self.log = function(message) {
        return self.api_request('log.info', {
            'msg': message
        });
    };

    self.done = function() { self.api.done(); };

    self.api_request = function(cmd_name, cmd) {
        var p = new Promise();
        self.api.request(cmd_name, cmd, p.callback);
        return p;
    };

    self.reply = function(msg, save_user) {
        var p = self.switch_state(self.user.current_state);

        p.add_callback(function() {
            var continue_session = self.current_state.continue_session();
            if (!continue_session) {
                return self.on_event(new SessionCloseEvent(self, false));
            }
        });

        if (save_user) {
            p.add_callback(function() {
                self.log("Ending in state: " + self.current_state.name);
                self.log("Saving user: " + JSON.stringify(self.user));
                return self.store_user(msg.from_addr, self.user);
            });
        }

        p.add_callback(function () {
            return maybe_promise(self.current_state.display());
        });

        p.add_callback(function (content) {
            if (self.current_state.send_reply()) {
                var continue_session = self.current_state.continue_session();
                self.api_request("outbound.reply_to", {
                    content: content,
                    in_reply_to: msg.message_id,
                    continue_session: continue_session
                });
            }
        });

        return p;
    };

    self.on_inbound_message = function(cmd) {
        var msg = self.msg = cmd.msg;
        var p = new Promise();

        p.add_callback(self.setup_config);
        p.add_callback(self.setup_metrics);
        p.add_callback(function () {
            return self.load_user(msg.from_addr);
        });
        p.add_callback(function () {
            if (msg.content == "!restart") {
                self.user = {};
                msg.content = "";
            }
            self.log("Loaded user " + self.user_addr + ": " + JSON.stringify(self.user));
            self.log("Content: " + msg.content);
            return self.switch_state(self.user.current_state);
        });
        p.add_callback(function () {
            var ev_p;

            self.log("Switched to state: " + self.current_state.name);
            if (msg.session_event == "close") {
                ev_p = self.on_event(new SessionCloseEvent(self, true));
                ev_p.add_callback(function () {
                    return self.store_user(msg.from_addr, self.user);
                });
                return ev_p;
            }
            else if (msg.session_event == "new") {
                ev_p = self.on_event(new SessionNewEvent(self));
                ev_p.add_callback(function () {
                    var state_done = new Promise();
                    self.current_state.new_session_event(function () {
                        state_done.callback();
                    });
                    return state_done;
                });
                ev_p.add_callback(function () {
                    return self.reply(msg, true);
                });
                return ev_p;
            }
            else {
                ev_p = self.on_event(new SessionResumeEvent(self));
                if (msg.content) {
                    ev_p.add_callback(function() {
                        var state_done = new Promise();
                        self.current_state.input_event(
                            msg.content,
                            function () {
                                state_done.callback();
                            });
                        return state_done;
                    });
                }
                ev_p.add_callback(function() {
                    return self.reply(msg, true);
                });
                return ev_p;
            }
        });
        p.add_callback(self.done);

        p.callback();
    };

    self.on_inbound_event = function(cmd) {
        var event = cmd.msg;

        var p = new Promise();
        p.add_callback(function() {
            return self.on_event(new InboundEventEvent(self, event));
        });
        p.add_callback(self.done);
        p.callback();
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
