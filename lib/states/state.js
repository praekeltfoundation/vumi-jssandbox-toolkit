// state.js
//  - Base state class.

var events = require("../events");
var utils = require('../utils');


var Event = events.Event;
var Eventable = events.Eventable;


function StateError(msg) {
    this.name = "StateError";
    this.message = msg;
}
StateError.prototype = new Error();
StateError.prototype.constructor = StateError;


function StateSetupEvent(state) {
    /**class:StateSetupEvent()
    Emitted to allow a state to set itseful up.
    */

   return new Event('state:setup', {state: state});
}

function StateInputEvent(state, content) {
    /**:class.StateInputEvent(content)
    Emitted with when the user has given input to the state.
    
    :param string content: text from the user.
    */
   return new Event('state:input', {
       state: state,
       content: content
   });
}

function StateEnterEvent(state) {
    /**:State.StateEnterEvent()
    Emitted when the state is entered by a user.
    */
   return new Event('state:enter', {state: state});
}

function StateExitEvent() {
    /**:State.StateEnterEvent()
    Called when the state is exited by the user.
    */
   return new Event('state:exit', {state: state});
}


function State(opts) {
    /**:State(opts)
    Base class for states in the interaction machine. States can be thought of
    as a single screen in a set of interactions with the user.

    :param string opts.name:
        name used to identify and refer to the state
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
    self.name = opts.name;
    self.send_reply = opts.send_reply;
    self.continue_session = opts.continue_session;

    self.setup_state = function(im) {
        /**:State.setup_state(im)
        Called before any other methods on the state are called to allow the
        state to set itself up.
        
        :param InteractionMachine im: interaction machine using the state.
        */
        self.im = im;
        return self.emit(new StateSetupEvent(self));
    };

    self.save_response = function(response) {
        /**:State.save_response(response)
        Called by sub-classes to store accepted user responses on the user
        object.
        
        :param string response: value to store as an answer.
        */
        return self.im.set_user_answer(self.name, response);
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
}

this.State = State;
this.StateError = StateError;

this.StateSetupEvent = StateSetupEvent;
this.StateInputEvent = StateInputEvent;
this.StateEnterEvent = StateEnterEvent;
this.StateExitEvent = StateExitEvent;
