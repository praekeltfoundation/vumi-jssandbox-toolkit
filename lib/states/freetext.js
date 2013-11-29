// freetext.js
//  - States for free text entry.

var Q = require('q');


var utils = require('../utils');
var state = require("./state.js");
var State = state.State;


function FreeText(name, next, question, opts) {
    /**class:FreeText(name, [opts])
    A state which displays a text, then allows the user to respond with
    any text.
     
    :param string name:
        name used to identify and refer to the state
    :param fn_or_str next:
        state that the user should visit after this
        state. Functions may return a promise.
    :param string question:
        text to display to the user
    :param function opts.check:
        a function ``func(content)`` for validating a user's response. Should
        return ``true`` if the response is considered valid, and ``false`` if
        otherwise.
    :param string opts.error:
        error text to display to the user if we reach this state in error
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;

    opts = utils.set_defaults(opts || {}, {
        check: null,
        error: ''
    });

    State.call(self, name, opts);
    self.next = next;
    self.question_text = question;
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

        var p;
        if (!self.check_content(content)) {
            self.in_error = true;
            p = Q();
        }
        else {
            p = Q(utils.call_possible_function(self.next, self, [content]));
        }

        return p.then(function(next) {
            return Q
                .all([
                    self.im.set_user_state(next),
                    self.save_response(content)])
                .then();
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
