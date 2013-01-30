// end.js
//  - End states.

var state = require("./state.js");
var State = state.State;


function EndState(name, text, next, handlers) {
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