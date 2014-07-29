var state = require('./state');
var State = state.State;


var PaginatedState = State.extend(function(self, name, opts) {
    /**class:PaginatedState(name, opts)

    Add state type that divides up the given text into pages.

    :param string name:
        name used to identify and refer to the state
    :type opts.text:
        string or LazyText
    :param opts.text:
        the content to display to the user
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param int opts.chars:
        maximum number of characters to display per page. Default is `135`.
        Note that this number excludes the characters needed to display the
        'back', 'more' and 'exit' choices.
    :param string opts.back:
        the choice label to display to the user for going back a page.
        Default is `"Back"`.
    :param string opts.more:
        the choice label to display to the user for going to the next page
        Default is `"More"`.
    :param string opts.exit:
        the choice label to display to the user for going to the next state.
        Default is `"Exit"`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :type opts.next:
       function or string
    :param opts.next:
        state that the user should visit after this state. May either be the
        name of the next state, an options object representing the next state,
        or a function of the form ``f(content)`` returning either, where
        ``content`` is the input given by the user when the user chooses to
        exit the :class:`PaginatedState` If ``next`` is ``null`` or not
        defined, the state machine will be left in the current state. See
        :meth:`State.set_next_state`.
    :param object opts.events:
        Optional event name-listener mappings to bind.
    */
});


this.PaginatedState = PaginatedState;
