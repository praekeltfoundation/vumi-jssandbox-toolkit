// choices.js
//  - States for showing lists of choices.

var state = require("./state.js");
var State = state.State;

function Choice(value, label) {
    /**class:Choice(value, label)
    An individual choice that the user can select inside a :class:`ChoiceState`.

    :param string value: string used when storing, processing and looking up the choice.
    :param string label: string displayed to the user.
    */
    var self = this;

    self.value = value;
    self.label = label;

    self.label_matches = function(query) {
        var label = self.label.toLowerCase();
        query = query.trim().toLowerCase();
        return label == query;
    };
}

function ChoiceState(name, next, question, choices, error, handlers, options) {
    /**class:ChoiceState(name, next, question, choices, error, handlers, [options])

    A state which displays a list of numbered choices, then allows the user
    to respond by selecting one of the choices.

    :param string name:
        name used to identify and refer to the state
    :param fn_or_str next:
        state that the user should visit after this
        state. Functions may return a promise.
    :param string question:
        text to display to the user
    :param string error:
        error text to display to the user if we reach this state in error.
        Optional.
    :param object handlers:
        object of handlers for particular events, see :class:`State`.
    :param boolean options.accept_labels:
        whether choice labels are accepted as the user's responses. For eg, if
        ``accept_labels`` is true, the state will accepts both "1" and "Red" as
        responses responses if the state's first choice is "Red". Defaults to
        ``false``.
    :type fn_or_str: ``Function`` or ``String``
    */

    var self = this;
    State.call(self, name, handlers);
    options = options || {};

    self.next = next;
    self.question_text = question;
    self.error_text = error;
    self.choices = choices;
    self.in_error = false;

    self.accept_labels = 'accept_labels' in options
        ? options.accept_labels
        : false;

    var orig_on_enter = self.on_enter;
    self.on_enter = function() {
        self.in_error = false;
        return orig_on_enter();
    };

    self.current_choices = function() {
        return self.choices;
    };

    self.process_choice = function(choice) {
        // return true if the choice has been handled completely
        // or false if the choice should be propagated to the
        // next state handler.
        return false;
    };

    self.choice_from_number = function(n) {
      var choices = self.current_choices();

      return !(n < 1 || (n > choices.length))
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

    self.input_event = function(content, done) {
        var choice = self.choice_from_content(content);

        if (choice === null) {
            self.in_error = true;
            done();
            return;
        }

        if (self.process_choice(choice)) {
            done();
            return;
        }

        self.call_possible_function(
            self.next, self, [choice],
            function (next) {
                self.im.set_user_state(next);
                self.save_response(choice.value);
                done();
            }
        );
    };

    self.translate = function(i18n) {
        self.question_text = i18n.gettext(self.question_text);
        if (self.error_text) {
            self.error_text = i18n.gettext(self.error_text);
        }
        self.choices.forEach(function (choice) {
            choice.label = i18n.gettext(choice.label);
        });
    };

    self.shorten_choices = function(text, choices) {
        // hook for replacing choices with shorter ones if
        // needed.
        return choices;
    };

    self.format_choice = function(choice, index) {
        return "\n" + (index + 1) + ". " + choice.label;
    };

    self.display = function() {
        var text = (self.in_error ?
                    self.error_text || self.question_text :
                    self.question_text);
        var choices = self.current_choices();
        choices = self.shorten_choices(text, choices);
        choices.forEach(function(choice, index) {
            text += self.format_choice(choice, index);
        });
        return text;
    };
}


function LanguageChoice(name, next, question, choices, error, handlers, options) {
    /**class:LanguageChoice(name, next, question, choices, error, handlers, [options])

    A state for selecting a language.

    It functions exactly like :class:`ChoiceState` except that it also stores the
    value of the selected choices as the user's language (it is still available
    as an answer too).

    :class:`Choice` instances passed to this state should have two-letter
    language codes as values, e.g.::

        new LanguageChoice(
            "select_language",
            "next_state",
            "What language would you like to use?",
            [ new Choice("sw", "Swahili"), new Choice("en", "English") ]
        );

    See :class:`ChoiceState` for a description of the parameters to the
    constructor.
    */

    var self = this;
    ChoiceState.call(self, name, next, question, choices, error, handlers,
                     options);

    self.save_response = function(response) {
        // override save_response to also set the language
        self.im.set_user_lang(response);
        self.im.set_user_answer(self.name, response);
    };
}


function PaginatedChoiceState(name, next, question, choices, error, handlers,
                              page_opts, options) {
    /**class:PaginatedChoiceState(name, next, question, choices, error, handlers, page_opts, [options])

    A sub-class of :class:`ChoiceState` that splits the list of choices given
    into pages.

    :param string page_opts.back:
        Label to use for the previous page option (defaults to ``Back``).
    :param string page_opts.more:
        Label to use for the next page options (defaults to ``More``).
    :param integer page_opts.options_per_page:
        Maximum number of options per page, excluding the next and previous
        page options (defaults to 8).
    :param interger page_opts.characters_per_page:
        If set, labels for choices will be shortened so that there are no
        more than this number of characters per page of text sent to the
        user (default is ``null`` -- i.e. don't shorten any text). Shortened
        choices are truncated and have ``...`` appended to indicate to the
        user that the option has been shortened. The character count includes
        all content rendered when displaying the state (i.e. the question,
        the choices selected for the page and any previous or next
        choices added by :class:`PaginatedChoiceState`).

    Other parameters are described in :class:`ChoiceState`.
    */

    var self = this;
    ChoiceState.call(self, name, next, question, choices, error, handlers,
                     options);

    self.back = new Choice("__back__", page_opts.back || "Back");
    self.more = new Choice("__more__", page_opts.more || "More");
    self.options_per_page = page_opts.options_per_page || 8;
    self.characters_per_page = page_opts.characters_per_page || null;

    var orig_translate = self.translate;
    self.translate = function(i18n) {
        orig_translate.call(self, i18n);
        self.back.label = i18n.translate(self.back.label);
        self.more.label = i18n.translate(self.more.label);
    };

    var orig_on_enter = self.on_enter;
    self.on_enter = function() {
        self.set_page_start(self.im.user, 0);
        return orig_on_enter();
    };

    self.get_page_start = function(user) {
        var pages = user.pages || {};
        return pages[self.name] || 0;
    };

    self.set_page_start = function(user, page_start) {
        if (typeof user.pages == 'undefined') {
            user.pages = {};
        }
        user.pages[self.name] = page_start;
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
        var start = self.get_page_start(self.im.user);
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
        // return true if the choice has been handled completely
        // or false if the choice should be propagated to the
        // next state handler.
        if (choice == self.back || choice == self.more) {
            var inc = ((choice == self.back) ? -self.options_per_page :
                       self.options_per_page);
            var start = self.get_page_start(self.im.user);
            var new_start = start + inc;
            self.set_page_start(self.im.user, new_start < 0 ? 0 : new_start);
            return true;
        }
        else {
            return false;
        }
    };
}


// exports

this.Choice = Choice;
this.ChoiceState = ChoiceState;
this.LanguageChoice = LanguageChoice;
this.PaginatedChoiceState = PaginatedChoiceState;
