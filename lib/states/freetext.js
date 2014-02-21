// freetext.js
//  - States for free text entry.

var _ = require("underscore");

var state = require("./state");
var State = state.State;


var FreeText = State.extend(function(self, name, opts) {
    /**class:FreeText(opts)
    A state which displays a text, then allows the user to respond with
    any text.
     
    :param string name:
        name used to identify and refer to the state
    :type opts.question: string or LazyText
    :param opts.question:
        text to display to the user.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param function opts.check:
        a function ``func(content)`` for validating a user's response, where
        ``content`` is the user's input. If a string :class:`LazyText` is
        returned, the text will be taken as the error response to send back to
        the user. If a :class:`StateInvalidError` is returned, its ``response``
        property will be taken as the error response to send back to the user.
        Any other value returned will be taken as a non-error. The result may
        be returned via a promise. See :meth:`State.validate`.
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
    opts = _.defaults(opts || {}, {next: null});
    State.call(self, name, opts);

    self.next = opts.next;
    self.question_text = opts.question;
    self.error = null;

    self.on('state:input', function(event) {
        var content = (event.content || "").trim();

        return self.validate(content).then(function() {
            if (!self.error) {
                self.save_response(content);
                return self.set_next_state(self.next, content);
            }
        });
    });

    self.translate = function(i18n) {
        self.question_text = i18n(self.question_text);

        if (self.error) {
            self.error.translate(i18n);
        }
    };

    self.display = function() {
        return self.error
            ? self.error.response
            : self.question_text;
    };
});


this.FreeText = FreeText;
