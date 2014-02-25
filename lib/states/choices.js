// choices.js
//  - States for showing lists of choices.

var Q = require("q");
var _ = require("lodash");

var utils = require('../utils');
var Extendable = utils.Extendable;

var state = require("./state.js");
var State = state.State;


var Choice = Extendable.extend(function(self, value, label) {
    /**class:Choice(value, label)
    An individual choice that the user can select inside a :class:`ChoiceState`.

    :type value: string or LazyText
    :param string value:
        string used when storing, processing and looking up the choice.
    :param string label:
        string displayed to the user.
    */
    self.value = value;
    self.label = label;

    self.label_matches = function(query) {
        var label = self.label.toLowerCase();
        query = query.trim().toLowerCase();
        return label == query;
    };

    self.serialize = function() {
        return {
            value: self.value,
            label: self.label
        };
    };

    self.toJSON = self.serialize;
});

var ChoiceState = State.extend(function(self, name, opts) {
    /**class:ChoiceState(name, opts)

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string name:
        name used to identify and refer to the state
    :type opts.question: string or LazyText
    :param opts.question:
        text to display to the user
    :type opts.error: string or LazyText
    :param opts.error:
        error text to display to the user if bad user input was given.
        Optional.
    :param boolean opts.accept_labels:
        whether choice labels are accepted as the user's responses. For eg, if
        ``accept_labels`` is true, the state will accepts both "1" and "Red" as
        responses responses if the state's first choice is "Red". Defaults to
        ``false``.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param fn_or_str_or_obj opts.next:
        state that the user should visit after this state. May either be the
        name of the next state, an options object representing the next state,
        or a function of the form ``f(choice)`` returning either, where
        ``choice`` is the :class:`Choice` chosen by the user. If ``next`` is
        ``null`` or not defined, the state machine will be left in the current
        state. See :meth:`State.set_next_state`.
    :type fn_or_str_or_obj:
        function, string, or object.
    */
    opts = _.defaults(opts || {}, {
        error: null,
        next: null,
        accept_labels: false
    });

    State.call(self, name, opts);

    self.next = opts.next;
    self.question_text = opts.question;
    self.choices = opts.choices;
    self.error_text = opts.error || opts.question;
    self.accept_labels = opts.accept_labels;

    self.on('state:input', function(event) {
        var content = event.content;
        var choice = self.choice_from_content(content);

        return self.validate(choice).then(function() {
            if (self.error) { return; }

            return Q(self.process_choice(choice)).then(function(handled) {
                if (handled) { return; }
                self.save_response(content);
                return self.set_next_state(self.next, choice);
            });
        });
    });

    self.check = function(choice) {
        if (choice === null) {
            return self.error_text;
        }
    };

    self.current_choices = function() {
        return self.choices;
    };

    self.process_choice = function(choice) {
        /**:ChoiceState.process_choice(choice)
        Return ``true`` if the choice has been handled completely or ``false``
        if the choice should be propagated to the next state handler.
        
        This allows sub-classes to provide custom processing for special
        choices (e.g. forward and back options for navigating through long
        choice lists).
        
        :param Choice choice: choice to be processed.
        */
        return false;
    };

    self.choice_from_number = function(n) {
        var choices = self.current_choices();

        return !(n < 1 || n > choices.length)
            ? choices[n - 1]
            : null;
    };

    self.choice_from_label = function(label) {
        var choices = self.current_choices();

        var i = -1;
        var n = choices.length;
        var choice;

        while (++i < n) {
            choice = choices[i];

            if (choice.label_matches(label)) {
                return choice;
            }
        }

        return null;
    };

    self.choice_from_content = function(content) {
        content = (content || "").trim();

        var n = Number(content);
        var choice = null;

        if (!Number.isNaN(n)) {
            choice = self.choice_from_number(n);
        }
        else if (self.accept_labels) {
            choice = self.choice_from_label(content);
        }

        return choice;
    };

    self.translate = function(i18n) {
        self.question_text = i18n(self.question_text);

        if (self.error) {
            self.error.translate(i18n);
        }

        self.choices.forEach(function (choice) {
            choice.label = i18n(choice.label);
        });
    };

    self.shorten_choices = function(text, choices) {
        /**:ChoiceState.shorten_choices(text, choices)
        Hook for replacing choices with shorter ones if needed.
        */
        return choices;
    };

    self.format_choice = function(choice, index) {
        return "\n" + (index + 1) + ". " + choice.label;
    };

    self.display = function() {
        var text = self.error
            ? self.error.response
            : self.question_text;
            
        var choices = self.current_choices();
        choices = self.shorten_choices(text, choices);
        choices.forEach(function(choice, index) {
            text += self.format_choice(choice, index);
        });
        return text;
    };
});


var MenuState = ChoiceState.extend(function(self, name, opts) {
    /**class:MenuState(name, opts)

    A :class:`ChoiceState` whose :class:`Choice` values are either state names
    or state options objects. See :meth:`State.set_next_state` for a
    description of the options objects.

    Supports the same parameters as :class:`ChoiceState` except that
    ``opts.next`` isn't available.
    */

    opts.next = function(choice) {
        return choice.value;
    };

    ChoiceState.call(self, name, opts);
});


