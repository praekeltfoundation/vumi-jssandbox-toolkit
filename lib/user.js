var Q = require('q');
var _ = require('lodash');

var states = require('./states');
var State = states.State;

var utils = require('./utils');
var Extendable = utils.Extendable;

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
    /**class:UserResetEvent(user)

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


var UserStateData = Extendable.extend(function(self, obj, opts) {
    /**class:UserStateData([obj, opts])
    Structure for keeping track of the user's current state. Used
    as a wrapper so that externally, it can be interacted with the same,
    regardless of whether it is currently holding an actual :class:`State`
    instance or data about a state that is yet to be created.

    The constructor arguments are identical to those of
    :meth:`UserStateData.reset`.
    */
    Object.defineProperty(self, 'name', {
        get: function() {
            /**attribute:UserStateData.name
            The currently tracked state's name.
            */
            return self.state.name;
        }
    });

    Object.defineProperty(self, 'metadata', {
        get: function() {
            /**attribute:UserStateData.metadata
            The currently tracked state's metadata.
            */
            return self.state.metadata;
        }
    });

    self.reset = function(obj, opts) {
        /**:UserStateData.reset(state[, opts])
        Resets the user's current state to an already created state.

        :param State state:
            the state instance to use as the user's current state
        :param object opts.creator_opts:
            options to be given to the creator when the state needs to be
            recreated. Optional.
        */

        /**:UserStateData.reset(name[, opts])
        Resets the user's current state to the state represented by the given
        name. Typically used when the state instance is yet to be created.

        :param State name:
            the name of the state to use as the user's current state.
        :param object opts.metadata:
            metadata associated with the user's current state. Optional.
        :param object opts.creator_opts:
            options to be given to the creator associated with the given state
            name to create the state. Optional.

        /**:UserStateData.reset(opts)
        Resets the user's current state to the state represented by the given
        name. Typically used when the state instance is yet to be created.

        :param string opts.name:
            the name of the state to use as the user's current state.
        :param object opts.metadata:
            metadata associated with the user's current state. Optional.
        :param object opts.creator_opts:
            options to be given to the creator associated with the given state
            name. Optional.
        */

        /**:UserStateData.reset()
        Resets the user's current state to null. This typically happens for new
        users who have yet to visit a state.
        */
        self.state = {};
        self.state.metadata = {};
        self.creator_opts = {};

        if (obj instanceof State) {
            opts = opts || {};
            self.state = obj;
            self.creator_opts = opts.creator_opts || {};
        }
        else if (typeof obj == 'string') {
            opts = opts || {};
            self.state.name = obj;
            self.state.metadata = opts.metadata || {};
            self.creator_opts = opts.creator_opts || {};
        }
        else if (typeof obj == 'object') {
            self.state.name = obj.name;
            self.state.metadata = obj.metadata || {};
            self.creator_opts = obj.creator_opts || {};
        }
        else {
            self.name = null;
        }
    };
    self.reset(obj, opts);

    self.exists = function() {
        /**UserStateData.exists()
        Determines whether we are in an undefined state.
        */
        return typeof self.state.name != 'undefined';
    };

    self.is = function(state_name) {
        /**:UserStateData.is(state_name)
        Determines whether the currently tracked state has the same name as
        ``state_name``.

        :param string state_name: the state name to check against
        */
        return self.state.name === state_name;
    };

    self.serialize = function() {
        /**:UserStateData.serialize()
        Retrieves the curren state's data as a JSON-serializable object.
        */
        return {
            name: self.state.name,
            metadata: self.state.metadata,
            creator_opts: self.creator_opts
        };
    };

    self.toJSON = self.serialize;
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
        metadata: {}
    };

    self.init = function(addr, opts) {
        opts = _.defaults(opts || {}, self.defaults);

        self.addr = addr;
        self.lang = opts.lang;
        self.answers = opts.answers;
        self.store_name = opts.store_name;
        self.i18n = new Translator();
        self.state = new UserStateData(opts.state);
        self.metadata = opts.metadata;
    };
    self.init();

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
        /**:User.create(addr, opts)
        Invoked to create a new user. Simply delegates to :class:`User.setup`,
        then emits a :class:`UserResetEvent`. Intended to be used to explicitly
        differentiate reset users from both newly created users and loaded
        users with a single action.
        */
        return self.setup(addr, opts).then(function() {
            self.emit(new UserResetEvent(self));
        });
    };

    self.create = function(addr, opts) {
        /**:User.create(addr, opts)
        Invoked to create a new user. Simply delegates to :class:`User.setup`,
        then emits a :class:`UserNewEvent`. Intended to be used to explicitly
        differentiate newly created users from loaded users with a single
        action.
        */
        return self.setup(addr, opts).then(function() {
            self.emit(new UserNewEvent(self));
        });
    };

    self.load = function(addr, opts) {
        /**:User.load(addr[, opts])

        Load a user's current state from the key-value data store resource,
        then emits a :class:`UserLoadEvent`. Throws an error if loading fails. 

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
            return self.setup(addr, opts).then(function() {
                return self.emit(new UserLoadEvent(self));
            });
        });
    };

    self.load_or_create = function(addr, opts) {
        /**:User.load_or_create(addr[, opts])

        Attempts to load a user's current state from the key-value data store
        resource, creating the user if no existing user was found. Emits a
        :class:`UserLoadEvent` if the user was loaded, and a
        :class:`UserNewEvent` if the user was created.

        Returns a promise that is fulfilled when the loading and event emitting
        has completed.

        Accepts the same params as :meth:`User.setup`, where the `opts`
        param contains overrides for the loaded user data.
        */
        opts = _.defaults(opts || {}, self.defaults);
        return self.fetch(addr, opts.store_name).then(function(data) {
            var event = data
                ? new UserLoadEvent(self)
                : new UserNewEvent(self);

            opts = _.extend(opts, data || {});
            return self.setup(addr, opts).then(function() {
                return self.emit(event);
            });
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
            state: self.state.serialize()
        };
    };

    /**meth:User.toJSON()
    Alias to :class:`User.serialize`. Allows the user to be used with
    :func:`JSON.stringify()`.
    */
    self.toJSON = self.serialize;
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
this.UserStateData = UserStateData;

this.UserEvent = UserEvent;
this.UserNewEvent = UserNewEvent;
this.UserSaveEvent = UserSaveEvent;
this.UserLoadEvent = UserLoadEvent;
