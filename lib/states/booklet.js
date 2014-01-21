// booklet.js
//  - State for showing paginated text.

var Q = require("q");

var utils = require("../utils");
var state = require("./state");
var State = state.State;


var BookletState = State.extend(function(self, name, opts) {
    /**class:BookletState(name, opts)

    A state for displaying paginated text.

    :param string name: name of the state
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
    */
    opts = utils.set_defaults(opts || {}, {
        initial_page: 0,
        buttons: {
            "1": -1,
            "2": +1,
            "0": "exit"
        },
        footer_text: "\n1 for prev, 2 for next, 0 to end."
    });

    State.call(self, name, opts);

    self.next = opts.next;
    self.pages = opts.pages; // pages are from 0 -> pages - 1
    self.page_text = opts.page_text; // page_text(page_no) -> text (or promise)
    self.initial_page = opts.initial_page;
    self.buttons = opts.buttons;
    self.footer_text = opts.footer_text;
 
    self.init = function() {
        self.set_current_page(self.initial_page);
    };

    self.on('state:input', function(event) {
        var p = Q(self);
        var content = event.content;

        if (!content) { content = ""; }
        content = content.trim();

        var button = self.buttons[content];
        if (typeof button === "undefined") {
            return p;
        }

        var amount = Number(button);
        if (!Number.isNaN(amount)) {
            self.inc_current_page(amount);
            return p;
        }

        if (button !== "exit") {
            return p;
        }

        p = Q(utils.maybe_call(self.next, self, [content]));
        return p.then(function (next) {
            return self.im.user.set_state(next);
        });
    });

    self.get_current_page = function() {
        return self.metadata.page;
    };

    self.set_current_page = function(page) {
        self.metadata.page = page;
        return self;
    };

    self.inc_current_page = function(amount) {
        var page = self.get_current_page() + amount;

        page = page % self.pages;
        if (page < 0) {
            page += self.pages;
        }

        self.set_current_page(page);
        return self;
    };

    self.display = function() {
        var page = self.get_current_page();
        return Q(self.page_text(page)).then(function(content) {
            return content + self.footer_text;
        });
    };
});

// exports
this.BookletState = BookletState;
