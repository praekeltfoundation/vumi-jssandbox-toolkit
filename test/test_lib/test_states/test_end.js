var assert = require("assert");
var vumigo = require("../../../lib");


var DummyIm = vumigo.test_utils.DummyIm;
var EndState = vumigo.states.EndState;


describe("EndState", function () {
    var im;
    var state;

    beforeEach(function () {
        im = new DummyIm();
        state = new EndState({
            name: 'state-1',
            next: 'state-2',
            text: 'hello goodbye'
        });
        state.setup_state(im);
    });

    describe(".input_event", function() {
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
    });

    describe(".new_session_event", function() {
        it("should fake an input event", function(done) {
            assert.strictEqual(im.user.current_state, null);

            state
                .new_session_event()
                .then(function() {
                    assert.equal(im.user.current_state, 'state-2');
                })
                .then(done, done);
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

        it("should translate the state's text", function() {
            assert.equal(state.display(), 'hello goodbye');
            state.translate(i18n);
            assert.equal(state.display(), 'HELLO GOODBYE');
        });
    });
});
