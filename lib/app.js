var Q = require('q');
var _ = require('lodash');

var states = require('./states');
var State = states.State;
var EndState = states.EndState;

var events = require('./events');
var Event = events.Event;
var Eventable = events.Eventable;

var utils = require('./utils');
var BaseError = utils.BaseError;

var translate = require('./translate');
var LazyTranslator = translate.LazyTranslator;


var AppError = BaseError.extend(function(self, app, message) {
    /**class:AppError(app, message)
    Thrown when an app-related error occurs.

    :param App app: the app related to the error.
    :param string message: the error message.
    */
    self.name = 'AppError';
    self.app = app;
    self.message = message;
});


var AppStateError = AppError.extend(function(self, app, message) {
    /**class:AppStateError(app, message)
    Thrown when an error occurs creating or accessing a state in an app.

    :param App app: the app related to the error.
    :param string message: the error message.
    */
    AppError.call(self, app, message);
    self.name = 'AppStateError';
});


var AppEvent = Event.extend(function(self, name, app) {
    /**class:AppEvent(name, app)

    An event relating to an app.

    :param string name:
        the name of the event
    :param App app:
        the app emitting the event.
    */
    Event.call(self, name);
    self.app = app;
});


var AppErrorEvent = AppEvent.extend(function(self, app, error) {
    /**class:AppErrorEvent(app, error)

    Emitted when an error is handled by the app, in case other entities want to
    know about the handled error.

    :param App app:
        the app emitting the event.
    :param InteractionMachine error:
        the error that occured.

    The event type is ``app:error``.
    */
    AppEvent.call(self, 'app:error', app);
    self.error = error;
});


var App = Eventable.extend(function(self, start_state_name, opts) {
    /**class:App(start_state_name[, opts])

    The main component defining a sandbox application. To be subclassed and
    given application spefic states and logic.

    :param string start_state_name:
        name of the initial state. New users will enter this
        state when they first interact with the sandbox
        application.
    :param AppStates opts.AppStates:
        Optional subclass of :class:`AppStates` to be used for creating
        and managing states.
    :param object opts.events:
        Optional event name-listener mappings to bind. For example:

        .. code-block:: javascript

            {
                'app:error': function(e) {
                    console.log(e);
                },
                'im.user user:new': function(e) {
                    console.log(e);
                }
            }
    */
    Eventable.call(self);

    opts = _.defaults(opts || {}, {
        events: {},
        AppStates: AppStates
    });

    self.im = null;
    self.start_state_name = start_state_name;
    self.events = opts.events;
    self.AppStates = opts.AppStates;
    self.states = new self.AppStates(self);

    /**attribute:App.$
    A :class:`LazyTranslator` instance that can be used throughout the app to
    for internationalization using gettext. For example, this would send
    'Hello, goodbye!' in the user's language:

     .. code-block:: javascript

         self.states.add('states:start', function(name) {
            return new EndState(name, {text: self.$('Hello, goodbye!')});
         });
    */
    self.$ = new LazyTranslator();

    self.attach_im = function(im) {
        self.im = im;
        self.on(self.events);
    };

    self.setup = function() {
        self.on('app:error', function(e) {
            return self.im.log.error(e.error.message);
        });

        return self
            .states.setup()
            .then(function() {
                return self.init();
            })
            .then(function() {
                return self.emit.setup();
            });
    };

    self.init = function() {
        /**:App.init()

        Invoked just after setup has completed, and just before 'setup' event
        is fired to provide subclasses with a setup hook. May return a promise.
        */
    };

    self.emit.error = function(e) {
        return self.emit(new AppErrorEvent(self, e));
    };

    self.emit.app_error = function(message) {
        var e = new AppError(self, message);
        return self.emit.error(e);
    };

    self.emit.state_error = function(message) {
        var e = new AppStateError(self, message);
        return self.emit.error(e);
    };
});


