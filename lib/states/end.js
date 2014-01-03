// end.js
//  - End states.

var state = require("./state.js");
var State = state.State;


function EndState(name, text, next, handlers) {
    /**class:EndState(name, text, next, handlers)

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string name:
        name used to identify and refer to the state
    :param string text:
        text to display to the user
    :param fn_or_str next:
        state that the user should visit after this state. Functions should
        have the form ``f(message_content)`` and return the name of the next
        state. The value of ``this`` will be the calling :class:`EndState`
        instance. If ``next`` is ``null``, the state machine will be left in
        the current state.
    :param object handlers:
        object of handlers for particular events, see :class:`State`.
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;
    State.call(self, name, handlers);
    self.end_text = text;
    self.next = next;

    self.input_event = function(content, done) {
        var next = ((typeof self.next == 'function') ?
                    self.next.call(self, content) : self.next);
        if (next) {
            self.im.set_user_state(next);
        }
        done();
    };

    self.new_session_event = function(done) {
        self.input_event('', done);
    };

    self.translate = function(i18n) {
        self.end_text = i18n.gettext(self.end_text);
    };

    self.display = function() {
        return self.end_text;
    };

    self.continue_session = function() { return false; };
}


// exports

this.EndState = EndState;