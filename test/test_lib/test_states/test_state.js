var assert = require("assert");

var vumigo = require("../../../lib");
var test_utils = vumigo.test_utils;
var State = vumigo.states.State;
var StateError = vumigo.states.StateError;
var StateSetupEvent = vumigo.states.StateSetupEvent;


describe("State", function () {
    var im;
    var state;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
            state = new State('luke-the-state');
            return state.setup(im);
        }).nodeify(done);
    });

    describe(".setup", function() {
        it("should link the interaction machine to the state", function() {
            var state = new State('luke-the-state'); 
            assert.strictEqual(state.im, null);
            state.setup(im);
            assert.strictEqual(state.im, im);
        });

        it("should emit a 'setup' event", function(done) {
            var state = new State('luke-the-state');

            state.on('setup', function(e) {
                assert.equal(e.instance, state);
                done();
            });

            state.setup(im);
        });
    });

    describe(".save_response", function() {
        it("should store the given user response", function() {
            assert(typeof im.user.get_answer('luke-the-state') == 'undefined');
            state.save_response('foo');
            assert.equal(im.user.get_answer('luke-the-state'), 'foo');
        });
    });

    describe(".emit", function() {
        describe(".input", function() {
            it("should emit a 'state:input' event", function(done) {
                state.on('state:input', function(e) {
                    assert.equal(e.state, state);
                    done();
                });

                state.emit.input();
            });
        });
    });
});
