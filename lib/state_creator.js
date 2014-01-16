var events = require("./events");
var Eventable = events.Eventable;


function StateCreator(start_state) {
    /**class:StateCreator(start_state)

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
    Eventable.call(self);

    self.setup = function(im, start_state) {
        self.im = im;
        self.start_state = start_state;
        self.state_creators = {};
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

    self.add_state = function(state, opts) {
        /**:StateCreator.add_state(state, translate)

        :param State state: the state to add.
        :param boolean opts.translate:
            whether the state should be re-translated each time it
            is accessed. The default is ``true``.
        */
        
        opts = utils.set_defaults(opts || {}, {translate: true});

        self.add_creator(state.name, function(state_name, im) {
            if (opts.translate) {
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
        if (creator) {
            return creator.call(self, state_name, im);
        }

        im.log("Unknown start state '" + state_name + "'. " +
               "Switching to" + " error state.");

        return self.error_state_creator('__error__', im);
    };

    self.switch_state = function(state_name) {
        /**:StateCreator.switch_state(state_name)

        :param string state_name:
            the name of the state to switch to.
        :param InteractionMachine im:
            the interaction machine the state is for.

        Looks up a creator for the given ``state_name`` and calls it. If the
        state name is null or undefined, calls ``start_state_creator`` instead.

        This function returns a promise.

        It may be overridden by :class:`StateCreator` subclasses that wish
        to provide a completely dynamic set of states.
        */
        var creator;

        if (state_name === null || typeof state_name == "undefined") {
            // handles new users who have no current state
            creator = self.start_state_creator;
            state_name = self.start_state;
        } else if (!self.state_creators[state_name]) {
            // handles users who somehow have an unknown state
            // (possibly they are in a state from a previous version
            // of the js application).
            self.im.log(
                "Unknown state '" + state_name + "'. Switching to" +
                " start state, '" + self.start_state + "'.");
            creator = self.start_state_creator;
            state_name = self.start_state;
        } else {
            creator = self.state_creators[state_name];
        }

        return creator.call(self, state_name);
    };
}


this.StateCreator = StateCreator;
