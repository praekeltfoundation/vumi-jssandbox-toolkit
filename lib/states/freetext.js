// freetext.js
//  - States for free text entry.

var Q = require('q');


var utils = require('../utils');
var state = require("./state");
var State = state.State;


var FreeText = State.extend(function(self, name, opts) {
    /**class:FreeText(opts)
    A state which displays a text, then allows the user to respond with
    any text.
     
    :param string name:
        name used to identify and refer to the state
    :param string opts.question:
        text to display to the user.
    :param function opts.check:
        a function ``func(content)`` for validating a user's response. Should
        return ``true`` if the response is considered valid, and ``false`` if
        otherwise. May return a promise.
    :param string opts.error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param fn_or_str_or_obj opts.next:
        state that the user should visit after this state. May either be the
        name of the next state, an options object representing the next state,
        or a function of the form ``f(content)`` returning either, where
        ``content`` is the input given by the user. If ``next`` is ``null`` or
        not defined, the state machine will be left in the current state. See
        :meth:`State.set_next_state`.
    :type fn_or_str_or_obj:
        function, string, or object.
    */
    opts = utils.set_defaults(opts || {}, {
        next: null,
        check: null,
        error: ''
    });

    State.call(self, name, opts);
    self.next = opts.next;
    self.question_text = opts.question;
    self.check_content = opts.check || utils.functor(true);
    self.error_text = opts.error;
    self.in_error = false;

    self.on('state:enter', function() {
        self.in_error = false;
    });

    self.on('state:input', function(event) {
        var content = event.content;

        if (!content) { content = ""; }
        content = content.trim();

        return Q()
            .then(function() {
                return self.check_content(content);
            })
            .then(function(valid) {
                if (!valid) {
                    self.in_error = true;
                    return;
                }

                self.save_response(content);
                return self.set_next_state(self.next, content);
            });
    });

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
});


this.FreeText = FreeText;
