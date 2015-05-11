var Q = require('q');
var _ = require('lodash');

var data = require('./states/data');
var StateData = data.StateData;

var events = require('./events');
var Event = events.Event;
var Eventable = events.Eventable;

var translate = require('./translate');
var Translator = translate.Translator;


var UserEvent = Event.extend(function(self, name, user) {
    /**class:UserEvent(user)

    An event relating to a user.

    :param string name: the event type's name.
    :param User user: the user associated to the event.
    */
    Event.call(self, name);
    self.user = user;
});


var UserNewEvent = UserEvent.extend(function(self, user) {
    /**class:UserNewEvent(user)

    Emitted when a new user is created. This typically happens in
    :class:`InteractionMachine` when message arrives from a user for whom
    there is no user state (i.e. a new unique user).

    :param User user: the user that was created.

    The event type is ``user:new``.
    */
    UserEvent.call(self, 'user:new', user);
});


var UserResetEvent = UserEvent.extend(function(self, user) {
    /**class:UserNewEvent(user)

    Emitted when a user's data is reset. This typically happens in
    :class:`InteractionMachine` when message arrives from a user for whom
    with its content being "!reset", forcing the user to be reset.

    :param User user: the user that was reset.

    The event type is ``user:reset``.
    */
    UserEvent.call(self, 'user:reset', user);
});


var UserLoadEvent = UserEvent.extend(function(self, user) {
    /**class:UserLoadEvent(user)

    Emitted when an existing user is loaded. This typically happens in
    :class:`InteractionMachine` when message arrives from a user for who
    has already interacted with the system.

    :param User user: the user that was loaded.

    The event type is ``user:load``.
    */
    UserEvent.call(self, 'user:load', user);
});


var UserSaveEvent = UserEvent.extend(function(self, user) {
    /**class:UserSaveEvent(user)

    Emitted when a user is saved. This typically happens in
    :class:`InteractionMachine` after an inbound message from the user has
    been processed as one of the last actions before terminating the sandbox.

    :param User user: the user that was saved.

    The event type is ``user:save``.
    */
    UserEvent.call(self, 'user:save', user);
});


