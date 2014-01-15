// end.js
//  - End states.

var Q = require('q');

var utils = require('../utils');
var state = require("./state");
var State = state.State;


function EndState(opts) {
    /**class:EndState(opts)

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string opts.name:
        name used to identify and refer to the state
    :param fn_or_str opts.next:
        state that the user should visit after this state. Functions should
        have the form ``f(message_content)`` and return the name of the next
        state (or a promise that will return the name). The value of ``this``
        will be the calling :class:`EndState` instance. If ``next`` is ``null``
        or not defined, the state machine will be left in the current state.
    :param string opts.text:
        text to display to the user
    :param object opts.handlers:
        object of handlers for particular events, see :class:`State`.
    */

    var self = this;

    opts = opts || {};
    opts.continue_session = false;
    State.call(self, opts);

    self.on('state:setup', function() {
        self.im.on('session:new', function(event) {
            return self.emit.input('');
        });
    });

    self.on('state:input', function(event) {
        var content = event.content;
        var p = Q(utils.call_possible_function(self.next, self, [content]));

        return p.then(function(next) {
            return self.im.set_user_state(next);
        });
    });

    self.end_text = opts.text;
    self.next = opts.next;

    self.translate = function(i18n) {
        self.end_text = i18n.gettext(self.end_text);
    };

    self.display = function() {
        return self.end_text;
    };
}


// exports
this.EndState = EndState;
