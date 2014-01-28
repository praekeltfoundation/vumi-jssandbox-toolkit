var assert = require("assert");

var vumigo = require("../lib");
var test_utils = vumigo.test_utils;
var App = vumigo.App;
var State = vumigo.states.State;
var StateError = vumigo.states.StateError;


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
            var p = app.once.resolved('setup');
            states.setup().thenResolve(p);
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
                }, StateError);
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

            it("should log a message", function() {
                var msg = [
                    "Unknown state 'spam'.",
                    "Switching to start state 'start'."].join(' ');

                assert(!im.api.in_logs(msg));
                return states.create('spam').then(function(new_state) {
                    assert(im.api.in_logs(msg));
                });
            });

            describe("if the start state does not exist", function() {
                beforeEach(function() {
                    states.remove('start');
                });

                it("should log a message", function() {
                    var msg = [
                        "Unknown start state 'start'.",
                        "Switching to error state."].join(' ');

                    assert(!im.api.in_logs(msg));
                    return states.create('spam').then(function(new_state) {
                        assert(im.api.in_logs(msg));
                    });
                });

                it("should create the error state", function() {
                    return states.create('spam').then(function(new_state) {
                        assert.equal(
                            new_state.name,
                            '__error__');

                        assert.equal(
                            new_state.end_text,
                            'An error occurred. Please try again later.');
                    });
                });
            });
        });

        describe("if the created state is not a State instance", function() {
            beforeEach(function() {
                states.add('bad', function() {
                    return 7;
                });
            });

            it("should log an error", function() {
                var msg = [
                    "Creator for state 'bad' should create a state,",
                    "but instead created something of type 'number'"
                ].join(' ');

                assert(!im.api.in_logs(msg));
                return states.create('bad').then(function(new_state) {
                    assert(im.api.in_logs(msg));
                });
            });

            it("should create the error state", function() {
                return states.create('bad').then(function(new_state) {
                    assert.equal(
                        new_state.name,
                        '__error__');

                    assert.equal(
                        new_state.end_text,
                        'An error occurred. Please try again later.');
                });
            });
        });

        describe("if the state has the wrong name", function() {
            beforeEach(function() {
                states.add('bad', function() {
                    return new State('badder');
                });
            });

            it("should log an error", function() {
                var msg = [
                    "Creator for state 'bad' created a state with",
                    "a different name: 'badder'"
                ].join(' ');

                assert(!im.api.in_logs(msg));
                return states.create('bad').then(function(new_state) {
                    assert(im.api.in_logs(msg));
                });
            });

            it("should create the error state", function() {
                return states.create('bad').then(function(new_state) {
                    assert.equal(
                        new_state.name,
                        '__error__');

                    assert.equal(
                        new_state.end_text,
                        'An error occurred. Please try again later.');
                });
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
            return app.setup(im).thenResolve(p);
        });

        it("should emit a 'setup' event", function() {
            var p = app.once.resolved('setup');
            return app.setup(im).thenResolve(p);
        });
    });
});
