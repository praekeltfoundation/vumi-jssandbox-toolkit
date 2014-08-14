var Q = require('q');
var _ = require('lodash');
var assert = require('assert');

var vumigo = require('../lib');
var test_utils = vumigo.test_utils;
var State = vumigo.states.State;

var App = vumigo.App;
var AppStateError = vumigo.app.AppStateError;
var AppTester = vumigo.AppTester;
var Event = vumigo.events.Event;
var IMShutdownEvent = vumigo.interaction_machine.IMShutdownEvent;


describe("app", function() {
    describe("AppStates", function () {
        var im;
        var app;
        var states;

        beforeEach(function() {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
                app = im.app;
                states = app.states;
            });
        });

        describe(".setup", function() {
            beforeEach(function() {
                var p = test_utils.make_im({setup: false});
                return p.then(function(new_im) {
                    im = new_im;
                    app = im.app;
                    states = app.states;
                });
            });

            it("should emit a 'setup' event", function() {
                var p = states.once.resolved('setup');
                return states.setup().thenResolve(p);
            });
        });

        describe(".add", function() {
            describe("if a state is given", function() {
                it("should add a creator for the state", function() {
                    var state = new State('spam');
                    states.add(state);
                    assert.strictEqual(states.creators.spam(), state);
                });
            });

            describe("if a state creator is given", function() {
                it("should add the creator", function() {
                    function f() {}
                    states.add('spam', f);
                    assert.strictEqual(states.creators.spam, f);
                });
            });
        });

        describe(".add.creator", function() {
            it("should add the creator", function() {
                function f() {}
                states.add.creator('spam', f);
                assert.strictEqual(states.creators.spam, f);
            });

            describe("if the creator already exists", function() {
                it("should throw an error", function() {
                    function f() {}
                    function g() {}

                    states.add.creator('spam', f);
                    assert.throws(function() {
                        states.add.creator('spam', g);
                    }, AppStateError);
                });
            });
        });

        describe(".add.state", function() {
            it("should add a 'functor' state creator with the given state",
            function() {
                var state = new State('spam');
                states.add(state);
                assert.strictEqual(states.creators.spam(), state);
            });
        });

        describe(".create", function() {
            it("should invoke the creator associated with the request state",
            function() {
                var state = new State('spam');
                states.add(state);
                return states.create('spam').then(function(new_state) {
                    assert.strictEqual(new_state, state);
                });
            });

            it("should allow options to be passed to the creator", function() {
                var created = false;

                states.add('spam', function(name, opts) {
                    created = true;
                    assert.deepEqual(opts, {foo: 'bar'});
                    return new State('spam');
                });

                return states
                    .create('spam', {foo: 'bar'})
                    .then(function() {
                        assert(created);
                    });
            });

            it("should pass creator opts to start states", function() {
                var created = false;

                states.add('spam', function(name, opts) {
                    created = true;
                    assert.deepEqual(opts, {foo: 'bar'});
                    return new State('spam');
                });

                app.start_state_name = 'spam';
                return states
                    .create('spam', {foo: 'bar'})
                    .then(function() {
                        assert(created);
                    });
            });

            describe("if the state does not exist", function() {
                var start_state;

                beforeEach(function() {
                    start_state = new State('start');
                    states.add(start_state);
                });

                it("should create the start state", function() {
                    return states.create('spam').then(function(new_state) {
                        assert.strictEqual(new_state, start_state);
                    });
                });

                it("should emit an error event", function() {
                    var p = app.once.resolved('app:error');
                    return states
                        .create('spam')
                        .thenResolve(p)
                        .then(function(e) {
                            assert(e.error instanceof AppStateError);

                            assert.equal(e.error.message, [
                                "Unknown state 'spam'.",
                                "Switching to start state 'start'."
                            ].join(' '));
                    });
                });

                describe("if the start state does not exist", function() {
                    beforeEach(function() {
                        states.remove('start');
                    });

                    it("should emit an error event", function() {
                        var p = app.once.resolved('app:error').then(function() {
                            // the first app:error is the one that got us to
                            // switch to the start state
                            return app.once.resolved('app:error');
                        });

                        return states
                            .create('spam')
                            .thenResolve(p)
                            .then(function(e) {
                                assert(e.error instanceof AppStateError);

                                assert.equal(e.error.message, [
                                    "Unknown start state 'start'.",
                                    "Switching to error state."
                                ].join(' '));
                        });
                    });

                    it("should create the error state", function() {
                        return states.create('spam').then(function(new_state) {
                            assert.equal(new_state.name, '__error__');
                        });
                    });
                });
            });

            describe("if the state creator throws an error", function() {
                beforeEach(function() {
                    states.add('bad', function() {
                        throw new Error();
                    });
                });

                it("should emit an error event", function() {
                    var p = app.once.resolved('app:error');
                    return states.create('bad').thenResolve(p);
                });
            });

            describe("if the created state is not a State instance",
            function() {
                beforeEach(function() {
                    states.add('bad', function() {
                        return 7;
                    });
                });

                it("should emit an error event", function() {
                    var p = app.once.resolved('app:error');

                    return states
                        .create('bad')
                        .thenResolve(p)
                        .then(function(e) {
                            assert(e.error instanceof AppStateError);

                            assert.equal(e.error.message, [
                                "Creator for state 'bad' should create a state,",
                                "but instead created something of type 'number'"
                            ].join(' '));
                        });
                });

                it("should create the error state", function() {
                    return states.create('bad').then(function(new_state) {
                        assert.equal(new_state.name, '__error__');
                    });
                });
            });
        });

        describe(".creators", function() {
            describe(".__error__", function() {
                it("should display an appropriate message to the user",
                function() {
                    var app = new App('__error__');
                    var tester = new AppTester(app);

                    return tester
                        .start()
                        .check.reply(
                            'An error occurred. Please try again later.')
                        .run();
                });

                it("should put the user in the start state on the next session",
                function() {
                    var app = new App('start');
                    var tester = new AppTester(app);
                    app.states.add(new State('start'));

                    return tester
                        .setup.user.state('__error__')
                        .start()
                        .check.user.state('start')
                        .run();
                });
            });
        });
    });


    describe("App", function () {
        var im;
        var app;

        beforeEach(function() {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
                app = im.app;
            });
        });

        describe("when an 'app:error' event occurs", function() {
            it("should log the error", function() {
                assert(!_.contains(im.api.log.error, ':('));
                return app.emit.error(new Error(':(')).then(function() {
                    assert(_.contains(im.api.log.error, ':('));
                });
            });
        });

        describe(".attach_im", function() {
            it("should attach the im", function() {
                var app = new App();
                app.attach_im(im);
                assert.equal(app.im, im);
            });

            it("should bind the app's event listeners", function() {
                var d = Q.defer();

                var app = new App('states:start', {
                    events: {
                        foo: function() {
                            d.resolve();
                            return d.promise;
                        }
                    }
                });

                return app
                    .emit(new Event('foo'))
                    .then(function() {
                        assert(!d.promise.isFulfilled());
                        app.attach_im(im);
                        return app.emit(new Event('foo'));
                    })
                    .then(function() {
                        assert(d.promise.isFulfilled());
                    });
            });
        });

        describe(".exit", function() {
          it("should be invoked when the im is shutting down", function(done) {
              app.exit = function() { done(); };
              im.emit(new IMShutdownEvent(im));
          });
        });

        describe(".setup", function() {
            beforeEach(function() {
                var p = test_utils.make_im({setup: false});
                return p.then(function(new_im) {
                    im = new_im;
                    app = im.app;
                });
            });

            it("should setup its states set", function() {
                var p = app.states.once.resolved('setup');
                return app.setup().thenResolve(p);
            });

            it("should emit a 'setup' event", function() {
                var p = app.once.resolved('setup');
                return app.setup().thenResolve(p);
            });
        });

        describe(".teardown", function() {
            it("should remove its event listeners", function() {
                app.on('foo', function() {});
                app.on('teardown', function() {});
                assert.equal(app.listeners('foo').length, 1);
                assert.equal(app.listeners('teardown').length, 1);

                return app.teardown().then(function() {
                    assert.equal(app.listeners('foo').length, 0);
                    assert.equal(app.listeners('teardown').length, 0);
                });
            });

            it("should emit a 'teardown' event", function(done) {
                app.on('teardown', function() { done(); });
                app.teardown();
            });
        });
    });
});
