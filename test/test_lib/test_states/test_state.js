var assert = require("assert");
var vumigo = require("../../../lib");


var DummyIm = vumigo.test_utils.DummyIm;
var State = vumigo.states.State;
var StateError = vumigo.states.StateError;
var StateSetupEvent = vumigo.states.StateSetupEvent;


describe("StateError", function() {
    it("should be creatable", function() {
        var se = new StateError("msg");
        assert.equal(se.message, "msg");
    });
});

describe("State", function () {
    var im;

    beforeEach(function () {
        im = new DummyIm();
    });

    describe(".setup_state", function() {
        it("should link the interaction machine to the state", function() {
            var state = new State({name: 'luke-the-state'}); 

            assert.strictEqual(state.im, null);
            state.setup_state(im);
            assert.strictEqual(state.im, im);
        });

        it("should emit a state:setup event", function(done) {
            var state = new State({
                name: 'luke-the-state',
                handlers: {
                    setup_state: function() {
                        assert.equal(this, state);
                        done();
                    }
                }
            }); 

            state.on('state:setup', function(e) {
                assert.equal(e.state, state);
                done();
            });

            state.setup_state(im);
        });
    });

    describe(".save_response", function() {
        it("should store the given user response", function() {
            var state = new State({name: 'luke-the-state'}); 
            state.setup_state(im);

            assert.strictEqual(im.user.answers['luke-the-state'], undefined);
            state.save_response('foo');
            assert.strictEqual(im.user.answers['luke-the-state'], 'foo');
        });
    });
});
