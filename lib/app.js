var Q = require("q");

var utils = require("./utils");
var states = require("./states");
var State = states.State;
var StateError = states.StateError;
var EndState = states.EndState;

var events = require("./events");
var Eventable = events.Eventable;


var App = Eventable.extend(function(self, start_state_name) {
    /**class:App(start_state_name)

    :param string start_state_name:
        Name of the initial state. New users will enter this
        state when they first interact with the sandbox
        application.

    A set of states defining a sandbox application. States may
    be either statically created via ``add_state``, dynamically
    loaded via ``add_creator`` or completely dynamically defined
    by overriding ``switch_state``.
    */
    Eventable.call(self);

    self.start_state_name = start_state_name;
    self.state_creators = {};

    self.setup = function(im) {
        self.im = im;

        return Q(self.init()).then(function() {
            return self.emit.setup();
        });
    };

    self.init = function() {
        /**:App.init()

        Invoked just after setup has completed, and just before 'setup' event
        is fired to provide subclasses with a setup hook. May return a promise.
        */
    };

    self.has_creator = function(state_name) {
        return state_name in self.state_creators;
    };

    self.get_creator = function(state_name) {
        return self.state_creators[state_name];
    };

    self.add_creator = function(state_name, creator) {
        /**:App.add_creator(state_name, creator)

         Adds a state creator. Invoked by :meth:`App.switch_state`, or
         throws an error if a creator is already registered under the given
         state name.

        :param string state_name: name of the state
        :param function creator:
            A function ``func(state_name)`` for creating the state. This
            function should take the state name should return a state object
            either directly or via a promise.
        */

        if (state_name in self.state_creators) {
            throw new StateError("Duplicate state '" + state_name + "'");
        }

        self.state_creators[state_name] = creator;
        return self;
    };

    self.add_state = function(state) {
        /**:App.add_state(state)

        Adds an already created state.

        :param State state: the state to add
        */
        self.add_creator(state.name, function() {
            return state;
        });

        return self;
    };

    self.error_state_creator = function(state_name) {
        /**:App.error_state_creator(state_name, im)
         *
        Creates the fallback error state.

        :param string state_name:
            the name of the state for which an error occurred.
        :param InteractionMachine im:
            the interaction machine in which the error occurred.

        This default implementation creates an EndState with name
        ``state_name`` and content *"An error occurred. Please try again later"*.

        The end state created has the next state set to ``null``. When the
        state receives input, it will invoke :meth:`UserStateData.change` to
        change the user's current state. Since the state given to it is
        ``null``, it will instead stay on the current state.

        If we are dealing with a new user, then the :class:`InteractionMachine`
        will have requested the start state to have been created. If the start
        state does not exist, we will end up here again, ensuring the same
        message will be displayed.
        */
        return new EndState(state_name, {
            next: null,
            text: "An error occurred. Please try again later."
        });
    };

    self.start_state_creator = function(state_name) {
        /**:State.start_state_creator(state_name)

        :param string state_name:
            the name of the start state.
        :param InteractionMachine im:
            the interaction machine the start state is for.

        This default implemenation looks up a creator for the state named
        ``state_name`` and calls that. If no such creator exists, it uses
        :meth:`App.error_state_creator` instead.
        */
        var creator = self.get_creator(state_name);

        if (!creator) {
            creator = self.error_state_creator;
            state_name = '__error__';

            self.im.log(
                "Unknown start state '" + state_name + "'. " +
                "Switching to" + " error state.");
        }

        return creator.call(self, state_name);
    };

    self.check_created_state = function(state, state_name) {
        /**App.check_created_state(state, state_name)

        Used by :meth:`App.switch_state` to ensure that an invoked
        state creator has constructed a valid state.

        :param State state:
            The created state
        :param string state_name:
            The state name associated with the creator that created the state
        */
        function check(truth, fail_message) {
            if (!truth) {
                throw new StateError(fail_message);
            }
        }

        check(
            state instanceof State,
            "Creator for state '" + state_name + "' should create a state, " +
            "but instead created something of type '" + typeof state + "'");
            
        check(
            state.name == state_name,
            "Creator for state '" + state_name + "' created a state with " +
            "a different name: '" + state.name + "'");

        return self;
    };

    self.switch_state = function(state_name) {
        /**:App.switch_state(state_name)

        Creates the given state represented by the given state name by
        delegating to the associated state creator.

        :param string state_name:
            the name of the state to switch to.
        :param InteractionMachine im:
            the interaction machine the state is for.

        If no creator is found for the requested state name, we create a start
        state instead.

        This function returns a promise.

        It may be overridden by :class:`App` subclasses that wish
        to provide a completely dynamic set of states.
        */
        var creator;

        if (state_name == self.start_state_name) {
            creator = self.start_state_creator;
        }
        else if (self.has_creator(state_name)) {
            creator = self.get_creator(state_name);
        }
        else {
            self.im.log(
                "Unknown state '" + state_name + "'. Switching to" +
                " start state, '" + self.start_state + "'.");

            creator = self.start_state_creator;
        }

        return Q(creator.call(self, state_name)).then(function(state) {
            self.check_created_state(state, state_name);
            return state;
        });
    };
});


this.App = App;
