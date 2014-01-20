var assert = require("assert");
var vumigo = require("../../../lib");


var FreeText = vumigo.states.FreeText;
var test_utils = vumigo.test_utils;


describe("Freetext", function () {
    var im;
    var state;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;

            state = new FreeText('state-1', {
                next: 'state-2',
                question: 'yes?',
                error: 'no!',
                check: function(content) {
                    return content == 'A lemon';
                }
            });

            return state.setup(im);
        }).nodeify(done);
    });

    describe("on state:input", function() {
        describe("if the user response is valid", function() {
            it("should set the user's current state to the next state",
            function(done) {
                assert.notEqual(im.user.state.name, 'state-2');

                state.emit.input('A lemon').then(function() {
                    assert.equal(im.user.state.name, 'state-2');
                }).nodeify(done);
            });

            it("should save the user's response", function(done) {
                assert(typeof im.user.get_answer('state-1') == 'undefined');

                state.emit.input('A lemon').then(function() {
                    assert.equal(im.user.get_answer('state-1'), 'A lemon');
                }).nodeify(done);
            });
        });

        describe("if the user response is invalid", function() {
            it("should not set the user's state", function(done) {
                var old_state_name = im.user.state.name;
                assert.notEqual(old_state_name, 'state-2');

                state.emit.input('Not a lemon').then(function() {
                    assert.equal(im.user.state.name, old_state_name);
                }).nodeify(done);
            });

            it("should not save the user's state", function(done) {
                assert(typeof im.user.get_answer('state-1') == 'undefined');

                state.emit.input('Not a lemon').then(function() {
                    var answer = im.user.get_answer('state-1');
                    assert(typeof answer == 'undefined');
                }).nodeify(done);
            });

            it("should put the state in an error state", function(done) {
                assert(!state.in_error);

                state.emit.input('Not a lemon').then(function() {
                    assert(state.in_error);
                }).nodeify(done);
            });
        });
    });

    describe(".translate", function() {
        it("should translate the question", function() {
            assert.equal(state.question_text, 'yes?');
            state.translate(im.user.i18n);
            assert.equal(state.question_text, 'ja?');
        });

        it("should translate the error text", function() {
            assert.equal(state.error_text, 'no!');
            state.translate(im.user.i18n);
            assert.equal(state.error_text, 'nee!');
        });
    });

    describe(".display", function() {
        describe("if the state is not in an error", function() {
            it("should display the given question text", function() {
                assert.equal(state.display(), 'yes?');
            });
        });

        describe("if the state is in an error", function() {
            it("should display the given error text", function() {
                state.in_error = true;
                assert.equal(state.display(), 'no!');
            });
        });
    });
});
