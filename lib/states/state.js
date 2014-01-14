// state.js
//  - Base state class.

var utils = require('../utils');

function StateError(msg) {
    this.name = "StateError";
    this.message = msg;
}
StateError.prototype = new Error();
StateError.prototype.constructor = StateError;


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
    :param function opts.handlers.setup_state:
        a function `func()` invoked before any other methods on the state,
        allows the state to set itself up.
    :param function opts.handlers.on_enter:
        a function `func()` invoked when the user enters the state from
        another state.
    :param function opts.handlers.on_exit:
        a function `func()` invoked when the user exits from the state to
        another state.
     */

    var self = this;

    opts = utils.set_defaults(opts || {}, {
        handlers: {},
        send_reply: true,
        continue_session: true
    });

    self.im = null;
    self.name = opts.name;
    self.handlers = opts.handlers;
    self.send_reply = opts.send_reply;
    self.continue_session = opts.continue_session;

    self.setup_state = function(im) {
        /**:State.setup_state(im)
        Called before any other methods on the state are called to allow the
        state to set itself up. May return a promise instead of returning
        immediately.
        
        :param InteractionMachine im: interaction machine using the state.
        */
        self.im = im;
        return utils.call_possible_function(self.handlers.setup_state, self);
    };

    self.save_response = function(response) {
        /**:State.save_response(response)
        Called by sub-classes to store accepted user responses on the user
        object.
        
        :param string response: value to store as an answer.
        */
        return self.im.set_user_answer(self.name, response);
    };

    self.input_event = function(content) {
        /**:State.input_event(content)
        Called with content from the user. May return a promise instead of
        returning immediately.
        
        :param string content: text from the user.
        */
    };

    self.new_session_event = function() {
        /**:State.new_session_event()
        Called when a new session starts (as opposed to ``input_event``).
        May return a promise.
        */
    };

    self.on_enter = function() {
        /**:State.on_enter()
        Called when the state is entered by a user (from a different state).
        May return a promise.
        */
        return utils.call_possible_function(self.handlers.on_enter, self);
    };

    self.on_exit = function() {
        /**:State.on_exit()
        Called when the state is exited by the user (to a different state).
        May return a promise.
        */
        return utils.call_possible_function(self.handlers.on_exit, self);
    };

    self.display = function() {
        /**:State.display()
        The content to be displayed to the user.
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
}


this.State = State;
this.StateError = StateError;
