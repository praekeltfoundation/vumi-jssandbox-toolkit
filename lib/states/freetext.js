// freetext.js
//  - States for free text entry.

var Q = require('q');


var utils = require('../utils');
var state = require("./state");
var State = state.State;


function FreeText(name, opts) {
    /**class:FreeText(name, next, question, [opts])
    A state which displays a text, then allows the user to respond with
    any text.
     
    :param string name:
        name used to identify and refer to the state
    :param fn_or_str opts.next:
        state that the user should visit after this
        state. Functions may return a promise.
    :param string opts.question:
        text to display to the user
    :param function opts.check:
        a function ``func(content)`` for validating a user's response. Should
        return ``true`` if the response is considered valid, and ``false`` if
        otherwise.
    :param string opts.error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param object opts.handlers:
        object of handlers for particular events, see :class:`State`.
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;

    opts = utils.set_defaults(opts || {}, {
        check: null,
        error: ''
    });

    State.call(self, name, opts);
    self.next = opts.next;
    self.question_text = opts.question;
    self.check = opts.check;
    self.error_text = opts.error;
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

    self.input_event = function(content) {
        if (!content) { content = ""; }
        content = content.trim();

        if (!self.check_content(content)) {
            self.in_error = true;
            return Q();
        }

        var p = Q(utils.call_possible_function(self.next, self, [content]));
        return p.then(function(next) {
            return Q.all([
                self.im.set_user_state(next),
                self.save_response(content)]);
        });
    };

    self.translate = function(i18n) {
        self.question_text = i18n.gettext(self.question_text);

        if (self.error_text) {
            self.error_text = i18n.gettext(self.error_text);
        }
    };

    self.display = function() {
        return self.in_error
            ? self.error_text
            : self.question_text;
    };
}


this.FreeText = FreeText;
