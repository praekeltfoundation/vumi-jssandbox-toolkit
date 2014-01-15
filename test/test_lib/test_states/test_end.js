var assert = require("assert");
var vumigo = require("../../../lib");


var EndState = vumigo.states.EndState;
var DummyIm = vumigo.test_utils.DummyIm;
var DummyI8n = vumigo.test_utils.DummyI8n;
var SessionNewEvent = vumigo.state_machine.SessionNewEvent;


describe("EndState", function () {
    var im;
    var state;
    var simulate;

    beforeEach(function () {
        im = new DummyIm();

        state = new EndState({
            name: 'state-1',
            next: 'state-2',
            text: 'hello goodbye'
        });
        state.setup_state(im);
    });

    describe("on state:input", function() {
        it("should set the user's current state to the next state",
        function(done) {
            assert.strictEqual(im.user.current_state, null);

            state.emit.input('A lemon').then(function() {
                assert.equal(im.user.current_state, 'state-2');
            }).nodeify(done);
        });
    });

    describe(".on im session:new", function() {
        it("should simulate an input event", function(done) {
            assert.strictEqual(im.user.current_state, null);

            im.emit(new SessionNewEvent(im)).then(function() {
                assert.equal(im.user.current_state, 'state-2');
            }).nodeify(done);
        });
    });

    describe(".translate", function() {
        it("should translate the state's text", function() {
            assert.equal(state.display(), 'hello goodbye');
            state.translate(new DummyI8n());
            assert.equal(state.display(), 'HELLO GOODBYE');
        });
    });
});
