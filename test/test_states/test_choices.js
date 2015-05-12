var Q = require('q');
var _ = require('lodash');
var assert = require('assert');

var vumigo = require('../../lib');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var fixtures = vumigo.fixtures;
var test_utils = vumigo.test_utils;

var ChoiceState = vumigo.states.ChoiceState;
var MenuState = vumigo.states.MenuState;
var LanguageChoice = vumigo.states.LanguageChoice;
var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
var Choice = vumigo.states.Choice;


describe("states.choice", function() {
    describe("ChoiceState", function () {
        var im;
        var state;

        function make_state(opts) {
            opts = _.defaults(opts || {}, {
                name: "color_state",
                error: "no!",
                question: "What is your favourite colour?",
                choices: [
                    new Choice('red', 'Red'),
                    new Choice('blue', 'Blue')],
                next: function(choice) {
                    return {
                        red: 'red_state',
                        blue: 'blue_state',
                    }[choice.value];
                }
            });

            return test_utils
                .make_im()
                .then(function(new_im) {
                    im = new_im;
                })
                .then(function() {
                    state = new ChoiceState(opts.name, opts);
                    im.app.states.add(state);
                    return im.switch_state(opts.name).thenResolve(state);
                });
        }

        beforeEach(function () {
            return make_state();
        });

        describe("if the 'accept_labels' option is not set", function() {
            it("should accept a number-based answers", function () {
                assert(!im.next_state.exists());

                return state.input("1").then(function() {
                    assert(im.next_state.is('red_state'));
                });
            });

            it("should not accept label-based answers", function() {
                return state.input("Red").then(function() {
                    assert(!im.next_state.exists());
                });
            });
        });

        describe("if the 'accept_labels' option is set", function() {
            it("should accept label-based answers", function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert(!im.next_state.exists());

                    state.input("Red").then(function() {
                        assert(im.next_state.is('red_state'));
                    });
                });
            });

            it("should be case insensitive with label-based answers",
            function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert(!im.next_state.exists());

                    state.input("reD").then(function() {
                        assert(im.next_state.is('red_state'));
                    });
                });
            });

            it("should accept number-based answers", function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert(!im.next_state.exists());

                    state.input("1").then(function() {
                        assert(im.next_state.is('red_state'));
                    });
                });
            });
        });

        describe(".translate", function() {
            beforeEach(function() {
                return make_state({
                    question: test_utils.$('yes or no?'),
                    choices: [
                        new Choice('yes', test_utils.$('yes')),
                        new Choice('no', test_utils.$('no'))]
                });
            });

            it("should translate the question", function() {
                state.translate(im.user.i18n);
                assert.equal(state.question_text, 'ja of nee?');
            });

            it("should translate the error text", function() {
                return state.invalidate(test_utils.$('no!')).then(function() {
                    state.translate(im.user.i18n);
                    assert.equal(state.error.response, 'nee!');
                });
            });

            it("should translate its choices", function() {
                state.translate(im.user.i18n);

                assert.deepEqual(
                    _.pluck(state.choices, 'label'),
                    ['ja', 'nee']);
            });
        });

        describe("on state:input", function() {
            describe("if the user response is valid", function() {
                it("should set the user's current state to the next state",
                function() {
                    assert(!im.next_state.exists());

                    return state.input('1').then(function() {
                        assert(im.next_state.is('red_state'));
                    });
                });

                it("should save the user's response", function() {
                    var answer = im.user.get_answer('color_state');
                    assert(typeof answer == 'undefined');

                    return state.input('1').then(function() {
                        assert.equal(im.user.get_answer('color_state'), 'red');
                    });
                });
            });

            describe("if the user response is not a valid choice", function() {
                it("should not set the user's state", function() {
                    assert(!im.next_state.exists());

                    return state.input('3').then(function() {
                        assert(!im.next_state.exists());
                    });
                });

                it("should not save the user's answer", function() {
                    var answer = im.user.get_answer('color_state');
                    assert(typeof answer == 'undefined');

                    return state.input('3').then(function() {
                        var answer = im.user.get_answer('color_state');
                        assert(typeof answer == 'undefined');
                    });
                });

                it("should put the state in an error state", function() {
                    assert(!state.error);

                    return state.input('3').then(function() {
                        assert.equal(state.error.response, 'no!');
                    });
                });
            });
        });
    });

    describe("MenuState", function () {
        var im;
        var state;

        function make_state(opts) {
            opts = _.defaults(opts || {}, {
                name: "menu_state",
                question: "Select menu item:",
                choices: [
                    new Choice('state_by_name', 'By Name'),
                    new Choice({
                        name: 'state_by_object',
                        metadata: {foo: "bar"}
                    }, 'By Object')
                ]
             });

            return test_utils
                .make_im()
                .then(function(new_im) {
                    im = new_im;
                    state = new MenuState(opts.name, opts);
                    im.app.states.add(state);
                    return im.switch_state(opts.name).thenResolve(state);
                });
        }

        beforeEach(function () {
            return make_state();
        });

        describe("should support", function () {
            it("state name choice values", function () {
                assert(!im.next_state.exists());

                return state.input("1").then(function() {
                    assert(im.next_state.is('state_by_name'));
                });
            });

            it("state object choice values", function() {
                return state.input("2").then(function() {
                    assert(im.next_state.is('state_by_object'));
                    assert.deepEqual(im.next_state.metadata, {"foo": "bar"});
                });
            });
        });
    });

    describe("LanguageChoice", function () {
        var tester;

        beforeEach(function () {
            var app = new App('states:text');

            app.states.add(new LanguageChoice('states:text', {
                question: "What language would you like to use?",
                choices: [
                    new Choice("sw", "Swahili"),
                    new Choice("en", "English"),
                ]
            }));

            tester = new AppTester(app);
        });

        describe("when entered", function() {
            it("should display the question", function () {
                return tester
                    .start()
                    .check.reply([
                        "What language would you like to use?",
                        "1. Swahili",
                        "2. English",
                    ].join("\n"))
                    .run();
            });
        });

        describe("when a valid choice is made", function () {
            it("should set the user's language", function () {
                return tester
                    .input("1")
                    .check.user.lang("sw")
                    .run();
            });
        });

        describe("when an invalid choice is made", function () {
            it("should not set the user's language", function () {
                return tester
                    .input("3")
                    .check.user.lang(null)
                    .run();
            });
        });
    });

    describe("PaginatedChoiceState", function () {
        var tester;
        var opts;

        beforeEach(function () {
            var app = new App('states:test');
            opts = {};

            app.states.add('states:test', function(name) {
                opts = _.defaults(opts, {
                    name: name,
                    question: "Choose a colour:",
                    choices: [
                        new Choice('red', 'Red red red'),
                        new Choice('blue', 'Blue'),
                        new Choice('green', 'Green')
                    ]
                });

                return new PaginatedChoiceState(name, opts);
            });

            tester = new AppTester(app);
        });

        it("should translate the displayed content", function() {
            opts.options_per_page = 2;

            opts.question = test_utils.$('hello?');

            opts.choices = [
                new Choice('red', test_utils.$('red')),
                new Choice('blue', test_utils.$('blue')),
                new Choice('green', test_utils.$('green'))];

            opts.back = test_utils.$('no');
            opts.more = test_utils.$('yes');

            return Q()
                .then(function() {
                    return tester
                        .setup.config(fixtures.config())
                        .setup.user.lang('af')
                        .start()
                        .check.reply([
                            "hallo?",
                            "1. rooi",
                            "2. blou",
                            "3. ja"
                        ].join('\n'))
                        .run();
                })
                .then(function() {
                    return tester
                        .setup.config(fixtures.config())
                        .setup.user.lang('af')
                        .inputs(null, '3')
                        .check.reply([
                            "hallo?",
                            "1. groen",
                            "2. nee"
                        ].join('\n'))
                        .run();
                });
        });

        it("should shorten choices if needed", function() {
            opts.characters_per_page = 44;

            return tester
                .input()
                .check.reply([
                    "Choose a colour:",
                    "1. Red ...",
                    "2. Blue",
                    "3. Green"
                ].join('\n'))
                .run();
        });

        it("should not shorten choices if not needed", function() {
            opts.characters_per_page = 100;

            return tester
                .input()
                .check.reply([
                    "Choose a colour:",
                    "1. Red red red",
                    "2. Blue",
                    "3. Green"
                ].join('\n'))
                .run();
        });

        it("should return all the choices if the text is already too long",
        function() {
            opts.characters_per_page = 4;

            return tester
                .input()
                .check.reply([
                    "Choose a colour:",
                    "1. Red red red",
                    "2. Blue",
                    "3. Green"
                ].join('\n'))
                .run();
        });

        describe("when the user first enters the state", function() {
            it("should show the user the first page", function() {
                opts.options_per_page = 1;

                return tester
                    .input()
                    .check.reply([
                        "Choose a colour:",
                        "1. Red red red",
                        "2. More"
                    ].join('\n'))
                    .run();
            });
        });

        describe("when the user is on an arbitrary page", function() {
            beforeEach(function() {
                opts.options_per_page = 1;

                tester.setup.user.state({
                    name: 'states:test',
                    metadata: {page_start: 1}
                });
            });

            it("should show the user the page content", function() {
                return tester
                    .input()
                    .check.reply([
                        "Choose a colour:",
                        "1. Blue",
                        "2. More",
                        "3. Back"
                    ].join('\n'))
                    .run();
            });

            it("should take the user back if they ask", function() {
                return tester
                    .input('3')
                    .check.reply([
                        "Choose a colour:",
                        "1. Red red red",
                        "2. More"
                    ].join('\n'))
                    .run();
            });

            it("should take the user forward if they ask", function() {
                return tester
                    .input('2')
                    .check.reply([
                        "Choose a colour:",
                        "1. Green",
                        "2. Back"
                    ].join('\n'))
                    .run();
            });
        });

        describe("to make additional characters available", function() {
            it("shouldn't count chars for .back on 1st pp and .more on last pp", function() {
                opts.options_per_page = null;
                opts.question = 'Select:';  // 8 chars (7 + \n)
                opts.more = 'More';  // 8 chars (4 + 3 + \n)
                opts.back = 'Back';  // 8 chars (4 + 3 + \n)

                // should allow 2 of 8 char choices on mid
                // pages, 3 on first & last page
                opts.characters_per_page = 24 + 16;

                // 8 chars (4 + 3 + \n)
                opts.choices = [
                    new Choice('frut', 'Frut'),
                    new Choice('barz', 'Barz'),
                    new Choice('quux', 'Quux'),
                    new Choice('corg', 'Corg'),
                    new Choice('gnab', 'Gnab'),
                    new Choice('igni', 'Igni'),
                    new Choice('bolg', 'Bolg'),
                    new Choice('ganz', 'Ganz')
                ];

                return Q()
                    .then(function() {
                        return tester
                            .start()
                            .check.reply([
                                "Select:",
                                "1. Frut",
                                "2. Barz",
                                "3. Quux",
                                "4. More"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '4')
                            .check.reply([
                                "Select:",
                                "1. Corg",
                                "2. Gnab",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '4', '3')
                            .check.reply([
                                "Select:",
                                "1. Igni",
                                "2. Bolg",
                                "3. Ganz",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '4', '3', '4')
                            .check.reply([
                                "Select:",
                                "1. Corg",
                                "2. Gnab",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '4', '3', '4', '4')
                            .check.reply([
                                "Select:",
                                "1. Frut",
                                "2. Barz",
                                "3. Quux",
                                "4. More"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    });
            });
        });

        describe("when the options per page is not fixed", function() {
            it("should dynamically split the choices", function() {
                opts.question = 'Hello.';
                opts.options_per_page = null;
                opts.characters_per_page = 21 + [
                    "Hello.",
                    "nn. Back",
                    "nn. More",
                    ""]
                    .join('\n')
                    .length;

                opts.choices = [
                    new Choice('na', 'Na'),
                    new Choice('foo', 'Foo'),
                    new Choice('bar', 'Bar'),
                    new Choice('baz', 'Baz'),
                    new Choice('quux', 'Quux'),
                    new Choice('corge', 'Corge'),
                    new Choice('grault', 'Grault'),
                    new Choice('garply', 'Garply'),
                    new Choice('waldo', 'Waldo'),
                    new Choice('fred', 'Fred'),
                    new Choice('plu', 'Plu'),
                    new Choice('pli', 'Pli'),
                    new Choice('plo', 'Plo')
                ];

                return Q()
                    .then(function() {
                        return tester
                            .start()
                            .check.reply([
                                "Hello.",
                                "1. Na",
                                "2. Foo",
                                "3. Bar",
                                "4. Baz",
                                "5. More"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5')
                            .check.reply([
                                "Hello.",
                                "1. Quux",
                                "2. Corge",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3')
                            .check.reply([
                                "Hello.",
                                "1. Grault",
                                "2. Garply",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3')
                            .check.reply([
                                "Hello.",
                                "1. Waldo",
                                "2. Fred",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3', '3')
                            .check.reply([
                                "Hello.",
                                "1. Plu",
                                "2. Pli",
                                "3. Plo",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3', '3', '4')
                            .check.reply([
                                "Hello.",
                                "1. Waldo",
                                "2. Fred",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3', '3', '4', '4')
                            .check.reply([
                                "Hello.",
                                "1. Grault",
                                "2. Garply",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3', '3', '4', '4', '4')
                            .check.reply([
                                "Hello.",
                                "1. Quux",
                                "2. Corge",
                                "3. More",
                                "4. Back"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '5', '3', '3', '3', '4', '4', '4', '4')
                            .check.reply([
                                "Hello.",
                                "1. Na",
                                "2. Foo",
                                "3. Bar",
                                "4. Baz",
                                "5. More"
                            ].join('\n'))
                            .check.reply.char_limit(opts.characters_per_page)
                            .run();
                    });
            });
        });
    });
});
