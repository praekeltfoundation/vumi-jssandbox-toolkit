// state.js
//  - Base state class.

var Q = require("q");

var utils = require('../utils');
var BaseError = utils.BaseError;

var events = require('../events');
var Event = events.Event;
var Eventable = events.Eventable;

var StateError = BaseError.extend(function(msg) {
    this.name = "StateError";
    this.message = msg;
});

function StateEvent(name, state, data) {
    /**:class.StateEvent(name, state, data)
    An event relating to a state.

    :param string name: the event type's name.
    :param State state: the state associated to the event.
    :param object data: additional event data.
    */
    var self = this;

    data = data || {};
    data.state = state;

    return new Event(name, data);
}

function StateInputEvent(state, content) {
    /**:class.StateInputEvent(content)
    Emitted when the user has given input to the state.
    
    :param State state: the state that the input was given to.
    :param string content: text from the user.

    The event type is ``state:input``.
    */
   return new Event('state:input', {
       state: state,
       content: content
   });
}

function StateEnterEvent(state) {
    /**:State.StateEnterEvent()
    Emitted when the state is entered by a user.

    The event type is ``state:enter``.

    :param State state: the state being entered.
    */
   return new Event('state:enter', {state: state});
}

function StateExitEvent(state) {
    /**:State.StateEnterEvent()
    Called when the state is exited by the user.

    The event type is ``state:exit``.

    :param State state: the state being exited.
    */
   return new Event('state:exit', {state: state});
}


var State = Eventable.extend(function(name, opts) {
    /**:State(name, opts)
    Base class for states in the interaction machine. States can be thought of
    as a single screen in a set of interactions with the user.

    :param string name:
        name used to identify and refer to the state
    :param object opts.metadata:
        data about the state relevant to the interaction machine's current
        user. Optional.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Default is
        `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Default is `true`.
     */

    var self = this;
    Eventable.call(self);

    opts = utils.set_defaults(opts || {}, {
        send_reply: true,
        continue_session: true
    });

    self.im = null;
    self.name = name;
    self.send_reply = opts.send_reply;
    self.continue_session = opts.continue_session;

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
        return self;
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
        return self;
    };

    self.emit.input = function(content) {
        /**:State.emit.input(im)
        Shortcut for emitting an input event for the state (since this is done
        quite often). See :class:`StateInputEvent`.
        */
        return self.emit(new StateInputEvent(self, content));
    };
});


this.State = State;
this.StateError = StateError;

this.StateEvent = StateEvent;
this.StateInputEvent = StateInputEvent;
this.StateEnterEvent = StateEnterEvent;
this.StateExitEvent = StateExitEvent;
