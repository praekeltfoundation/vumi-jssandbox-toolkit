// end.js
//  - End states.

var Q = require('q');

var utils = require('../utils');
var state = require("./state");
var State = state.State;


function EndState(name, opts) {
    /**class:EndState(name, next, [opts])

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string name:
        name used to identify and refer to the state
    :param fn_or_str opts.next:
        state that the user should visit after this
        state. Functions may return a promise.
    :param string opts.text:
        text to display to the user
    :param object opts.handlers:
        object of handlers for particular events, see :js:class:`State`.
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;

    opts = opts || {};
    opts.continue_session = false;
    State.call(self, name, opts);

    self.end_text = opts.text;
    self.next = opts.next;

    self.input_event = function(content) {
        var p = Q(utils.call_possible_function(self.next, self, [content]));

        return p.then(function(next) {
            return self.im.set_user_state(next);
        });
    };

    self.new_session_event = function() {
        return self.input_event('');
    };

    self.translate = function(i18n) {
        self.end_text = i18n.gettext(self.end_text);
    };

    self.display = function() {
        return self.end_text;
    };
}


// exports
this.EndState = EndState;
