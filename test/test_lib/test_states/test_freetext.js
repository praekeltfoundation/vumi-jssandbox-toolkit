var assert = require("assert");
var vumigo = require("../../../lib");


var FreeText = vumigo.states.FreeText;
var DummyIm = vumigo.test_utils.DummyIm;
var DummyI8n = vumigo.test_utils.DummyI8n;


describe("Freetext", function () {
    var im;
    var state;
    var simulate;

    beforeEach(function () {
        im = new DummyIm();

        state = new FreeText({
            name: 'state-1',
            next: 'state-2',
            question: 'Eggs?',
            error: 'Sigh',
            check: function(content) {
                return content == 'A lemon';
            }
        });
        state.setup_state(im);
    });

    describe("on state:input", function() {
        describe("if the user response is valid", function() {
            it("should set the user's current state to the next state",
            function(done) {
                assert.strictEqual(im.user.current_state, null);

                state.emit.input('A lemon').then(function() {
                    assert.equal(im.user.current_state, 'state-2');
                }).nodeify(done);
            });

            it("should save the user's response", function(done) {
                assert.strictEqual(im.user.answers['state-1'], undefined);

                state.emit.input('A lemon').then(function() {
                    assert.equal(im.user.answers['state-1'], 'A lemon');
                }).nodeify(done);
            });
        });

        describe("if the user response is invalid", function() {
            it("should not set the user's state", function(done) {
                assert.strictEqual(im.user.current_state, null);

                state.emit.input('Not a lemon').then(function() {
                    assert.equal(im.user.current_state, null);
                }).nodeify(done);
            });

            it("should not save the user's state", function(done) {
                assert.strictEqual(im.user.answers['state-1'], undefined);

                state.emit.input('Not a lemon').then(function() {
                    assert.strictEqual(
                        im.user.answers['state-1'],
                        undefined);
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
            assert.equal(state.question_text, 'Eggs?');
            state.translate(new DummyI8n());
            assert.equal(state.question_text, 'EGGS?');
        });

        it("should translate the error text", function() {
            assert.equal(state.error_text, 'Sigh');
            state.translate(new DummyI8n());
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
