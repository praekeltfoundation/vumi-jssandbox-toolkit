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
        ``n`` is the maximum number of characters per page (equivalent to the
        value given for the ``'chars'`` option) and ``this`` is the
        :class:`PaginatedState` instance.
        
        When the function returns a falsy value, page ``i - 1`` is taken as the
        last page to be displayed to the user. The function may also return a
        promise fulfilled with the value.
        
        If this option is not provided, the :class:`PaginatedState`
        will use a default function that will display the words that fit on
        the page based on the values of ``i`` and the given ``'chars'``
        option.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param int opts.chars:
        maximum number of characters to display per page. Default is `135`.
        Note that this number excludes the characters needed to display the
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
        chars: 135,
        text: ''
    });

    State.call(self, name, opts);

    self.init = function() {
        self.choices = {
            back: opts.back,
            more: opts.more,
            exit: opts.exit
        };

        self.next = opts.next;
        self.chars = opts.chars;
        self.text = opts.text;
        self.page = opts.page || self._page;

        _.defaults(self.metadata, {
            page: 0,
            choices: null
        });
    };

    self.on('state:input', function(e) {
        var content = (e.content || '').trim();
        if (isNaN(content)) { return; }

        var p;
        var choice = self.metadata.choices[+content - 1];
        if (choice == 'back') { self.metadata.page--; }
        if (choice == 'more') { self.metadata.page++; }
        if (choice == 'exit') { p = self.set_next_state(self.next, content); }

        return p;
    });

    self.translate = function(i18n) {
        var i = self.metadata.page;
        var text = i18n(self.text);

        return Q
            .all([
                self.page(i, text, self.chars),
                self.page(i + 1, text, self.chars)])
            .spread(function(text, more) {
                self.metadata.choices = self._current_choices(i < 1, !more);
                var choices = self.metadata.choices.map(self._choice_text);

                self.metadata.text = [text || '']
                    .concat(choices)
                    .join('\n');
            });
    };

    self.display = function() {
        return self.metadata.text;
    };

    self._choice_text = function(choice, i) {
        return [(i + 1), self.choices[choice]].join('. ');
    };

    self._current_choices = function(first, last) {
        var choices = [];
        if (!first) { choices.push('back'); }
        if (!last) { choices.push('more'); }
        choices.push('exit');
        return choices;
    };

    self._page = function(i, text, n) {
        if (i * n > text.length) { return; }

        var start;
        if (i < 1) { start = 0; }
        else { start = text.lastIndexOf(' ', n * i) + 1; }

        var end;
        var pos = (i + 1) * n;
        if (pos > text.length) { end = text.length; }
        else { end = text.lastIndexOf(' ', pos); }

        return text.slice(start, end);
    };
});

this.PaginatedState = PaginatedState;
