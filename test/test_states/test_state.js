var Q = require('q');
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
            var p = state.once.resolved('setup');
            return state
                .setup(im)
                .thenResolve(p)
                .then(function(e) {
                    assert.equal(e.instance, state);
                });
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
                var p = state.once.resolved('state:input');
                return state
                    .emit.input()
                    .thenResolve(p)
                    .then(function(e) {
                        assert.equal(e.state, state);
                    });
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

    describe(".set_next_state", function() {
        it("should not change state undefined is given", function() {
            assert.equal(im.user.state.name, 'start');
            return state.set_next_state().then(function() {
                assert.equal(im.user.state.name, 'start');
            });
        });

        it("should not change state null is given", function() {
            assert.equal(im.user.state.name, 'start');
            return state.set_next_state(null).then(function() {
                assert.equal(im.user.state.name, 'start');
            });
        });

        describe(".set_next_state(name)", function() {
            it("should set the next state using the given name", function() {
                assert.equal(im.user.state.name, 'start');
                return state.set_next_state('spam').then(function() {
                    assert.equal(im.user.state.name, 'spam');
                });
            });
        });

        describe(".set_next_state(opts)", function() {
            it("should set the next state using the given options",
            function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state({
                        name: 'spam',
                        metadata: {foo: 'bar'},
                        creator_opts: {baz: 'qux'}
                    }).then(function() {
                        var state = im.user.state;
                        assert.equal(state.name, 'spam');
                        assert.deepEqual(state.metadata, {foo: 'bar'});
                        assert.deepEqual(state.creator_opts, {baz: 'qux'});
                    });
            });
        });

        describe(".set_next_state(fn)", function() {
            it("should be allowed to return an options object", function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state(function() {
                        return {
                            name: 'spam',
                            metadata: {foo: 'bar'},
                            creator_opts: {baz: 'qux'}
                        };
                    }).then(function() {
                        var state = im.user.state;
                        assert.equal(state.name, 'spam');
                        assert.deepEqual(state.metadata, {foo: 'bar'});
                        assert.deepEqual(state.creator_opts, {baz: 'qux'});
                    });
            });

            it("should be allowed to return a name", function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state(function() {
                        return 'spam';
                    }).then(function() {
                        assert.equal(im.user.state.name, 'spam');
                    });
            });

            it("should allow arguments to be given the function", function() {
                function fn(a, b) {
                    assert.equal(a, 'foo');
                    assert.equal(b, 'bar');
                }

                return state.set_next_state(fn, 'foo', 'bar');
            });

            it("should be allowed to return a promise", function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state(function() {
                        return Q('spam');
                    }).then(function() {
                        assert.equal(im.user.state.name, 'spam');
                    });
            });

            it("should not change state if null is returned", function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state(function() {
                        return null;
                    }).then(function() {
                        assert.equal(im.user.state.name, 'start');
                    });
            });

            it("should not change state if undefined is returned", function() {
                assert.equal(im.user.state.name, 'start');

                return state
                    .set_next_state(function() {})
                    .then(function() {
                        assert.equal(im.user.state.name, 'start');
                    });
            });
        });
    });
});
