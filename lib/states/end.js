var _ = require('lodash');

var state = require('./state');
var State = state.State;


var EndState = State.extend(function(self, name, opts) {
    /**class:EndState(name, opts)

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string name:
        name used to identify and refer to the state
    :type opts.text: string or LazyText
    :param opts.text:
        text to display to the user
    :param fn_or_str_or_obj opts.next:
        state that the user should visit after this state. May either be the
        name of the next state, an options object representing the next state,
        or a function of the form ``f(content)`` returning either, where
        ``content`` is the input given by the user. If ``next`` is ``null`` or
        not defined, the state machine will be left in the current state. See
        :meth:`State.set_next_state`.
    :param object opts.events:
        Optional event name-listener mappings to bind.
    :type fn_or_str_or_obj:
        function, string, or object.
    */
    opts = _.defaults(opts || {}, {next: null});

    opts.continue_session = false;
    State.call(self, name, opts);

    self.on('setup', function() {
        self.im.on('session:new', function() {
            return self.set_next_state(self.next);
        });
    });

    self.end_text = opts.text;
    self.next = opts.next;

    self.translate = function(i18n) {
        self.end_text = i18n(self.end_text);
    };

    self.display = function() {
        return self.end_text;
    };
});


this.EndState = EndState;
