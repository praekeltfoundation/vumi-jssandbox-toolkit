// booklet.js
//  - State for showing paginated text.

var state = require("./state.js");
var promise = require("../promise.js");
var State = state.State;
var maybe_promise = promise.maybe_promise;

// A state for displaying paginated text.
//
// Arguments:
//   - name: name of the state
//   - opts:
//     - next: name of the next state or a function returning the name.
//     - pages: total number of pages.
//     - page_text(n): function returning the text of page n. Pages are
//                     numbered from 0 to (pages - 1).
//     - initial_page: page number to use when the state is entered.
//                     Optional, default is 0.
//     - buttons: map of user inputs to amounts to increment the page number
//                by. The special value 'exit' triggers moving to the next
//                state. Optional, default is:
//                `{"1": -1, "2": +1, "0": "exit"}`,
//     - footer_text: text to append to every page. Optional, default is:
//                    `"\n1 for prev, 2 for next, 0 to end."`
//     - handlers: state event handlers. Passed through to the State
//                 constructor. Optional.
function BookletState(name, opts) {
    var self = this;
    opts = opts || {};
    State.call(self, name, opts.handlers);

    self.next = opts.next;
    self.pages = opts.pages; // pages are from 0 -> pages - 1
    self.page_text = opts.page_text // page_text(page_no) -> text (or promise)

    self.initial_page = opts.initial_page || 0;
    self.buttons = (typeof opts.buttons !== "undefined" ?
                    opts.buttons :
                    {"1": -1, "2": +1, "0": "exit"});
    self.footer_text = (typeof opts.footer_text !== "undefined" ?
                        opts.footer_text :
                        "\n1 for prev, 2 for next, 0 to end.");

    var orig_on_enter = self.on_enter;
    self.on_enter = function() {
        self.set_current_page(self.im.user, self.initial_page);
        return orig_on_enter();
    };

    self.get_current_page = function(user) {
        var pages = user.pages || {};
        return pages[self.name] || self.initial_page;
    };

    self.set_current_page = function(user, page) {
        if (typeof user.pages == 'undefined') {
            user.pages = {};
        }
        user.pages[self.name] = page;
    };

    self.inc_current_page = function(user, amount) {
        var page = self.get_current_page(user) + amount;
        page = page % self.pages;
        if (page < 0) {
            page += self.pages;
        }
        self.set_current_page(user, page);
    };

    self.input_event = function(content, done) {
        if (!content) { content = ""; }
        content = content.trim();

        var button = self.buttons[content];
        if (typeof button === "undefined") {
            done();
            return;
        }

        var amount = Number(button);
        if (!Number.isNaN(amount)) {
            self.inc_current_page(self.im.user, amount);
            done();
            return;
        }

        if (button !== "exit") {
            done();
            return;
        }

        self.call_possible_function(
            self.next, self, [content],
            function (next) {
                self.im.set_user_state(next);
                done();
            }
        );
    };

    self.display = function() {
        var n = self.get_current_page(self.im.user);
        var p = maybe_promise(self.page_text(n));
        p.add_callback(function (content) {
            return content + self.footer_text;
        });
        return p;
    };
}

// exports
this.BookletState = BookletState;
