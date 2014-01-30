var Q = require('q');
var assert = require('assert');
var AssertionError = assert.AssertionError;

var app = require('../../lib/app');
var App = app.App;

var states = require('../../lib/states');
var EndState = states.EndState;
var Choice = states.Choice;
var ChoiceState = states.ChoiceState;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;


describe("AppTester Check Tasks", function() {
    var api;
    var app;
    var tester;
    var checks;

    beforeEach(function() {
        app = new App('start');

        app.states.add(new ChoiceState('initial_state', {
            question: "Tea or coffee?",
            choices: [
                new Choice('tea', 'Tea'),
                new Choice('coffee', 'Coffee')
            ],
            next: function(choice) {
                return {
                    tea: 'cofee_state',
                    coffee: 'tea_state'
                }[choice.value];
            }
        }));


        app.states.add(new EndState('coffee_state', {
            text: 'Cool'
        }));

        app.states.add(new EndState('tea_state', {
            send_reply: false
        }));

        tester = new AppTester(app);
        checks = tester.tasks.get('checks');
        api = tester.api;
    });

    describe("helpers", function() {
        function catch_err(fn) {
            try {
                fn();
            }
            catch (e) {
                return e;
            }
        }

        describe(".assertion", function() {
            it("should allow both a message and diff to be shown", function() {
                var e = catch_err(function() {
                    checks.assertion(function() {
                        assert.equal(0, 1);
                    }, {
                        diff: true,
                        msg: 'foo'
                    });
                });

                assert(e.showDiff);
                assert.equal(e.message, 'foo: expected');
            });

            it("should allow only showing a message and no diff", function() {
                var e = catch_err(function() {
                    checks.assertion(function() {
                        assert.equal(0, 1);
                    }, {
                        diff: false,
                        msg: 'foo'
                    });
                });

                assert(!e.showDiff);
                assert.equal(e.message, 'foo');
            });
        });

        describe(".assert", function() {
            describe("if the value is truthy", function() {
                it("should not throw an error", function() {
                    checks.assert(1);
                });
            });

            describe("if the value is falsy", function() {
                it("should throw an AssertionError", function() {
                    assert.throws(function() {
                        checks.assert(0);
                    }, AssertionError);
                });

                it("should show a diff there is no message", function() {
                    var e = catch_err(function() {
                        checks.assert(0);
                    });
                    assert(e.showDiff);
                });

                it("shouldn't show a diff if there is a message", function() {
                    var e = catch_err(function() {
                        checks.assert(0, {msg: 'foo'});
                    });
                    assert(!e.showDiff);
                });
            });
        });

        describe(".assert.deepEqual", function() {
            describe("if the values are deeply equal", function() {
                it("should not throw an error", function() {
                    checks.assert.deepEqual({foo: 'bar'}, {foo: 'bar'});
                });
            });

            describe("if the values are not deeply equal", function() {
                it("should throw an AssertionError", function() {
                    assert.throws(function() {
                        checks.assert.deepEqual({foo: 'bar'}, {foo: 'baz'});
                    }, AssertionError);
                });

                it("should show a diff", function() {
                    var e = catch_err(function() {
                        checks.assert.deepEqual({foo: 'bar'}, {foo: 'baz'});
                    });
                    assert(e.showDiff);
                });
            });
        });

        describe(".assert.strictEqual", function() {
            describe("if the values are strictly equal", function() {
                it("should not throw an error", function() {
                    checks.assert.strictEqual(1, 1);
                });
            });

            describe("if the values are not strictly equal", function() {
                it("should throw an AssertionError", function() {
                    assert.throws(function() {
                        checks.assert.strictEqual(1, '1');
                    }, AssertionError);
                });

                it("should show a diff", function() {
                    var e = catch_err(function() {
                        checks.assert.strictEqual(1, '1');
                    });
                    assert(e.showDiff);
                });
            });
        });

        describe(".assert.fail", function() {
            it("should throw an AssertionError", function() {
                assert.throws(function() {
                    checks.assert.fail(1, 2, {op: '<'});
                }, AssertionError);
            });

            it("should show not show a diff", function() {
                var e = catch_err(function() {
                    checks.assert.fail(1, 2, {op: '<'});
                });
                assert(!e.showDiff);
            });

            it("should show the operator comparison if given", function() {
                var e = catch_err(function() {
                    checks.assert.fail(1, 2, {op: '<'});
                });
                assert.equal(e.message, "1 < 2");
            });

            it("should show the reason if given", function() {
                var e = catch_err(function() {
                    checks.assert.fail(1, 2, {msg: 'small'});
                });
                assert.equal(e.message, 'small');
            });
        });
    });

    describe(".check", function() {
        it("should call the given function", function() {
            var called = false;

            return tester.input().check(function(im, api, app) {
                assert.strictEqual(im, tester.im);
                assert.strictEqual(api, tester.api);
                assert.strictEqual(app, tester.app);
                called = true;
            }).run().then(function() {
                assert(called);
            });
        });
    });

    describe(".check.interaction", function() {
        it("should check the current state name");
        it("should check the reply content if given");
    });

    describe(".check.user", function() {
        describe(".check.user(obj)", function() {
            it("should check the user's state if given");

            it("should check the user's answers if given");

            it("should check arbitrary user fields");

            it("should throw an error if non-existant fields are given");
        });


        describe(".check.user(fn)", function() {
            it("should call the function with the user instance");
        });
    });

    describe(".check.user.answers", function() {
        it("should check the user's answers");
    });

    describe(".check.user.answer", function() {
        it("should check user's answer for the given state");
    });

    describe(".check.state", function() {
        describe(".check.state(name, metadata)", function() {
            it("should check the current state's name");
            it("should check the current state's metadata if given");
        });

        describe(".check.state(obj)", function() {
            it("should check the current state's name");
            it("should check the current state's metadata if given");
        });

        describe(".check.state(fn)", function() {
            it("should call the function with the state instance");
        });
    });

    describe(".check.state.attrs", function() {
        it("should check the current state's name");
        it("should check the current state's metadata if given");
    });

    describe(".check.state.metadata", function() {
        it("should check the current state's metadata");
    });

    describe(".check.reply", function() {
        describe(".check.reply(content)", function() {
            it("should check the content of the sent reply");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });

        describe(".check.reply(obj)", function() {
            it("should check the properties of the sent reply");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });

        describe(".check.reply(fn)", function() {
            it("should call the function with the state instance");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });
    });

    describe(".check.reply.content", function() {
        it("should check the content of the sent reply");
        it("should throw an error an error if no reply was sent");
        it("should throw an error if multiple replies were sent");
    });

    describe(".check.reply.shorter_than", function() {
        it("should check that the reply char count is below the given number");
        it("should throw an error an error if no reply was sent");
        it("should throw an error if multiple replies were sent");
    });

    describe(".check.reply.no_reply", function() {
        it("should check that no reply was sent");
    });
});
