var assert = require("assert");
var vumigo = require("../../../lib");


var EndState = vumigo.states.EndState;
var test_utils = vumigo.test_utils;
var SessionNewEvent = vumigo.interaction_machine.SessionNewEvent;


describe("EndState", function () {
    var im;
    var state;

    beforeEach(function (done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;

            state = new EndState('state-1', {
                next: 'state-2',
                text: 'goodbye'
            });

            return state.setup(im);
        }).nodeify(done);
    });

    describe("on state:input", function() {
        it("should set the user's current state to the next state",
        function(done) {
            assert.notEqual(im.user.state.name, 'state-2');

            state.emit.input('A lemon').then(function() {
                assert.equal(im.user.state.name, 'state-2');
            }).nodeify(done);
        });
    });

    describe("on im session:new", function() {
        it("should simulate an input event", function(done) {
            assert.notEqual(im.user.state.name, 'state-2');

            im.emit(new SessionNewEvent(im)).then(function() {
                assert.equal(im.user.state.name, 'state-2');
            }).nodeify(done);
        });
    });

    describe(".translate", function() {
        it("should translate the state's text", function() {
            assert.equal(state.display(), 'goodbye');
            state.translate(im.user.i18n);
            assert.equal(state.display(), 'totsiens');
        });
    });
});
