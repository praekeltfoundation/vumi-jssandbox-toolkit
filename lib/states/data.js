var utils = require('../utils');
var Extendable = utils.Extendable;

var state = require('./state');
var State = state.State;


var StateData = Extendable.extend(function(self, obj, opts) {
    /**class:StateData([obj, opts])
    Structure for holding state data. Used as a wrapper so that
    externally, it can be interacted with the same, regardless of
    whether it is currently holding an actual :class:`State` instance
    or data about a state that is yet to be created.

    The constructor arguments are identical to those of
    :meth:`StateData.reset`.
    */
    Object.defineProperty(self, 'name', {
        get: function() {
            /**attribute:StateData.name
            The currently tracked state's name.
            */
            return self.state.name;
        }
    });

    Object.defineProperty(self, 'metadata', {
        get: function() {
            /**attribute:StateData.metadata
            The currently tracked state's metadata.
            */
            return self.state.metadata;
        }
    });

    self.reset = function(obj, opts) {
        /**:StateData.reset(state[, opts])
        Resets the user's current state to an already created state.

        :param State state:
            the state instance to use as the user's current state
        :param object opts.creator_opts:
            options to be given to the creator when the state needs to be
            recreated. Optional.
        */

        /**:StateData.reset(name[, opts])
        Resets the user's current state to the state represented by the given
        name. Typically used when the state instance is yet to be created.

        :param State name:
            the name of the state to use as the user's current state.
        :param object opts.metadata:
            metadata associated with the user's current state. Optional.
        :param object opts.creator_opts:
            options to be given to the creator associated with the given state
            name to create the state. Optional.
        */

        /**:StateData.reset(opts)
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

        /**:StateData.reset()
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
        /**StateData.exists()
        Determines whether we are in an undefined state.
        */
        return typeof self.state.name != 'undefined';
    };

    self.is = function(state) {
        /**:StateData.is(state)
        Determines whether the currently tracked state has the same name
        as ``state``.

        :type state:
            State, StateData or string
        :param state:
            the state to check against
        */
        if (typeof state == 'string') { state = {name: state}; }
        return self.state.name === state.name;
    };

    self.serialize = function() {
        /**:StateData.serialize()
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


this.StateData = StateData;
