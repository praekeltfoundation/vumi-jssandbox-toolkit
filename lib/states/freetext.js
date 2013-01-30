// freetext.js
//  - States for free text entry.

var state = require("./state.js");
var State = state.State;


function FreeText(name, next, question, check, error, handlers) {
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