var LanguageChoice = ChoiceState.extend(function(self, name, opts) {
    /**class:LanguageChoice(opts)

    A state for selecting a language.

    :param string name:
        name used to identify and refer to the state
    :param fn_or_str opts.next:
        state that the user should visit after this state. Functions should have
        the form ``f(choice)`` and return the name of the next state or
        a promise that returns the name. The value of ``this`` inside
        ``f`` will be the calling :class:`ChoiceState` instance.
    :type opts.question: string or LazyText
    :param opts.question:
        text to display to the user
    :type opts.error: string or LazyText
    :param opts.error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param boolean opts.accept_labels:
        whether choice labels are accepted as the user's responses. For eg, if
        ``accept_labels`` is true, the state will accepts both "1" and "Red" as
        responses responses if the state's first choice is "Red". Defaults to
        ``false``.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.

    It functions exactly like :class:`ChoiceState` except that it also stores the
    value of the selected choices as the user's language (it is still available
    as an answer too).

    :class:`Choice` instances passed to this state should have two-letter
    language codes as values, e.g.::

        new LanguageChoice(
            "select_language",
            {
                next: "next_state",
                question: "What language would you like to use?",
                choices: [ new Choice("sw", "Swahili"), new Choice("en", "English") ]
            }
        );
    */
    ChoiceState.call(self, name, opts);

    self.save_response = function(response) {
        // override save_response to also set the language
        self.im.set_user_lang(response);
        self.im.set_user_answer(self.name, response);
    };
});


var PaginatedChoiceState = ChoiceState.extend(function(self, name, opts) {
    /**class:PaginatedChoiceState(name, opts)

    A choice state for displaying long lists of choices by spanning the choices
    across multiple pages.

    :param string name:
        name used to identify and refer to the state
    :param fn_or_str opts.next:
        state that the user should visit after this state. Functions should
        have the form ``f(choice)`` and return the name of the next state or a
        promise that returns the name. The value of ``this`` inside ``f`` will
        be the calling :class:`ChoiceState` instance.
    :type opts.question: string or LazyText
    :param string opts.question:
        text to display to the user
    :type opts.error: string or LazyText
    :param opts.error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param boolean opts.accept_labels:
        whether choice labels are accepted as the user's responses. For eg, if
        ``accept_labels`` is true, the state will accepts both "1" and "Red" as
        responses responses if the state's first choice is "Red". Defaults to
        ``false``.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to `true`.
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to `true`.
    :param string opts.back:
        the choice label to display to the user for going back a page.
        Default is `"Back"`.
    :param string opts.more:
        the choice label to display to the user for going to the next page
        Default is `"Next"`.
    :param int opts.options_per_page:
        maximum number of choices to display per page. Default is `8`.
    :param int opts.characters_per_age:
        maximum number of characters to display per page. Default is `null`,
        i.e. no maximum.
    */
    opts = _.defaults(opts || {}, {
        back: "Back",
        more: "More",
        options_per_page: 8,
        characters_per_page: null
    });

    ChoiceState.call(self, name, opts);
    self.back = new Choice("__back__", opts.back);
    self.more = new Choice("__more__", opts.more);
    self.options_per_page = opts.options_per_page;
    self.characters_per_page = opts.characters_per_page;

    var init = self.init;
    self.init = function() {
        init.call(self);
        self.metadata.page_start = 0;
    };

    var translate = self.translate;
    self.translate = function(i18n) {
        translate.call(self, i18n);
        self.back.label = i18n(self.back.label);
        self.more.label = i18n(self.more.label);
    };

    self.shorten_choices = function(text, choices) {
        if (!self.characters_per_page)
            return choices;

        var left = self.characters_per_page - text.length;
        if (left < 0)
            return choices; // nothing we can do anyway

        var total = 0;
        var count = 0;
        var text_lengths = [];
        var orig_lengths = [];
        choices.forEach(function (choice, index) {
            var text_length = self.format_choice(choice, index).length;
            if (choice == self.back || choice == self.more) {
                // these are subtracted from left
                orig_lengths[index] = 0;
                text_lengths[index] = 0;
                left -= text_length;
            }
            else {
                text_lengths[index] = text_length;
                orig_lengths[index] = text_length;
                total += text_length;
                count += 1;
            }
        });
        if (total <= left || count === 0)
            return choices;

        function max_index(a) {
            var max = 0;
            var index = 0;
            a.forEach(function (v, i) {
                if (v > max) {
                    max = v;
                    index = i;
                }
            });
            return index;
        }

        var too_long = total - left;
        for (var i = 0; i < too_long; i++) {
            var index = max_index(text_lengths);
            text_lengths[index] -= 1;
        }

        return choices.map(function (choice, index) {
            if (choice == self.back || choice == self.more)
                return choice;
            var trunc = text_lengths[index] - orig_lengths[index];
            if (trunc >= 0)
                return choice;
            return new Choice(choice.value,
                              choice.label.slice(0, trunc - 3) + "...");
        });
    };

    self.current_choices = function() {
        var start = self.metadata.page_start;
        var end = start + self.options_per_page;
        var choices = self.choices.slice(start, end);

        if (end < self.choices.length) {
            choices[choices.length] = self.more;
        }
        if (start !== 0) {
            choices[choices.length] = self.back;
        }

        return choices;
    };

    self.process_choice = function(choice) {
        if (choice == self.back || choice == self.more) {
            var inc = ((choice == self.back) ? -self.options_per_page :
                       self.options_per_page);
            var start = self.metadata.page_start;
            var new_start = start + inc;
            self.metadata.page_start = new_start < 0 ? 0 : new_start;
            return true;
        }
        else {
            return false;
        }
    };
});


// exports

this.Choice = Choice;
this.ChoiceState = ChoiceState;
this.LanguageChoice = LanguageChoice;
this.PaginatedChoiceState = PaginatedChoiceState;
this.MenuState = MenuState;
