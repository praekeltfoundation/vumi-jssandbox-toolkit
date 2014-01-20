var assert = require("assert");

var vumigo = require("../../../lib");
var test_utils = vumigo.test_utils;

var ChoiceState = vumigo.states.ChoiceState;
var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
var Choice = vumigo.states.Choice;
var success = vumigo.promise.success;
var utils = vumigo.utils;


describe("ChoiceState", function () {
    var im;
    var state;

    function make_state(opts) {
        opts = utils.set_defaults(opts || {}, {
            name: "color_state",
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
                im.state_creator.add_state(state);
                return im.switch_state(opts.name).thenResolve(state);
            });
    }

    beforeEach(function (done) {
        make_state().nodeify(done);
    });

    describe("if the 'accept_labels' option is not set", function() {
        it("should accept a number-based answers", function (done) {
            assert.notEqual(im.user.state.name, 'red_state');

            state.emit.input("1").then(function() {
                assert.equal(im.user.state.name, 'red_state');
            }).nodeify(done);
        });

        it("should not accept label-based answers", function(done) {
            state.emit.input("Red").then(function() {
                assert.equal(im.user.state.name, 'color_state');
            }).nodeify(done);
        });
    });

    describe("if the 'accept_labels' option is set", function() {
        it("should accept label-based answers", function(done) {
            make_state({accept_labels: true}).then(function(state) {
                assert.notEqual(im.user.state.name, 'red_state');

                return state.emit.input("Red").then(function() {
                    assert.equal(im.user.state.name, 'red_state');
                });
            }).nodeify(done);
        });

        it("should be case insensitive with label-based answers",
        function(done) {
            make_state({accept_labels: true}).then(function(state) {
                assert.notEqual(im.user.state.name, 'red_state');

                return state.emit.input("reD").then(function() {
                    assert.equal(im.user.state.name, 'red_state');
                });
            }).nodeify(done);
        });

        it("should accept number-based answers", function(done) {
            make_state({accept_labels: true}).then(function(state) {
                assert.notEqual(im.user.state.name, 'red_state');

                return state.emit.input("1").then(function() {
                    assert.equal(im.user.state.name, 'red_state');
                });
            }).nodeify(done);
        });
    });
});

describe("PaginatedChoiceState", function () {
    var im;
    var state;

    function make_state(opts) {
        opts = utils.set_defaults(opts || {}, {
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
                im.state_creator.add_state(state);
                return im.switch_state('color_state').thenResolve(state);
            });
    }

    function serialize_choices(choices) {
        return choices.map(function(c) { return c.serialize(); });
    }

    beforeEach(function (done) {
        make_state().nodeify(done);
    });

    describe("shorten_choices", function() {
        it("should shorten choices if needed", function(done) {
            make_state({characters_per_page: 25}).then(function(state) {
                var choices = state.current_choices();
                choices = state.shorten_choices('Choices:', choices);

                assert.deepEqual(serialize_choices(choices), [{
                    value: 'long',
                    label: 'L...'
                }, {
                    value: 'short',
                    label: 'Short'
                }]);
            }).nodeify(done);
        });

        it("should not shorten choices if not needed", function(done) {
            make_state({characters_per_page: 100}).then(function(state) {
                var choices = state.current_choices();
                choices = state.shorten_choices('Choices:', choices);

                assert.deepEqual(serialize_choices(choices), [{
                    value: 'long',
                    label: 'Long item name'
                }, {
                    value: 'short',
                    label: 'Short'
                }]);
            }).nodeify(done);
        });

        it("should return all the choices if the text is already too long",
        function(done) {
            make_state({characters_per_page: 4}).then(function(state) {
                var choices = state.current_choices();
                choices = state.shorten_choices('12345', choices);

                assert.deepEqual(serialize_choices(choices), [{
                    value: 'long',
                    label: 'Long item name'
                }, {
                    value: 'short',
                    label: 'Short'
                }]);
            }).nodeify(done);
        });
    });
});
