var assert = require('assert');
var _ = require('lodash');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;

var ChoiceState = vumigo.states.ChoiceState;
var MenuState = vumigo.states.MenuState;
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
                assert.equal(im.user.state.name, 'color_state');

                return state.input("1").then(function() {
                    assert.equal(im.user.state.name, 'red_state');
                });
            });

            it("should not accept label-based answers", function() {
                return state.input("Red").then(function() {
                    assert.equal(im.user.state.name, 'color_state');
                });
            });
        });

        describe("if the 'accept_labels' option is set", function() {
            it("should accept label-based answers", function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert.equal(im.user.state.name, 'color_state');

                    state.input("Red").then(function() {
                        assert.equal(im.user.state.name, 'red_state');
                    });
                });
            });

            it("should be case insensitive with label-based answers",
            function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert.equal(im.user.state.name, 'color_state');

                    state.input("reD").then(function() {
                        assert.equal(im.user.state.name, 'red_state');
                    });
                });
            });

            it("should accept number-based answers", function() {
                return make_state({accept_labels: true}).then(function(state) {
                    assert.equal(im.user.state.name, 'color_state');

                    state.input("1").then(function() {
                        assert.equal(im.user.state.name, 'red_state');
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
                    assert.equal(im.user.state.name, 'color_state');

                    return state.input('1').then(function() {
                        assert.equal(im.user.state.name, 'red_state');
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
                    assert.equal(im.user.state.name, 'color_state');

                    return state.input('3').then(function() {
                        assert.equal(im.user.state.name, 'color_state');
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
                assert.equal(im.user.state.name, 'menu_state');

                return state.input("1").then(function() {
                    assert.equal(im.user.state.name, 'state_by_name');
                });
            });

            it("state object choice values", function() {
                return state.input("2").then(function() {
                    assert.equal(im.user.state.name, 'state_by_object');
                    assert.deepEqual(im.user.state.metadata, {"foo": "bar"});
                });
            });
        });
    });

    describe("PaginatedChoiceState", function () {
        var im;
        var state;

        function make_state(opts) {
            opts = _.defaults(opts || {}, {
                name: "color_state",
                question: "What is your favourite colour?",
                choices: [
                    new Choice('long', 'Long item name'),
                    new Choice('short', 'Short')
                ],
                next: function(choice) {
                    return {
                        long: 'long_state',
                        short: 'short_state'
                    }[choice.value];
                }
            });

            return test_utils
                .make_im()
                .then(function(new_im) {
                    im = new_im;
                })
                .then(function() {
                    state = new PaginatedChoiceState(opts.name, opts);
                    im.app.states.add(state);
                    return im.switch_state('color_state').thenResolve(state);
                });
        }

        function serialize_choices(choices) {
            return choices.map(function(c) { return c.serialize(); });
        }

        beforeEach(function () {
            return make_state();
        });

        describe("shorten_choices", function() {
            it("should shorten choices if needed", function() {
                return make_state({
                    characters_per_page: 25
                }).then(function(state) {
                    var choices = state.current_choices();
                    choices = state.shorten_choices('Choices:', choices);

                    assert.deepEqual(serialize_choices(choices), [{
                        value: 'long',
                        label: 'L...'
                    }, {
                        value: 'short',
                        label: 'Short'
                    }]);
                });
            });

            it("should not shorten choices if not needed", function() {
                return make_state({
                    characters_per_page: 100
                }).then(function(state) {
                    var choices = state.current_choices();
                    choices = state.shorten_choices('Choices:', choices);

                    assert.deepEqual(serialize_choices(choices), [{
                        value: 'long',
                        label: 'Long item name'
                    }, {
                        value: 'short',
                        label: 'Short'
                    }]);
                });
            });

            it("should return all the choices if the text is already too long",
            function() {
                return make_state({
                    characters_per_page: 4
                }).then(function(state) {
                    var choices = state.current_choices();
                    choices = state.shorten_choices('12345', choices);

                    assert.deepEqual(serialize_choices(choices), [{
                        value: 'long',
                        label: 'Long item name'
                    }, {
                        value: 'short',
                        label: 'Short'
                    }]);
                });
            });
        });
    });
});
