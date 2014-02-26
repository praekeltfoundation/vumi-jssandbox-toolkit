var assert = require("assert");
var vumigo = require("../../lib");


var EndState = vumigo.states.EndState;
var test_utils = vumigo.test_utils;
var SessionNewEvent = vumigo.interaction_machine.SessionNewEvent;


describe("EndState", function () {
    var im;
    var state;

    beforeEach(function() {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;

            state = new EndState('state_1', {
                next: 'state_2',
                text: 'goodbye'
            });

            im.app.states.add(state);
            return im.switch_state('state_1');
        });
    });


    describe("on state:input", function() {
        it("should set the user's current state to the next state",
        function() {
            assert.equal(im.user.state.name, 'state_1');

            return state.emit.input('A lemon').then(function() {
                assert.equal(im.user.state.name, 'state_2');
            });
        });
    });

    describe("on im session:new", function() {
        it("should simulate an input event", function() {
            assert.equal(im.user.state.name, 'state_1');

            return im.emit(new SessionNewEvent(im)).then(function() {
                assert.equal(im.user.state.name, 'state_2');
            });
        });
    });

    describe(".translate", function() {
        it("should translate the state's text", function() {
            var state = new EndState('state_1', {
                next: 'state_2',
                text: test_utils.$('goodbye')
            });

            state.translate(im.user.i18n);
            assert.equal(state.display(), 'totsiens');
        });
    });
});
