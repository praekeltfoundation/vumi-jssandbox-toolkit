// choices.js
//  - States for showing lists of choices.

var state = require("./state.js");
var State = state.State;


function Choice(value, label) {
    this.value = value;
    this.label = label;
}


function ChoiceState(name, next, question, choices, error, handlers) {
    var self = this;
    State.call(self, name, handlers);
    self.next = next;
    self.question_text = question;
    self.error_text = error;
    self.choices = choices;
    self.in_error = false;

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

    self.input_event = function(content, done) {
        if (!content) { content = ""; }
        content = content.trim();
        var choice_input = Number(content);
        var choices = self.current_choices();
        if ((Number.isNaN(choice_input)) || (choice_input < 1) ||
            (choice_input > choices.length)) {
            self.in_error = true;
            done();
            return;
        }
        var choice = choices[choice_input - 1];

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


function LanguageChoice(name, next, question, choices, error, handlers) {
    var self = this;
    ChoiceState.call(self, name, next, question, choices, error, handlers);

    self.save_response = function(response) {
        // override save_response to also set the language
        self.im.set_user_lang(response);
        self.im.set_user_answer(self.name, response);
    };
}


function PaginatedChoiceState(name, next, question, choices, error, handlers,
                              page_opts) {
    var self = this;
    ChoiceState.call(self, name, next, question, choices, error, handlers);

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
            return chocies; // nothing we can do anyway

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
            return new Choice(choice.id,
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