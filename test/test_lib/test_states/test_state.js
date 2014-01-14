var assert = require("assert");
var vumigo = require("../../../lib");


var DummyIm = vumigo.test_utils.DummyIm;
var State = vumigo.states.State;


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

        it("should invoke the associated handler", function(done) {
            var state = new State({
                name: 'luke-the-state',
                handlers: {
                    setup_state: function() {
                        assert.equal(this, state);
                        done();
                    }
                }
            }); 

            state.setup_state(im);
        });
    });

    describe(".on_enter", function() {
        it("should invoke the associated handler", function(done) {
            var state = new State({
                name: 'luke-the-state',
                handlers: {
                    on_enter: function() {
                        assert.equal(this, state);
                        done();
                    }
                }
            }); 

            state.on_enter();
        });
    });

    describe(".on_exit", function() {
        it("should invoke the associated handler", function(done) {
            var state = new State({
                name: 'luke-the-state',
                handlers: {
                    on_exit: function() {
                        assert.equal(this, state);
                        done();
                    }
                }
            }); 

            state.on_exit();
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
