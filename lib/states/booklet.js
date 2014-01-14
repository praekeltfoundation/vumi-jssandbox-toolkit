// booklet.js
//  - State for showing paginated text.

var Q = require("q");

var utils = require("../utils");
var state = require("./state");
var State = state.State;


function BookletState(opts) {
    /**class:BookletState([opts])

    A state for displaying paginated text.

    :param string opts.name: name of the state
    :param fn_or_str opts.next:
        state that the user should visit after this state. Functions should
        have the form ``f(message_content)`` and return the name of the next
        state (or a promise that will return the name). The value of ``this``
        inside ``f`` will be the calling :class:`BookletState` instance.
    :param integer opts.pages:
        total number of pages.
    :param function opts.page_text:
        function ``func(n)`` returning the text of page ``n``. Pages are
        numbered from 0 to (pages - 1). May return a promise.
    :param integer opts.initial_page:
        page number to use when the state is entered. Optional, default is 0.
    :param object opts.buttons:
        map of user inputs to amounts to increment the page number by. The
        special value 'exit' triggers moving to the next state. Optional,
        default is: ``{"1": -1, "2": +1, "0": "exit"}``,
    :param string opts.footer_text:
        text to append to every page. Optional, default is:
        ``"\n1 for prev, 2 for next, 0 to end."``
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param object opts.handlers:
        object of handlers for particular events, see :class:`State`.
    */

    var self = this;

    opts = utils.set_defaults(opts || {}, {
        initial_page: 0,
        buttons: {"1": -1, "2": +1, "0": "exit"},
        footer_text: "\n1 for prev, 2 for next, 0 to end."
    });

    State.call(self, opts);

    self.next = opts.next;
    self.pages = opts.pages; // pages are from 0 -> pages - 1
    self.page_text = opts.page_text; // page_text(page_no) -> text (or promise)
    self.initial_page = opts.initial_page;
    self.buttons = opts.buttons;
    self.footer_text = opts.footer_text;

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

    self.input_event = function(content) {
        if (!content) { content = ""; }
        content = content.trim();

        var button = self.buttons[content];
        if (typeof button === "undefined") {
            return Q();
        }

        var amount = Number(button);
        if (!Number.isNaN(amount)) {
            self.inc_current_page(self.im.user, amount);
            return Q();
        }

        if (button !== "exit") {
            return Q();
        }

        var p = Q(utils.call_possible_function(self.next, self, [content]));
        return p.then(function (next) {
            return self.im.set_user_state(next);
        });
    };

    self.display = function() {
        var n = self.get_current_page(self.im.user);

        var p = Q(self.page_text(n));
        return p.then(function (content) {
            return content + self.footer_text;
        });
    };
}

// exports
this.BookletState = BookletState;
