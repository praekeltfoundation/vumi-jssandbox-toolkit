var _ = require('lodash');
var Q = require('q');

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
        the content to display to the user.
    :param opts.page:
        The function to use to determine the text shown to the user.
        
        The function should return the text to be displayed to the user as a
        ``string`` and take the form ``fn(i, text, n)``, where `i`` is the
        user's 0-indexed current page number,``text`` is the translated text,
        ``n`` is the maximum number of characters that can fit on the page
        (after taking into account the nagivation choices) and ``this`` is the
        :class:`PaginatedState` instance.
        
        When the function returns a falsy value, page ``i - 1`` is taken as the
        last page to be displayed to the user. The function may also return a
        promise fulfilled with the value.
        
        If this option is not provided, the :class:`PaginatedState`
        will use a default function that will display the words that fit on
        the page based on the values of ``i`` and the given ``'characters_per_page'``
        option.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param int opts.characters_per_page:
        maximum number of characters to display per page (including the
        characters needed for the navigation choices). Default is `160`.
        ``'back'``, ``'more'`` and ``'exit'`` choices.
    :param string opts.back:
        the label to display to the user for going back a page. Defaults to
        ``'Back'``.
    :param string opts.more:
        the label to display to the user for going to the next page. Defaults to
        ``'More'``.
    :param string opts.exit:
        the choice label to display to the user for going to the next state.
        Defaults to ``'Exit'``.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :type opts.next:
       function or string
    :param opts.next:
        state that the user should visit after this state. May either be the
        name of the next state, an options object representing the next state,
        or a function of the form ``f(content)`` returning either, where
        ``content`` is the input given by the user when the user chooses to
        exit the :class:`PaginatedState`. If ``next`` is ``null`` or not
        defined, the state machine will be left in the current state. See
        :meth:`State.set_next_state`.
    :param object opts.events:
        Optional event name-listener mappings to bind.
    */
    opts = _.defaults(opts || {}, {
        back: 'Back',
        more: 'More',
        exit: 'Exit',
        characters_per_page: 160,
        text: ''
    });

    self.choices = {
        back: opts.back,
        more: opts.more,
        exit: opts.exit
    };

    self.next = opts.next;
    self.characters_per_page = opts.characters_per_page;
    self.text = opts.text;
    self.page = opts.page;

    State.call(self, name, opts);

    self.init = function() {
        self._text = null;
        self._current_choices = null;
        self.page = self.page || page_slice;
        _.defaults(self.metadata, {page: 0});
    };

    self.on('state:input', function(e) {
        var content = (e.content || '').trim();
        if (isNaN(content)) { return; }

        var p;
        var choice = self._current_choices[+content - 1];
        if (choice == 'more') { self.metadata.page++; }
        if (choice == 'back') { self.metadata.page--; }
        if (choice == 'exit') { p = self.set_next_state(self.next, content); }

        return p;
    });

    self.translate = function(i18n) {
        var i = self.metadata.page;
        var text = i18n(self.text);
        var choices = _.mapValues(self.choices, i18n);
        var n = self._chars(choices);

        return Q
            .all([
                self.page(i, text, n),
                self.page(i + 1, text, n)])
            .spread(function(text, more) {
                self._current_choices = self._determine_choices(i < 1, !more);

                choices = self._current_choices
                    .map(function(name) { return choices[name]; })
                    .map(self._choice_text);

                self._text = [text || '']
                    .concat(choices)
                    .join('\n');
            });
    };

    self.display = function() {
        return self._text;
    };

    self._chars = function(choices) {
        // TODO this needs to be made less naive, it assumes that the last page
        // needs space for a 'more' choice and that the first page needs space
        // for a 'back' choice
        return self.characters_per_page - _.chain(choices)
            .values()
            .map(self._choice_text)
            .concat('')  // account for newline between text and choices
            .join('\n')
            .value()
            .length;
    };

    self._choice_text = function(choice, i) {
        return [(i + 1), choice].join('. ');
    };

    self._determine_choices = function(first, last) {
        var choices = [];
        if (!last) { choices.push('more'); }
        if (!first) { choices.push('back'); }
        choices.push('exit');
        return choices;
    };
});


function page_slice(i, text, n) {
    if (i * n > text.length) return null;
    return text.slice(page_start(i, text, n), page_end(i, text, n));
}


function page_start(i, text, n) {
    return i > 0
        ? page_end(i - 1, text, n) + 1
        : 0;
}


function page_end(i, text, n) {
    var start = page_start(i, text, n);
    return start + n < text.length
        ? last_space(start + n, text)
        : text.length;
}


function last_space(from, text) {
    return text.lastIndexOf(' ', from);
}


this.PaginatedState = PaginatedState;
