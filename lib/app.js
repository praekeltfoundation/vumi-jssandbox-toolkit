var Q = require("q");
var _ = require("underscore");

var states = require("./states");
var State = states.State;
var StateError = states.StateError;
var EndState = states.EndState;

var events = require("./events");
var Event = events.Event;
var Eventable = events.Eventable;


var AppEvent = Event.extend(function(self, name, app) {
    /**class:AppErrorEvent(im)

    An event relating to an app.

    :param App app:
        the app emitting the event.
    */
    Event.call(self, name);
    self.app = app;
});


var AppErrorEvent = AppEvent.extend(function(self, app, error) {
    /**class:AppErrorEvent(im)

    Emitted when an error occurs inside an app.

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
    :param opts.AppStates:
        Optional subclass of :class:`AppStates` to be used for creating
        and managing states.
    */
    Eventable.call(self);

    opts = _.defaults({AppStates: AppStates});
    self.start_state_name = start_state_name;
    self.AppStates = AppStates;
    self.states = new self.AppStates(self);

    self.setup = function(im) {
        self.im = im;
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
            throw new StateError("Duplicate state '" + name + "'");
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
                throw new StateError(fail_message);
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
        opts = opts || {};

        if (name == self.app.start_state_name) {
            creator = self.creators.__start__;
        }
        else if (name in self.creators) {
            creator = self.creators[name];
        }
        else {
            self.im.log(
                "Unknown state '" + name + "'. Switching to" +
                " start state '" + self.app.start_state_name + "'.");

            creator = self.creators.__start__;
            name = self.app.start_state_name;
        }

        return Q()
            .then(function() {
                return creator.call(self.app, name, opts);
            })
            .then(function(state) {
                self.check(state, name);
                return state;
            })
            .catch(function(e) {
                self.im.log(e.message);
                return self
                    .app.emit(new AppErrorEvent(self.app, e))
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

        The end state created has the next state set to ``null``. When the
        state receives input, it will invoke :meth:`UserStateData.change` to
        change the user's current state. Since the state given to it is
        ``null``, it will instead stay on the current state.

        If we are dealing with a new user, then the :class:`InteractionMachine`
        will have requested the start state to have been created. If the start
        state does not exist, we will end up here again, ensuring the same
        message will be displayed.
        */
        return new EndState(name, {
            next: null,
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

        if (!creator) {
            self.im.log([
                "Unknown start state '" + name + "'.",
                "Switching to error state."].join(' '));

            creator = self.creators.__error__;
            name = '__error__';
        }

        return creator.call(self.app, name);
    };
});


this.App = App;
this.AppStates = AppStates;

this.AppEvent = AppEvent;
this.AppErrorEvent = AppErrorEvent;
