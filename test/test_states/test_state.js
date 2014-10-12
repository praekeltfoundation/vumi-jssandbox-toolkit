var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var State = vumigo.states.State;
var StateError = vumigo.states.StateError;
var StateInvalidError = vumigo.states.StateInvalidError;
var Event = vumigo.events.Event;


describe("states.state", function() {
    describe("StateInvalidError", function () {
        describe(".message", function() {
            it("should include the state name", function() {
                var state = new State('foo');
                var error = new StateInvalidError(state, ':(');
                assert(error.message.indexOf('foo') > -1);
            });

            it("should include the response", function() {
                var state = new State('foo');
                var error = new StateInvalidError(state, ':(');
                assert(error.message.indexOf(':(') > -1);
            });

            it("should include the input if given", function() {
                var state = new State('foo');
                var error = new StateInvalidError(state, ':(', {input: 'roar'});
                assert(error.message.indexOf('roar') > -1);
            });

            it("should include the reason if given", function() {
                var state = new State('foo');
                var error = new StateInvalidError(state, ':(', {reason: 'meh'});
                assert(error.message.indexOf('meh') > -1);
            });
        });

        describe(".translate", function() {
            it("should translate the error response", function() {
                var i18n = test_utils.i18n_for('af');
                var state = new State('foo');
                var error = new StateInvalidError(state, test_utils.$('no!'));
                error.translate(i18n);
                assert.equal(error.response, 'nee!');
            });
        });
    });

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

            it("should bind the state's events", function() {
                var d = Q.defer();

                var state = new State('states:start', {
                    events: {
                        foo: function() {
                            d.resolve();
                            return d.promise;
                        }
                    }
                });

                return state
                    .emit(new Event('foo'))
                    .then(function() {
                        assert(!d.promise.isFulfilled());
                        return state.setup(im);
                    })
                    .then(function() {
                        return state.emit(new Event('foo'));
                    })
                    .then(function() {
                        assert(d.promise.isFulfilled());
                    });
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

        describe(".input", function() {
            it("should invoke .translate.before_input", function() {
                var d = Q.defer();

                state.translators.before_input = function() {
                    return Q.delay(0).then(function() {
                        d.resolve();
                    });
                };

                return state.input('foo').then(function() {
                    assert(d.promise.isFulfilled());
                });
            });

            it("should emit a 'state:input' event", function() {
                var p = state.once.resolved('state:input');
                return state.input('foo').then(function() {
                    assert(p.isFulfilled());
                });
            });
        });

        describe(".show", function() {
            it("should invoke .translate.before_display", function() {
                var d = Q.defer();

                state.translators.before_display = function() {
                    return Q.delay(0).then(function() {
                        d.resolve();
                    });
                };

                return state.show().then(function() {
                    assert(d.promise.isFulfilled());
                });
            });

            it("should use .display's result", function() {
                state.display = function() {
                    return Q('bar').delay(0);
                };

                return state.show().then(function(result) {
                    assert.equal(result, 'bar');
                });
            });

            it("should emit a 'state:show' event", function() {
                var p = state.once.resolved('state:show');

                return state.show().then(function(content) {
                    return p.then(function(e) {
                        assert.strictEqual(e.state, state);
                        assert.equal(e.content, content);
                    });
                });
            });
        });

        describe(".save_response", function() {
            it("should store the given user response", function() {
                assert.equal(
                    typeof im.user.get_answer('luke_the_state'),
                    'undefined');
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
                assert(!im.next_state.exists());

                return state.set_next_state().then(function() {
                    assert(!im.next_state.exists());
                });
            });

            it("should not change state null is given", function() {
                assert(!im.next_state.exists());

                return state.set_next_state(null).then(function() {
                    assert(!im.next_state.exists());
                });
            });

            describe(".set_next_state(name)", function() {
                it("should set the next state using the given name",
                function() {
                    assert(!im.next_state.exists());

                    return state.set_next_state('spam').then(function() {
                        assert(im.next_state.is('spam'));
                    });
                });
            });

            describe(".set_next_state(opts)", function() {
                it("should set the next state using the given options",
                function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state({
                            name: 'spam',
                            metadata: {foo: 'bar'},
                            creator_opts: {baz: 'qux'}
                        }).then(function() {
                            var state = im.next_state;
                            assert.equal(state.name, 'spam');
                            assert.deepEqual(state.metadata, {foo: 'bar'});
                            assert.deepEqual(state.creator_opts, {baz: 'qux'});
                        });
                });
            });

            describe(".set_next_state(fn)", function() {
                it("should be allowed to return an options object", function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state(function() {
                            return {
                                name: 'spam',
                                metadata: {foo: 'bar'},
                                creator_opts: {baz: 'qux'}
                            };
                        }).then(function() {
                            var state = im.next_state;
                            assert.equal(state.name, 'spam');
                            assert.deepEqual(state.metadata, {foo: 'bar'});
                            assert.deepEqual(state.creator_opts, {baz: 'qux'});
                        });
                });

                it("should be allowed to return a name", function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state(function() {
                            return 'spam';
                        }).then(function() {
                            assert(im.next_state.is('spam'));
                        });
                });

                it("should allow arguments to be given to the function",
                function() {
                    function fn(a, b) {
                        assert.equal(a, 'foo');
                        assert.equal(b, 'bar');
                    }

                    return state.set_next_state(fn, 'foo', 'bar');
                });

                it("should be allowed to return a promise", function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state(function() {
                            return Q('spam');
                        }).then(function() {
                            assert(im.next_state.is('spam'));
                        });
                });

                it("should not change state if null is returned", function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state(function() {
                            return null;
                        }).then(function() {
                            assert(!im.next_state.exists());
                        });
                });

                it("should not change state if undefined is returned",
                function() {
                    assert(!im.next_state.exists());

                    return state
                        .set_next_state(function() {})
                        .then(function() {
                            assert(!im.next_state.exists());
                        });
                });
            });
        });

        describe(".validate", function() {
            describe("if the checker returned a string", function() {
                it("should set the error object to an appropriate error",
                function() {
                    var state = new State('foo', {
                        check: function(input) {
                            return 'no ' + input + ' for you!';
                        }
                    });

                    return state.validate('swords').then(function() {
                        assert(state.error instanceof StateInvalidError);
                        assert.equal(state.error.input, 'swords');
                        assert.equal(state.error.reason, 'Bad user input');
                        assert.equal(
                            state.error.response,
                            'no swords for you!');
                    });
                });

                it("should emit a 'state:invalid' event", function() {
                    var state = new State('foo', {
                        check: function(input) { return 'no!'; }
                    });

                    var p = state.once.resolved('state:invalid');
                    return state.validate('swords').thenResolve(p);
                });
            });

            describe("if the checker returned a StateInvalidError", function() {
                it("should set the state's error object with the error",
                function() {
                    var error;

                    var state = new State('foo', {
                        check: function(input) { return error; }
                    });

                    error = new StateInvalidError(state, 'no!');

                    return state.validate('swords').then(function() {
                        assert.strictEqual(state.error, error);
                    });
                });

                it("should emit a 'state:invalid' event", function() {
                    var state = new State('foo', {
                        check: function(input) {
                            return new StateInvalidError(state, 'no!');
                        }
                    });

                    var p = state.once.resolved('state:invalid');
                    return state.validate('swords').thenResolve(p);
                });
            });

            describe("if the checker returned undefined", function() {
                it("should not invalidate the state", function() {
                    var state = new State('foo', {
                        check: function(input) {},
                    });

                    assert.strictEqual(state.error, null);
                    return state.validate('swords').then(function() {
                        assert.strictEqual(state.error, null);
                    });
                });
            });

            describe("if the checker returned null", function() {
                it("should not invalidate the state", function() {
                    var state = new State('foo', {
                        check: function(input) { return null; }
                    });

                    assert.strictEqual(state.error, null);
                    return state.validate('swords').then(function() {
                        assert.strictEqual(state.error, null);
                    });
                });
            });

            describe("if the checker returned a generic object", function() {
                it("should raise an StateError", function() {
                    var state = new State('foo', {
                        check: function(input) { return {"bad": "value"}; }
                    });

                    assert.strictEqual(state.error, null);
                    var error = null;
                    return state.validate('swords')
                        .catch(function(e) {
                            error = e;
                        })
                        .then(function() {
                            assert.deepEqual(error, new StateError(state, [
                                ".check() may only return null or undefined",
                                " (to indicate success), or string, LazyText",
                                " or StateInvalidError objects (to indicate",
                                " errors)",
                            ].join("")));
                        });
                });
            });
        });

        describe(".invalidate", function() {
            it("should emit a 'state:invalid' event", function() {
                var state = new State('foo');
                var error = new StateInvalidError(state, 'no!');
                var p = state.once.resolved('state:invalid');
                return state.invalidate(error).thenResolve(p);
            });

            describe("if a string was given", function() {
                it("should set the error object to an appropriate error",
                function() {
                    var state = new State('foo');

                    return state.invalidate('no!').then(function() {
                        assert(state.error instanceof StateInvalidError);
                        assert.equal(state.error.response, 'no!');
                    });
                });
            });

            describe("if a LazyText was given", function() {
                it("should set the error object to an appropriate error",
                function() {
                    var state = new State('foo');
                    var text = test_utils.$('no!');

                    return state
                        .invalidate(text)
                        .then(function() {
                            assert(state.error instanceof StateInvalidError);
                            assert.deepEqual(state.error.response, text);
                        });
                });
            });

            describe("if a StateInvalidError was given", function() {
                it("should set the state's error object with the error",
                function() {
                    var state = new State('foo');
                    var error = new StateInvalidError(state, 'no!');

                    return state.invalidate(error).then(function() {
                        assert.strictEqual(state.error, error);
                    });
                });
            });
        });
    });
});
