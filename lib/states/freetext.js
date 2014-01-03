// freetext.js
//  - States for free text entry.

var state = require("./state.js");
var State = state.State;


function FreeText(name, next, question, check, error, handlers) {
    /**class:FreeText(name, next, question, check, error, handlers)
    A state which displays a text, then allows the user to respond with
    any text.

    :param string name:
        name used to identify and refer to the state
    :param fn_or_str next:
        state that the user should visit after this state. Functions should
        have the form ``f(message_content [, done])`` and return the name of
        the next state. If the ``done`` argument is present, ``f`` should
        arrange for the name of the next state to be return asynchronously
        using a call to ``done(state_name)``. The value of ``this`` inside
        ``f`` will be the calling :class:`FreeText` instance.
    :param string question:
        text to display to the user
    :param function check:
        a function ``func(content)`` for validating a user's response. Should
        return ``true`` if the response is considered valid, and ``false`` if
        otherwise.
    :param string error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param object handlers:
        object of handlers for particular events, see :class:`State`.
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;
    State.call(self, name, handlers);
    self.next = next;
    self.question_text = question;
    self.check = check;
    self.error_text = error;
    self.in_error = false;

    var orig_on_enter = self.on_enter;
    self.on_enter = function() {
        self.in_error = false;
        return orig_on_enter();
    };

    self.check_content = function(content) {
        if (!self.check) { return true; }
        return self.check.call(self, content);
    };

    self.input_event = function(content, done) {
        if (!content) { content = ""; }
        content = content.trim();
        if (!self.check_content(content)) {
            self.in_error = true;
            done();
            return;
        }
        self.call_possible_function(
            self.next, self, [content],
            function (next) {
                self.im.set_user_state(next);
                self.save_response(content);
                done();
            }
        );
    };

    self.translate = function(i18n) {
        self.question_text = i18n.gettext(self.question_text);
        if (self.error_text) {
            self.error_text = i18n.gettext(self.error_text);
        }
    };

    self.display = function() {
        if (self.in_error) {
            return self.error_text;
        }
        return self.question_text;
    };
}


// exports

this.FreeText = FreeText;