var AppStates = Eventable.extend(function(self, app) {
    /**class:AppStates(app)

    A set of states for a sandbox application. States may be either statically
    created via ``add.state``, dynamically loaded via ``add.creator`` (or via
    ``add`` for either), or completely dynamically defined by overriding
    ``create``.

    :param App app:
        the application associated with this set of states.
    */
    Eventable.call(self);

    self.creators = {};
    self.app = app;

    self.setup = function() {
        self.im = self.app.im;

        return Q(self.init()).then(function() {
            return self.emit.setup();
        });
    };

    self.init = function() {
        /**:AppStates.init()

        Invoked just after setup has completed, and just before 'setup' event
        is fired to provide subclasses with a setup hook. May return a promise.
        */
    };

    self.add = function(state_or_name) {
        /**:AppStates.add(state)

        Adds an already created state by delegating to
        :meth:`AppStates.add.state`.

        :param State state: the state to add
        */
        /**:AppStates.add(name, creator)

        Adds a state creator by delegating to :meth:`AppStates.add.creator`.

        :param State state: the state to add
        */
        return state_or_name instanceof State
            ? self.add.state.apply(self, arguments)
            : self.add.creator.apply(self, arguments); 
    };

    self.add.state = function(state) {
        /**:AppStates.add.state(state)

        Adds an already created state.

        :param State state: the state to add
        */
        self.add.creator(state.name, function() {
            return state;
        });
    };

    self.add.creator = function(name, creator) {
        /**:AppStates.add.creator(name, creator)

         Adds a state creator. Invoked by :meth:`AppStates.create`, or
         throws an error if a creator is already registered under the given
         state name.


        :param string state_name: name of the state
        :param function creator:
            A function ``func(state_name)`` for creating the state. This
            function should take the state name should return a state object
            either directly or via a promise.
         
         State creators can also delegate to other state creators by using
         :meth:`AppStates.create`. For example, an app can do something
         like this:

         .. code-block:: javascript

             self.states.add('states:start', function() {
                 return self.user.metadata.registered
                     ? self.states.create('states:main_menu')
                     : self.states.create('states:register');
             });
        */
        if (name in self.creators) {
            throw new AppStateError(
                self.app, "Duplicate state '" + name + "'");
        }

        self.creators[name] = creator;
    };

    self.remove = function(name) {
        /**:App.remove(name)

        Removes an added state or state creator.

        :param string name: name of the state or state creator
        */
        delete self.creators[name];
    };

    self.check = function(state, name) {
        /**AppStates.check(state, name)

        Used by :meth:`AppStates.create` to ensure that an invoked
        state creator has constructed a valid state.

        :param State state:
            The created state
        :param string name:
            The state name associated with the creator that created the state
        */
        function check(truth, fail_message) {
            if (!truth) {
                throw new AppStateError(self.app, fail_message);
            }
        }

        check(state instanceof State, [
            "Creator for state '" + name + "' should create a state,",
            "but instead created something of type '" + typeof state + "'"
        ].join(' '));
    };

    self.create = function(name, opts) {
        /**:AppStates.create(name, opts)

        Creates the given state represented by the given state name by
        delegating to the associated state creator.

        :param string name:
            the name of the state to create.
        :param object opts:
            Options for the state creator to use. Optional.

        If no creator is found for the requested state name, we create a start
        state instead.

        This function returns a promise.

        It may be overridden by :class:`AppStates` subclasses that wish
        to provide a completely dynamic set of states.
        */
        var creator;
        var p = Q();
        opts = opts || {};

        if (name == self.app.start_state_name) {
            creator = self.creators.__start__;
        }
        else if (name in self.creators) {
            creator = self.creators[name];
        }
        else {
            p = self.app.emit.state_error([
                "Unknown state '" + name + "'. Switching to",
                "start state '" + self.app.start_state_name + "'."
            ].join(' '));

            creator = self.creators.__start__;
            name = self.app.start_state_name;
        }

        return p
            .then(function() {
                return creator.call(self.app, name, opts);
            })
            .then(function(state) {
                self.check(state, name);

                // Ensure we can recreate the state with the same creator
                // opts when the state is recreated next sandbox run. Needed
                // for cases where create() is called inside a state creator
                if (!('__creator_opts__' in state)) {
                    state.__creator_opts__ = opts;
                }

                return state;
            })
            .catch(function(e) {
                return self
                    .app.emit.error(e)
                    .then(function() {
                        return self.create('__error__');
                    });
            });
    };

    self.creators.__error__ = function(name) {
        /**:AppStates.creators.__error__(name)

        Creates the fallback error state.

        :param string name:
            the name of the state for which an error occurred.

        This default implementation creates an EndState with name
        ``name`` and content *"An error occurred. Please try again later"*.

        The end state created has the next state set to the start state.  If
        the start state does not exist, we in the error state again..
        */
        return new EndState(name, {
            next: self.app.start_state_name,
            text: "An error occurred. Please try again later."
        });
    };

    self.creators.__start__ = function(name) {
        /**:AppStates.creators.__start__(name)

        :param string name:
            the name of the start state.
        :param InteractionMachine im:
            the interaction machine the start state is for.

        The default implemenation looks up a creator for the state named
        ``name`` and calls that. If no such creator exists, it uses
        :meth:`App.creators.__error__` instead.
        */
        var creator = self.creators[name];

        var p = Q();
        if (!creator) {
            p = self.app.emit.state_error([
                "Unknown start state '" + name + "'.",
                "Switching to error state."].join(' '));

            creator = self.creators.__error__;
            name = '__error__';
        }

        return p.then(function() {
            return creator.call(self.app, name);
        });
    };
});


this.App = App;
this.AppStates = AppStates;

this.AppEvent = AppEvent;
this.AppErrorEvent = AppErrorEvent;
this.AppError = AppError;
this.AppStateError = AppStateError;
