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
    var im;
    var api;
    var app;
    var tester;
    var checks;

    beforeEach(function() {
        app = new App('initial_state');

        app.states.add(new ChoiceState('initial_state', {
            question: "Tea or coffee?",
            choices: [
                new Choice('tea', 'Tea'),
                new Choice('coffee', 'Coffee')
            ],
            next: function(choice) {
                return {
                    tea: 'tea_state',
                    coffee: 'coffee_state'
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
        im = tester.im;
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
                    checks.assert.fail({
                        actual: 1,
                        op: '<',
                        expected: 2
                    });
                }, AssertionError);
            });

            it("should show not show a diff", function() {
                var e = catch_err(function() {
                    checks.assert.fail({
                        actual: 1,
                        op: '<',
                        expected: 2
                    });
                });
                assert(!e.showDiff);
            });

            it("should show the operator comparison if given", function() {
                var e = catch_err(function() {
                    checks.assert.fail({
                        actual: 1,
                        op: '<',
                        expected: 2
                    });
                });
                assert.equal(e.message, "1 < 2");
            });

            it("should show the message if given", function() {
                var e = catch_err(function() {
                    checks.assert.fail({msg: 'foo'});
                });
                assert.equal(e.message, 'foo');
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

        it("should allow the function to return a promise", function() {
            var called = false;

            return tester.input().check(function() {
                return Q().then(function() {
                    called = true;
                });
            }).run().then(function() {
                assert(called);
            });
        });
    });

    describe(".check.interaction", function() {
        it("should check the current state name", function() {
            return tester
                .input()
                .check.interaction({state: 'tea_state'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected state name");
                    assert.equal(e.expected, 'tea_state');
                    assert.equal(e.actual, 'initial_state');
                });
        });

        it("should check the reply content if given", function() {
            return tester
                .input()
                .check.interaction({
                    state: 'initial_state',
                    reply: 'Spam?'
                })
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected reply content");
                    assert.equal(e.expected, 'Spam?');
                    assert.equal(e.actual, [
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'
                    ].join('\n'));
                });
        });
    });

    describe(".check.user", function() {
        describe(".check.user(obj)", function() {
            it("should check the user's state if given", function() {
                return tester
                    .input()
                    .check.user({state: {name: 'tea_state'}})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected state name");
                        assert.equal(e.expected, 'tea_state');
                        assert.equal(e.actual, 'initial_state');
                    });
            });

            it("should check the user's answers if given", function() {
                return tester
                    .setup.user.state('initial_state')
                    .input('1')
                    .check.user({
                        answers: {initial_state: '2'}
                    })
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected user answers");
                        assert.deepEqual(e.expected, {initial_state: '2'});
                        assert.deepEqual(e.actual, {initial_state: '1'});
                    });
            });

            it("should check arbitrary user properties", function() {
                return tester
                    .check.user({addr: '+27123456788'})
                    .run()
                    .catch(function(e) {
                        assert.equal(
                            e.msg,
                            "Unexpected value for user property 'addr'");
                        assert.deepEqual(e.expected, '+27123456788');
                        assert.deepEqual(e.actual, '+27123456789');
                    });
            });

            it("should check if the user properties are known", function() {
                return tester
                    .check.user({lerp: 'larp'})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unknown user property 'lerp'");
                    });
            });
        });

        describe(".check.user(fn)", function() {
            it("should call the function with the user instance", function() {
                var called = false;

                return tester.input().check.user(function(user) {
                    assert.deepEqual(user.serialize(), user.serialize());
                    called = true;
                }).run().then(function() {
                    assert(called);
                });
            });

            it("should allow the function to return a promise", function() {
                var called = false;

                return tester.input().check.user(function() {
                    return Q().then(function() {
                        called = true;
                    });
                }).run().then(function() {
                    assert(called);
                });
            });
        });
    });

    describe(".check.user.properties", function() {
        it("should check the user's state if given", function() {
            return tester
                .input()
                .check.user.properties({state: {name: 'tea_state'}})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected state name");
                    assert.equal(e.expected, 'tea_state');
                    assert.equal(e.actual, 'initial_state');
                });
        });

        it("should check the user's answers if given", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.properties({
                    answers: {initial_state: '2'}
                })
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected user answers");
                    assert.deepEqual(e.expected, {initial_state: '2'});
                    assert.deepEqual(e.actual, {initial_state: '1'});
                });
        });

        it("should check arbitrary user properties", function() {
            return tester
                .check.user.properties({addr: '+27123456788'})
                .run()
                .catch(function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected value for user property 'addr'");
                    assert.deepEqual(e.expected, '+27123456788');
                    assert.deepEqual(e.actual, '+27123456789');
                });
        });

        it("should check if the user properties are known", function() {
            return tester
                .check.user.properties({lerp: 'larp'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unknown user property 'lerp'");
                });
        });
    });

    describe(".check.user.answers", function() {
        it("should check the user's answers", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.answers({initial_state: '2'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected user answers");
                    assert.deepEqual(e.expected, {initial_state: '2'});
                    assert.deepEqual(e.actual, {initial_state: '1'});
                });
        });
    });

    describe(".check.user.answer", function() {
        it("should check user's answer for the given state", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.answer('initial_state', '2')
                .run()
                .catch(function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected user answer to state 'initial_state'");
                    assert.deepEqual(e.expected, '2');
                    assert.deepEqual(e.actual, '1');
                });
        });
    });

    describe(".check.state", function() {
        describe(".check.state(name, metadata)", function() {
            it("should check the current state's name", function() {
                return tester
                    .input()
                    .check.state('tea_state')
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected state name");
                        assert.equal(e.expected, 'tea_state');
                        assert.equal(e.actual, 'initial_state');
                    });
            });

            it("should check the current state's metadata if given",
            function() {
                return tester
                    .setup.user.state('initial_state', {foo: 'bar'})
                    .check.state('initial_state', {foo: 'baz'})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected state metadata");
                        assert.deepEqual(e.expected, {foo: 'baz'});
                        assert.deepEqual(e.actual, {foo: 'bar'});
                    });
            });
        });

        describe(".check.state(obj)", function() {
            it("should check the current state's name", function() {
                return tester
                    .input()
                    .check.state({name: 'tea_state'})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected state name");
                        assert.equal(e.expected, 'tea_state');
                        assert.equal(e.actual, 'initial_state');
                    });
            });

            it("should check the current state's metadata if given",
            function() {
                return tester
                    .setup.user.state('initial_state', {foo: 'bar'})
                    .check.state({
                        name: 'initial_state',
                        metadata: {foo: 'baz'}
                    })
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected state metadata");
                        assert.deepEqual(e.expected, {foo: 'baz'});
                        assert.deepEqual(e.actual, {foo: 'bar'});
                    });
            });
        });

        describe(".check.state(fn)", function() {
            it("should call the function with the state instance", function() {
                var called = false;

                return tester.input().check.state(function(state) {
                    assert.strictEqual(state, im.state);
                    called = true;
                }).run().then(function() {
                    assert(called);
                });
            });

            it("should allow the function to return a promise", function() {
                var called = false;

                return tester.input().check.state(function() {
                    return Q().then(function() {
                        called = true;
                    });
                }).run().then(function() {
                    assert(called);
                });
            });
        });
    });

    describe(".check.state.metadata", function() {
        it("should check the current state's metadata", function() {
            return tester
                .setup.user.state('initial_state', {foo: 'bar'})
                .check.state.metadata({foo: 'baz'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unexpected state metadata");
                    assert.deepEqual(e.expected, {foo: 'baz'});
                    assert.deepEqual(e.actual, {foo: 'bar'});
                });
        });
    });

    describe(".check.reply", function() {
        describe(".check.reply(content)", function() {
            it("should check the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply('Spam?')
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected reply content");
                        assert.equal(e.expected, 'Spam?');
                        assert.equal(e.actual, [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });
        });

        describe(".check.reply(re)", function() {
            it("should regex match the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply(/Spam?/)
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Reply content 'Tea or coffee?",
                            "1. Tea",
                            "2. Coffee' did not match regular expression " +
                            "/Spam?/"].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });
        });

        describe(".check.reply(obj)", function() {
            it("should check the content of the sent reply", function(){
                return tester
                    .input()
                    .check.reply({
                        content: 'Spam?'
                    })
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected reply content");
                        assert.equal(e.expected, 'Spam?');
                        assert.equal(e.actual, [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n'));
                    });
            });

            it("should check the properties of the sent reply", function() {
                return tester
                    .input()
                    .check.reply({in_reply_to: '2'})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Unexpected value for reply property",
                            "'in_reply_to'"].join(' '));
                        assert.equal(e.expected, 2);
                        assert.equal(e.actual, 1);
                    });
            });

            it("should check if the reply properties are known", function() {
                return tester
                    .check.reply({lerp: 'larp'})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unknown reply property 'lerp'");
                    });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply({
                        content: [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'].join('\n')
                    })
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });
        });

        describe(".check.reply(fn)", function() {
            it("should call the function with the reply data",
            function() {
                var called = false;

                return tester.input().check.reply(function(reply) {
                    assert.deepEqual(reply, api.request_calls[0]);
                    called = true;
                }).run().then(function() {
                    assert(called);
                });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply(function() {})
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should allow the function to return a promise", function() {
                var called = false;

                return tester.input().check.reply(function() {
                    return Q().then(function() {
                        called = true;
                    });
                }).run().then(function() {
                    assert(called);
                });
            });
        });
    });

    describe(".check.reply.properties(obj)", function() {
        it("should check the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply.properties({
                        content: 'Spam?'
                    })
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected reply content");
                        assert.equal(e.expected, 'Spam?');
                        assert.equal(e.actual, [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n'));
                    });
        });

        it("should check the properties of the sent reply", function() {
            return tester
                .input()
                .check.reply.properties({in_reply_to: '2'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, [
                        "Unexpected value for reply property",
                        "'in_reply_to'"].join(' '));
                    assert.equal(e.expected, 2);
                    assert.equal(e.actual, 1);
                });
        });

        it("should check if the reply properties are known", function() {
            return tester
                .check.reply.properties({lerp: 'larp'})
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, "Unknown reply property 'lerp'");
                });
        });

        it("should check that only one reply was sent", function() {
            api.request_calls.push('fake_reply');

            return tester
                .input()
                .check.reply.properties({
                    content: [
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')
                })
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, [
                        "Expecting a single reply from the app",
                        "to the user"].join(' '));
                    assert.equal(e.expected, 1);
                    assert.equal(e.actual, 2);
                });
        });
    });

    describe(".check.reply.content", function() {
        describe(".check.reply.content(content)", function() {
            it("should check the content of the sent reply", function(){
                return tester
                    .input()
                    .check.reply.content('Spam?')
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, "Unexpected reply content");
                        assert.equal(e.expected, 'Spam?');
                        assert.equal(e.actual, [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply.content([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });
        });

        describe(".check.reply.content(re)", function() {
            it("should regex match the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply.content(/Spam?/)
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Reply content 'Tea or coffee?",
                            "1. Tea",
                            "2. Coffee' did not match regular expression " +
                            "/Spam?/"].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.request_calls.push('fake_reply');

                return tester
                    .input()
                    .check.reply.content(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .catch(function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });
        });
    });

    describe(".check.reply.char_limit", function() {
        it("should check the reply char count limit", function() {
            return tester
                .input()
                .check.reply.char_limit(3)
                .run()
                .catch(function(e) {

                    assert.equal(e.msg, [
                        "The reply content's character count was longer than",
                        "expected limit: 31 > 3"].join(' '));
                    assert.equal(e.expected, 3);
                    assert.equal(e.actual, 31);
                });
        });

        it("should check that only one reply was sent", function() {
            api.request_calls.push('fake_reply');

            return tester
                .input()
                .check.reply.char_limit(100)
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, [
                        "Expecting a single reply from the app",
                        "to the user"].join(' '));
                    assert.equal(e.expected, 1);
                    assert.equal(e.actual, 2);
                });
        });
    });

    describe(".check.reply.no_reply", function() {
        it("should check that no reply was sent", function() {
            return tester
                .input()
                .check.no_reply()
                .run()
                .catch(function(e) {
                    assert.equal(
                        e.msg, 
                        "Expecting no replies from the app to the user");
                    assert.equal(e.expected, 0);
                    assert.equal(e.actual, 1);
                });
        });
    });
});
