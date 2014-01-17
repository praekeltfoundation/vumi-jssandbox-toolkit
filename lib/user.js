var Q = require("q");
var jed = require("jed");

var utils = require("./utils");
var events = require("./events");

var Event = events.Event;
var Eventable = events.Eventable;


function UserEvent(name, user, data) {
    /**class:UserEvent(user)
    An event relating to a user.

    :param string name: the event type's name.
    :param User user: the user associated to the event.
    :param object data: additional event data.
    */

    var self = this;

    data = data || {};
    data.user = user;

    return new Event(name, data);
}

function UserNewEvent(user) {
    /**class:UserNewEvent(user)
    Emitted when a new user is created. This typically happens in
    :class:`InteractionMachine` when message arrives from a user for whom
    there is no user state (i.e. a new unique user), or after a forced
    restart occurs.

    :param User user: the user that was created.

    The event type is ``user:new``.
    */
    return new UserEvent('user:new', user);
}

function UserLoadEvent(user) {
    /**class:UserLoadEvent(user)
    Emitted when an existing user is loaded. This typically happens in
    :class:`InteractionMachine` when message arrives from a user for who
    has already interacted with the system.

    :param User user: the user that was loaded.

    The event type is ``user:load``.
    */
    return new UserEvent('user:load', user);
}

function UserSaveEvent(user) {
    /**class:UserSaveEvent(user)
    Emitted when a user is saved. This typically happens in
    :class:`InteractionMachine` after an inbound message from the user has
    been processed as one of the last actions before terminating the sandbox.

    :param User user: the user that was saved.

    The event type is ``user:save``.
    */
    return new UserEvent('user:save', user);
}