var User = Eventable.extend(function(self, im) {
    /**:User(im)

    A structure for managing the current user being interacted with in
    :class:`InteractionMachine`.

    :param InteractionMachine im:
        the interaction machine to which this user is associated
    */
    Eventable.call(self);

    self.im = im;

    self.defaults = {
        lang: null,
        store_name: 'default',
        answers: {},
        metadata: {},
        in_session: false,
        creation_event: new UserNewEvent(self)
    };

    self.init = function(addr, opts) {
        opts = _.defaults(opts || {}, self.defaults);

        self.addr = addr;
        self.lang = opts.lang;
        self.answers = opts.answers;
        self.store_name = opts.store_name;
        self.i18n = new Translator();
        self.state = new StateData(opts.state);
        self.metadata = opts.metadata;
        self.creation_event = opts.creation_event;
        self.in_session = opts.in_session;
    };
    self.init();

    Object.defineProperty(self, 'created', {
        get: function() {
            /**attribute:User.created
            Whether this is a new or loaded user.
            */
            return self.creation_event instanceof UserNewEvent;
        }
    });

    self.setup = function(addr, opts) {
        /**:User.setup(addr, opts)
        Sets up the user. Returns a promise that is fulfilled once the setup is
        complete.

        Performs the following steps:
           * Processes the given setup arguments
           * Attempts to refresh the translator (involves
             interaction with the sandbox api).
           * Emits a :class:`SetupEvent`

        :param string addr:
            the address used as a key to load and save the user.
        :param string opts.lang:
            the two-letter code of the language the user has selected.
            E.g. `'en'`, `'sw'`.
        :param string opts.store_name:
            an additional namespace path to be used when storing the user. See
            :meth:`User.key`.
        :param string opts.state.name:
            the name of the state most recently visited by the user.
            Optional.
        :param string opts.state.metadata:
            metadata about the state most recently visited by the user.
            Optional.
        :param boolean opts.in_session:
            whether the user is currently in a session. Defaults to ``false``.
        */
        self.init(addr, opts);
        return self.refresh_i18n().then(function() {
            return self.emit.setup();
        });
    };

    self.is_in_state = function(state_name) {
        /**:User.is_in_state([state_name])
        Determines whether the user is in the state represented by
        ``state_name``, or whether the user is in any state at all if no
        arguments are given.

        :param string state_name: the name of the state compare with
        */
        return arguments.length
            ? self.state.is(state_name)
            : self.state.exists();
    };

    self.reset = function(addr, opts) {
        /**:User.reset(addr, opts)
        Invoked to create a new user. Simply delegates to :class:`User.setup`,
        but sets the user's ``creation_event`` to a :class:`UserResetEvent`.
        Intended to be used to explicitly differentiate reset users from both
        newly created users and loaded users with a single action.
        */
        return self.setup(addr, _.extend(opts || {}, {
            creation_event: new UserResetEvent(self)
        }));
    };

    self.create = function(addr, opts) {
        /**:User.create(addr, opts)
        Invoked to create a new user. Simply delegates to :class:`User.setup`,
        but sets the user's ``creation_event`` to :class:`UserNewEvent`. Intended
        to be used to explicitly differentiate newly created users from loaded
        users with a single action.
        */
        return self.setup(addr, _.extend(opts || {}, {
            creation_event: new UserNewEvent(self)
        }));
    };

    self.load = function(addr, opts) {
        /**:User.load(addr[, opts])

        Load a user's current state from the key-value data store resource,
        then sets the user's ``creation_event`` to :class:`UserLoadEvent`. Throws
        an error if loading fails.

        Returns a promise that is fulfilled when the loading and event emitting
        has completed.

        Accepts the same params as :meth:`User.setup`, where the `opts`
        param contains overrides for the loaded user data.
        */
        opts = _.defaults(opts || {}, self.defaults);
        return self.fetch(addr, opts.store_name).then(function(data) {
            if (!data) {
                throw new Error("Failed to load user '" + addr + "'");
            }

            opts = _.extend(opts, data);
            return self.setup(addr, _.extend(opts || {}, {
                creation_event: new UserLoadEvent(self)
            }));
        });
    };

    self.load_or_create = function(addr, opts) {
        /**:User.load_or_create(addr[, opts])

        Attempts to load a user's current state from the key-value data store
        resource, creating the user if no existing user was found. Sets the
        user's ``creation_event`` to :class:`UserLoadEvent` if the user was loaded,
        and :class:`UserNewEvent` if the user was created.

        Returns a promise that is fulfilled when the loading and event emitting
        has completed.

        Accepts the same params as :meth:`User.setup`, where the `opts`
        param contains overrides for the loaded user data.
        */
        opts = _.defaults(opts || {}, self.defaults);
        return self.fetch(addr, opts.store_name).then(function(data) {
            opts = _.extend(opts, data || {});
            return self.setup(addr, _.extend(opts || {}, {
                creation_event: data
                    ? new UserLoadEvent(self)
                    : new UserNewEvent(self)
            }));
        });

    };

    self.key = function() {
        /**:User.key()
        Returns the key under which to store user state. If
        ``user.store_name`` is set, stores the user under
        ``users.<store_name>.<addr>``, or otherwise under ``users.<addr>``.
        */
        return User.make_key(self.addr, self.store_name);
    };

    self.set_lang = function(lang) {
        /**:User.set_lang(lang)
        Gives the user a new language. If the user's language has changed,
        their translator is is refreshed (delegates to
        :meth:`User.refresh_i18n`). Returns a promise that will be
        fulfilled once the method's work is complete.

        :param string lang:
            The two-letter code of the language the user has selected.
            E.g. `en`, `sw`.
        */
       var p = Q();

       if (self.lang !== lang) {
           self.lang = lang;
           p = self.refresh_i18n();
       }

       return p;
    };

    self.refresh_i18n = function() {
        /**:User.refresh_i18n()

        Re-fetches the appropriate language translations. Sets
        ``user.i8n`` to a new :class:`Translator` instance.

        Returns a promise that fires once the translations have been
        refreshed.
        */
        var p = Q();

        if (self.lang) {
            p = self.im
                .fetch_translation(self.lang)
                .then(function(i18n) {
                    self.i18n = i18n;
                });
        }

        return p;
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
    };

    self.get_answer = function(state_name) {
        /**:User.get_answer(state_name)
        Get the user's answer for the state associated with ``state_name``.

        :param string state_name:
            the name of the state to retrieve an answer for
        */
        return self.answers[state_name];
    };

    self.fetch = function(addr, store_name) {
        /**:User.fetch()

        Fetches the user's current state data from the key-value data store
        resource. Returns a promised fulfilled with the fetched data.
        */
        return self.im
            .api_request("kv.get", {key: User.make_key(addr, store_name)})
            .then(function (reply) {
                return reply.value;
            });
    };

    self.default_ttl = function() {
        /**:User.default_ttl()

        Returns the default expiry time of saved user state (in seconds).

        This may be set using the ``user_ttl`` sandbox config key. It
        defaults to 604800 seconds (seven days). Expiry may be disabled by
        setting ``user_ttl`` to ``null``.
        */
        var ttl = self.im.config.user_ttl;
        return (typeof ttl !== 'undefined') ? ttl : 604800;
    };

    self.save = function(opts) {
        /**:User.save()

        Save a user's current state to the key-value data store resource, then
        emits a :class:`UserSaveEvent`.

        :param object opts.seconds:
            How long the user's state should be stored for before expiring. See
            :meth:`User.default_ttl` for how the default is determined.

        Returns a promise that is fulfilled once the user data has been saved
        and events have been emitted.
        */
        opts = _.defaults(opts || {}, {
            seconds: self.default_ttl(),
        });
        return self.im
            .api_request("kv.set", {
                key: self.key(),
                value: self.serialize(),
                seconds: opts.seconds,
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
            metadata: self.metadata,
            in_session: self.in_session,
            state: self.state.serialize()
        };
    };

    /**meth:User.toJSON()
    Alias to :class:`User.serialize`. Allows the user to be used with
    :func:`JSON.stringify()`.
    */
    self.toJSON = self.serialize;

    self.emit.creation_event = function() {
        return self.emit(self.creation_event);
    };
});


User.make_key = function(addr, store_name) {
    /**:User.make_key(addr[, store_name])
    Makes the key under which to store a user's state. If
    `store_name` is set, stores the user under
    ``'users.<store_name>.<addr>``, or otherwise under ``<addr>``.

    :param string addr:
        The address used as a key to load and save the user.
    :param string store_name:
        The namespace path to be used when storing the user.
    */
    return "users." + store_name + '.' + addr;
};


this.User = User;

this.UserEvent = UserEvent;
this.UserNewEvent = UserNewEvent;
this.UserSaveEvent = UserSaveEvent;
this.UserLoadEvent = UserLoadEvent;
this.UserResetEvent = UserResetEvent;
