// state.js
//  - Base state class.

var Q = require("q");
var _ = require("underscore");

var utils = require('../utils');
var BaseError = utils.BaseError;

var events = require('../events');
var Event = events.Event;
var Eventable = events.Eventable;


var StateError = BaseError.extend(function(self, message) {
    /**class:StateError(message)
    Thrown when interacting or manipulating a state causes an error.

    :param string message: the error message.
    */
    self.name = 'StateError';
    self.message = message;
});

var StateEvent = Event.extend(function(self, name, state) {
    /**class:StateEvent(name, state, data)
    An event relating to a state.

    :param string name: the event type's name.
    :param State state: the state associated to the event.
    */
    Event.call(self, name);
    self.state = state;
});

var StateInputEvent = StateEvent.extend(function(self, state, content) {
    /**class:StateInputEvent(content)
    Emitted when the user has given input to the state.

    :param State state: the state that the input was given to.
    :param string content: text from the user.

    The event type is ``state:input``.
    */
   StateEvent.call(self, 'state:input', state);
   self.content = content;
});

var StateEnterEvent = StateEvent.extend(function(self, state) {
    /**class:StateEnterEvent()
    Emitted when the state is entered by a user.

    :param State state: the state being entered.

    The event type is ``state:enter``.
    */
   StateEvent.call(self, 'state:enter', state);
});

var StateExitEvent = StateEvent.extend(function(self, state) {
    /**class:StateEnterEvent()
    Called when the state is exited by the user.

    :param State state: the state being exited.

    The event type is ``state:exit``.
    */
   StateEvent.call(self, 'state:exit', state);
});

var State = Eventable.extend(function(self, name, opts) {
    /**class:State(name, opts)
    Base class for states in the interaction machine. States can be thought of
    as a single screen in a set of interactions with the user.

    :param string name:
        name used to identify and refer to the state
    :param object opts.metadata:
        data about the state relevant to the interaction machine's current
        user. Optional.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Default is
        `true`. May also be a function, which may return its result via a
        promise.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Default is ``true``.
        May also be a function, which may return its result via a promise.
     */
    Eventable.call(self);

    opts = _.defaults(opts || {}, {
        send_reply: true,
        continue_session: true
    });

    self.im = null;
    self.name = name;
    self.send_reply = utils.functor(opts.send_reply);
    self.continue_session = utils.functor(opts.continue_session);

    self.setup = function(im, metadata) {
        /**:State.setup(im)
        Called before any other methods on the state are called to allow the
        state to set itself up.

        :param InteractionMachine im: interaction machine using the state.
        */
        self.im = im;
        self.metadata = metadata || {};
        return Q(self.init()).then(function() {
            return self.emit.setup();
        });
    };

    self.init = function() {
        /**:State.init()
        Invoked just after setup has completed, and just before 'setup' event
        is fired to provide subclasses with a setup hook. May return a promise.
        */
    };

    self.save_response = function(response) {
        /**:State.save_response(response)
        Called by sub-classes to store accepted user responses on the user
        object.

        :param string response: value to store as an answer.
        */
        self.im.user.set_answer(self.name, response);
    };

    self.set_next_state = function(next) {
        /**:State:set_next_state(name)

        Set the state that the user will visit after this state using the given
        state name.

        :param string opts.name:
            The name of the next state
        */
        /**:State:set_next_state(opts)

        Set the state that the user will visit after this state using an
        options object.

        :param string opts.name:
            The name of the next state
        :param object opts.metadata:
            Metadata to pass to the next state. Optional.
        :param object opts.creator_opts:
            Options to pass to the state creator when creating the state.
            Optional.
        */
        /**:State:set_next_state(fn[, arg1[, arg2[, ...]]])

        Use a function to set the state that the user will visit this state.
        
        :param function fn:
            a function that returns name of the next state or an options object
            with data about the next state. The value of ``this`` inside ``f``
            will be the calling state instance. May also return its result via
            a promise.
        :params arguments arg1, arg2, ...
            arguments to pass to ``fn``
        */
        var args = Array.prototype.slice.call(arguments, 1);
        var p = Q(utils.maybe_call(next, self, args));
        return p.then(function(next) {
            if (typeof next != 'undefined' && next !== null) {
                return self.im.user.state.reset(next);
            }
        });
    };

    self.display = function() {
        /**:State.display()
        The content to be displayed to the user. May return a promise.
        */
        return "State: [" + self.name + "]";
    };

    self.translate = function(i18n) {
        /**:State.translate(i18n)
        Translate any text that was not translated previously (this is a
        helper to make writing static states upfront easier).

        :param Jed i18n: The jed instance to be used for translating the text.
        */
    };

    self.emit.input = function(content) {
        /**:State.emit.input(im)
        Shortcut for emitting an input event for the state (since this is done
        quite often). See :class:`StateInputEvent`.
        */
        return self.emit(new StateInputEvent(self, content));
    };

    self.serialize = function() {
        return {
            name: self.name,
            metadata: self.metadata
        };
    };

    self.toJSON = self.serialize;
});


this.State = State;
this.StateError = StateError;

this.StateEvent = StateEvent;
this.StateInputEvent = StateInputEvent;
this.StateEnterEvent = StateEnterEvent;
this.StateExitEvent = StateExitEvent;
