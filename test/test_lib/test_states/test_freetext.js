var assert = require("assert");
var vumigo = require("../../../lib");


var DummyIm = vumigo.test_utils.DummyIm;
var FreeText = vumigo.states.FreeText;


describe("Freetext", function () {
    var im;
    var state;

    beforeEach(function () {
        im = new DummyIm();

        state = new FreeText('state-1', 'state-2', 'Eggs?', {
            error: 'Sigh',
            check: function(content) {
                return content == 'A lemon';
            }
        });

        state.setup_state(im);
    });

    describe(".input_event", function() {
        describe("if the user response is valid", function() {
            it("should set the user's current state to the next state",
            function(done) {
                assert.strictEqual(im.user.current_state, null);

                state
                    .input_event('A lemon')
                    .then(function() {
                        assert.equal(im.user.current_state, 'state-2');
                    })
                    .then(done, done);
            });

            it("should save the user's response", function(done) {
                assert.strictEqual(im.user.answers['state-1'], undefined);

                state
                    .input_event('A lemon')
                    .then(function() {
                        assert.equal(im.user.answers['state-1'], 'A lemon');
                    })
                    .then(done, done);
            });
        });

        describe("if the user response is invalid", function() {
            it("should not set the user's state", function(done) {
                assert.strictEqual(im.user.current_state, null);

                state
                    .input_event('Not a lemon')
                    .then(function() {
                        assert.equal(im.user.current_state, null);
                    })
                    .then(done, done);
            });

            it("should not save the user's state", function(done) {
                assert.strictEqual(im.user.answers['state-1'], undefined);

                state
                    .input_event('Not a lemon')
                    .then(function() {
                        assert.strictEqual(
                            im.user.answers['state-1'],
                            undefined);
                    })
                    .then(done, done);
            });

            it("should put the state in an error state", function(done) {
                assert(!state.in_error);

                state
                    .input_event('Not a lemon')
                    .then(function() {
                        assert(state.in_error);
                    })
                    .then(done, done);
            });
        });
    });

    describe(".translate", function() {
        var i18n;

        beforeEach(function() {
            i18n = {
                gettext: function(s) {
                    return s.toUpperCase();
                }
            };
        });

        it("should translate the question", function() {
            assert.equal(state.question_text, 'Eggs?');
            state.translate(i18n);
            assert.equal(state.question_text, 'EGGS?');
        });

        it("should translate the error text", function() {
            assert.equal(state.error_text, 'Sigh');
            state.translate(i18n);
            assert.equal(state.error_text, 'SIGH');
        });
    });

    describe(".display", function() {
        describe("if the state is not in an error", function() {
            it("should display the given question text", function() {
                assert.equal(state.display(), 'Eggs?');
            });
        });

        describe("if the state is in an error", function() {
            it("should display the given error text", function() {
                state.in_error = true;
                assert.equal(state.display(), 'Sigh');
            });
        });
    });
});