function User(im) {
    /**:User(im)
    :param InteractionMachine im:
        the interaction machine to which this user is associated
    */
    var self = this;
    Eventable.call(self);

    self.im = im;

    self.setup = function(addr, opts) {
        /**:User.setup(addr, opts)
        Sets up the user. Returns a promise that is fulfilled once the setup is
        complete.

        Performs the following steps:
           * Processes the given setup arguments
           * Attempts to refresh the jed gettext translation object (involves
           interaction with the sandbox api).
           * Emits a :class:`SetupEvent`

        :param string addr:
            The address used as a key to load and save the user.
        :param string opts.lang
            The two-letter code of the language the user has selected.
            E.g. `'en'`, `'sw'`.
        :param string opts.lang
            The two-letter code of the language the user has selected.
            E.g. `'en'`, `'sw'`.
        :param string store_name:
            An additional namespace path to be used when storing the user. See
            :meth:`User.key`.
        :param string current_state_name:
            The name of the state most recently visted by the user.
        **/
        opts = utils.set_defaults(opts || {}, {
            lang: null,
            store_name: null,
            answers: {},
            current_state_name: null
        });

        self.addr = addr;
        self.lang = opts.lang;
        self.answers = opts.answers;
        self.store_name = opts.store_name;
        self.current_state_name = opts.current_state_name;
        self.i18n = new jed({});

        return self.refresh_i18n().then(function() {
            return self.emit.setup();
        });
    };

    self.create = function(addr, opts) {
        /**:User.create(addr, opts):
        Invoked to create a new user. Simply delegates to :class:`User.setup`,
        then emits a :class:`UserNewEvent`. Intended to be used to explicitly
        differentiate newly created users from loaded users with a single action.
        */
        return self.setup(addr, opts).then(function() {
            self.emit(new UserNewEvent(self));
        });
    };

    self.load = function(addr, opts) {
        /**:InteractionMachine.load_user(addr, from_addr)

        Load a user's current state from the key-value data store resource,
        then emits a :class:`UserLoadEvent`. Throws an error if loading fails. 

        Returns a promise that is fulfilled when the loading and event emitting
        has completed.

        Accepts the same params as :method:`User.setup`, where the `opts`
        param contains overrides for the loaded user data.
        */
        opts = opts || {};
        return self.fetch(addr, opts.store_name).then(function(data) {
            if (!data) {
                throw new Error("Failed to load user '" + addr + "'");
            }

            opts = utils.set_defaults(opts, data);
            return self.setup(addr, opts).then(function() {
                return self.emit(new UserLoadEvent(self));
            });
        });
    };

    self.load_or_create = function(addr, opts) {
        /**:InteractionMachine.load_user(addr, from_addr)

        Attempts to load a user's current state from the key-value data store
        resource, creating the user if no existing user was found. Emits a
        :class:`UserLoadEvent` if the user was loaded, and a
        :class:`UserNewEvent` if the user was created.

        Returns a promise that is fulfilled when the loading and event emitting
        has completed.

        Accepts the same params as :method:`User.setup`, where the `opts`
        param contains overrides for the loaded user data.
        */
        opts = opts || {};
        return self.fetch(addr, opts.store_name).then(function(data) {
            var event = data
                ? new UserLoadEvent(self)
                : new UserNewEvent(self);

            opts = utils.set_defaults(opts, data || {});
            return self.setup(addr, opts).then(function() {
                return self.emit(event);
            });
        });

    };

    self.make_key = function(addr, store_name) {
        /**:User.make_key(addr[, store_name])
        Makes the key under which to store a user's state. If 
        `store_name` is set, stores the user under
        `'users.<store_name>.<addr>, or otherwise under `<addr>`.

        :param string addr:
            The address used as a key to load and save the user.
        :param string store_name:
            An additional namespace path to be used when storing the user.
        */
        return store_name
            ? "users." + store_name + '.' + addr
            : "users." + addr;
    };

    self.key = function() {
        /**:User.key()
        Returns the key under which to store user state. If 
        :attribute:`User.store_name` is set, stores the user under
        `'users.<store_name>.<addr>, or otherwise under `users.<addr>`.
        */
        return self.make_key(self.store_name, self.addr);
    };
    
    self.set_lang = function(lang) {
        /**:User.set_lang(lang)
        Gives the user a new language. If the user's language has changed,
        their jed gettext object is refreshed (delegates to
        :meth:`User.refresh_i18n`). Returns a promise that will be
        fulfilled once the method's work is complete.

        :param string lang:
            The two-letter code of the language the user has selected.
            E.g. `en`, `sw`.
        */
       var p = Q(self);

       if (self.lang !== lang) {
           self.lang = lang;
           p = self.refresh_i18n();
       }
       
       return p;
    };

    self.refresh_i18n = function() {
        /**:InteractionMachine.refresh_i18n()

        Re-fetches the appropriate language translations. Sets
        :attribute:`User.i8n` to a new ``jed`` instance.

        Returns a promise that fires once the translations have been
        refreshed.
        */
        var p = Q(self);

        if (self.lang) {
            p = self.im
                .fetch_translation(self.lang)
                .then(function(i18n) {
                    self.i18n = i18n;
                    return self;
                });
        }

        return p;
    };

    self.set_current_state_name = function(state_name) {
        /**:User.set_current_state_name(state_name)
        Gives the user a new language. If the user's language has changed,
        their jed gettext object is refreshed (delegates to
        :meth:`User.refresh_i18n`). Returns a promise that will be
        fulfilled once the method's work is complete.

        :param string state_name:
            the name of the new current state
        */
        self.current_state_state = state_name;
        return self;
    };

    self.set_answer = function(state_name, answer) {
        /**:User.set_answer(state_name, answer)
        Sets the user's answer to the state associated with ``state_name``.

        :param string state_name:
            the name of the state to save an answer for
        :param string answer:
            the user's answer to the state
        */
        self.answers[state_name] = answer;
        return self;
    };

    self.get_answer = function(state_name) {
        /**:User.get_answer(state_name)
        Get the user's answer for the state associated with ``state_name``.

        :param string state_name:
            the name of the state to retrieve an answer for
        */
        var answer = self.answers[state_name];

        return typeof answer != 'undefined'
            ? answer
            : null;
    };

    self.fetch = function(store_name, addr) {
        /**:User.fetch()

        Fetches the user's current state data from the key-value data store
        resource. Returns a promised fulfilled with the fetched data.
        */
        return self.im
            .api_request("kv.get", {key: self.make_key(store_name, addr)})
            .then(function (reply) {
                return reply.value;
            });
    };

    self.save = function() {
        /**:User.save()

        Save a user's current state to the key-value data store resource, then
        emits a :class:`UserSaveEvent`.

        Returns a promise that is fulfilled once the user data has been saved
        and events have been emitted.
        */
        return self.im
            .api_request("kv.set", {
                key: self.key(),
                value: self.serialize()
            })
            .then(function(result) {
                if (!result.success) {
                    throw new StateError(result.reason);
                }

                return result;
            })
            .then(function() {
                return self.emit(new UserSaveEvent(self));
            });
    };

    self.serialize = function() {
        /**:User.serialize()
        Returns an object representing the user. Suitable for JSON
        stringifying and storage purposes.
        */
        return {
            addr: self.addr,
            lang: self.lang,
            answers: self.answers,
            current_state_name: self.current_state_name
        };
    };

    /**meth:User.toJSON()
    Alias to :class:`User.serialize`. Allows the user to be used with
    :func:`JSON.stringify()`.
    */
    self.toJSON = self.serialize;
}


this.User = User;
