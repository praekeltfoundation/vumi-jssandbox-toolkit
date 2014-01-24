var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var State = vumigo.states.State;
var StateError = vumigo.states.StateError;
var StateSetupEvent = vumigo.states.StateSetupEvent;


describe("State", function () {
    var im;
    var state;

    beforeEach(function() {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;
            state = new State('luke_the_state');
            return state.setup(im);
        });
    });

    describe(".setup", function() {
        it("should link the interaction machine to the state", function() {
            var state = new State('luke_the_state'); 
            assert.strictEqual(state.im, null);
            state.setup(im);
            assert.strictEqual(state.im, im);
        });

        it("should emit a 'setup' event", function() {
            var state = new State('luke_the_state');

            return state
                .once.resolved('setup')
                .then(function(e) {
                    assert.equal(e.instance, state);
                })
                .thenResolve(state.setup(im));
        });
    });

    describe(".save_response", function() {
        it("should store the given user response", function() {
            assert(typeof im.user.get_answer('luke_the_state') == 'undefined');
            state.save_response('foo');
            assert.equal(im.user.get_answer('luke_the_state'), 'foo');
        });
    });

    describe(".emit", function() {
        describe(".input", function() {
            it("should emit a 'state:input' event", function() {
                return state
                    .once.resolved('state:input')
                    .then(function(e) {
                        assert.equal(e.state, state);
                    })
                    .thenResolve(state.emit.input());
            });
        });
    });

    describe(".continue_session", function() {
        it("should be allowed to be a function", function() {
            var state = new State('luke_the_state', {
                continue_session: function() {
                    return false;
                }
            });

            assert(!state.continue_session());
        });

        it("should be allowed to be a non-function", function() {
            var state = new State('luke_the_state', {
                continue_session: false
            });

            assert(!state.continue_session());
        });
    });

    describe(".send_reply", function() {
        it("should be allowed to be a function", function() {
            var state = new State('luke_the_state', {
                send_reply: function() {
                    return false;
                }
            });

            assert(!state.send_reply());
        });

        it("should be allowed to be a non-function", function() {
            var state = new State('luke_the_state', {
                send_reply: false
            });

            assert(!state.send_reply());
        });
    });
});
