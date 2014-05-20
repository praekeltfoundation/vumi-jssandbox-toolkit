var Q = require('q');
var assert = require('assert');
var AssertionError = assert.AssertionError;

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var App = vumigo.App;
var AppTester = vumigo.tester.AppTester;

var EndState = vumigo.states.EndState;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;


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
        describe(".assertion", function() {
            it("should allow both a message and diff to be shown", function() {
                var e = test_utils.catch_err(function() {
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
                var e = test_utils.catch_err(function() {
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
                    var e = test_utils.catch_err(function() {
                        checks.assert(0);
                    });
                    assert(e.showDiff);
                });

                it("shouldn't show a diff if there is a message", function() {
                    var e = test_utils.catch_err(function() {
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
                    var e = test_utils.catch_err(function() {
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
                    var e = test_utils.catch_err(function() {
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
                var e = test_utils.catch_err(function() {
                    checks.assert.fail({
                        actual: 1,
                        op: '<',
                        expected: 2
                    });
                });
                assert(!e.showDiff);
            });

            it("should show the operator comparison if given", function() {
                var e = test_utils.catch_err(function() {
                    checks.assert.fail({
                        actual: 1,
                        op: '<',
                        expected: 2
                    });
                });
                assert.equal(e.message, "1 < 2");
            });

            it("should show the message if given", function() {
                var e = test_utils.catch_err(function() {
                    checks.assert.fail({msg: 'foo'});
                });
                assert.equal(e.message, 'foo');
            });
        });
    });

    describe(".check", function() {
        it("should call the given function", function() {
            var called = false;

            return tester.input().check(function(api, im, app) {
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
        it("should check the user's state name", function() {
            return tester
                .input()
                .check.interaction({state: 'tea_state'})
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user state name");
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
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected reply content");
                    assert.equal(e.expected, 'Spam?');
                    assert.equal(e.actual, [
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'
                    ].join('\n'));
                });
        });

        it("should check the char limit if given", function() {
            return tester
                .input()
                .check.interaction({
                    state: 'initial_state',
                    char_limit: 2
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, [
                        "The reply content's character count was longer than",
                        "the expected limit: 31 > 2"].join(' '));
                    assert.equal(e.expected, 2);
                    assert.equal(e.actual, 31);
                });
        });
    });

    describe(".check.user", function() {
        describe(".check.user(obj)", function() {
            it("should check that the user deep equals obj", function() {
                var user = tester.im.user;

                return tester
                    .input()
                    .check.user({lerp: 'larp'})
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, "Unexpected user properties");
                        assert.deepEqual(e.actual, user.serialize());
                        assert.deepEqual(e.expected, {lerp: 'larp'});
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
                .check.user.properties({
                    state: {
                        name: 'tea_state',
                        metadata: {},
                        creator_opts: {}
                    }
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user state");
                    assert.deepEqual(e.actual, {
                        name: 'initial_state',
                        metadata: {},
                        creator_opts: {}
                    });
                    assert.deepEqual(e.expected, {
                        name: 'tea_state',
                        metadata: {},
                        creator_opts: {}
                    });
                });
        });

        it("should check the user's answers if given", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.properties({
                    answers: {initial_state: 'coffee'}
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user answers");
                    assert.deepEqual(e.expected, {initial_state: 'coffee'});
                    assert.deepEqual(e.actual, {initial_state: 'tea'});
                });
        });

        it("should check the user's metadata if given", function() {
            return tester
                .setup.user.metadata({foo: 'bar'})
                .input()
                .check.user.properties({
                    metadata: {foo: 'baz'}
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user metadata");
                    assert.deepEqual(e.actual, {foo: 'bar'});
                    assert.deepEqual(e.expected, {foo: 'baz'});
                });
        });

        it("should check arbitrary user properties", function() {
            return tester
                .setup.user({
                    lang: 'en',
                    addr: '+27123456787'
                })
                .check.user.properties({
                    lang: 'jp',
                    addr: '+27123456788'
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected values for user properties");
                    assert.deepEqual(e.actual, {
                        lang: 'en',
                        addr: '+27123456787'
                    });
                    assert.deepEqual(e.expected, {
                        lang: 'jp',
                        addr: '+27123456788'
                    });
                });
        });
    });

    describe(".check.user.answers", function() {
        it("should check the user's answers", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.answers({initial_state: 'coffee'})
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user answers");
                    assert.deepEqual(e.expected, {initial_state: 'coffee'});
                    assert.deepEqual(e.actual, {initial_state: 'tea'});
                });
        });
    });

    describe(".check.user.answer", function() {
        it("should check user's answer for the given state", function() {
            return tester
                .setup.user.state('initial_state')
                .input('1')
                .check.user.answer('initial_state', 'coffee')
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected user answer to state 'initial_state'");
                    assert.deepEqual(e.expected, 'coffee');
                    assert.deepEqual(e.actual, 'tea');
                });
        });
    });

    describe(".check.user.lang", function() {
        it("should succeed if the language matches", function() {
            return tester
                .setup.user({lang: 'af'})
                .check.user.lang('af')
                .run();
        });

        it("should fail if the language does not match", function() {
            return tester
                .setup.user({lang: 'en'})
                .check.user.lang('jp')
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected user language");
                    assert.deepEqual(e.actual, 'en');
                    assert.deepEqual(e.expected, 'jp');
                });
        });

        it("should succeed if the language matches null", function() {
            return tester
                .check.user.lang(null)
                .run();
        });

        it("should fail if the language does not match null", function() {
            return tester
                .setup.user({lang: 'en'})
                .check.user.lang(null)
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg,
                        "Unexpected user language");
                    assert.deepEqual(e.actual, 'en');
                    assert.deepEqual(e.expected, null);
                });
        });
    });

    describe(".check.user.metadata", function() {
        it("should check the user's metadata", function() {
            return tester
                .setup.user.metadata({foo: 'bar'})
                .check.user.metadata({foo: 'baz'})
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user metadata");
                    assert.deepEqual(e.expected, {foo: 'baz'});
                    assert.deepEqual(e.actual, {foo: 'bar'});
                });
        });
    });

    describe(".check.user.state", function() {
        describe(".check.user.state(name)", function() {
            it("should check the user's state's name", function() {
                return tester
                    .input()
                    .check.user.state('tea_state')
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, "Unexpected user state name");
                        assert.equal(e.expected, 'tea_state');
                        assert.equal(e.actual, 'initial_state');
                    });
            });
        });

        describe(".check.user.state(obj)", function() {
            it("should check that the state deep equals obj", function() {
                return tester
                    .setup.user.state({
                        name: 'initial_state',
                        metadata: {foo: 'bar'},
                        creator_opts: {baz: 'qux'}
                    })
                    .check.user.state({
                        name: 'initial_state',
                        metadata: {foo: 'baz'},
                        creator_opts: {qux: 'bar'}
                    })
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, "Unexpected user state");

                        assert.deepEqual(e.actual, {
                            name: 'initial_state',
                            metadata: {foo: 'bar'},
                            creator_opts: {baz: 'qux'}
                        });

                        assert.deepEqual(e.expected, {
                            name: 'initial_state',
                            metadata: {foo: 'baz'},
                            creator_opts: {qux: 'bar'}
                        });
                    });
            });
        });

        describe(".check.user.state(fn)", function() {
            it("should call the function with the user's state", function() {
                var called = false;

                return tester
                    .setup.user.state({
                        name: 'initial_state',
                        metadata: {foo: 'bar'},
                        creator_opts: {baz: 'qux'}
                    })
                    .check.user.state(function(state) {
                        assert.equal(state.name, 'initial_state');
                        assert.deepEqual(state.metadata, {foo: 'bar'});
                        assert.deepEqual(state.creator_opts, {baz: 'qux'});
                        called = true;
                    })
                    .run()
                    .then(function() {
                        assert(called);
                    });
            });

            it("should allow the function to return a promise", function() {
                var called = false;

                return tester.input().check.user.state(function() {
                    return Q().then(function() {
                        called = true;
                    });
                }).run().then(function() {
                    assert(called);
                });
            });
        });
    });

    describe(".check.user.state.metadata", function() {
        it("should check the user's state's metadata", function() {
            return tester
                .setup.user.state('initial_state', {metadata: {foo: 'bar'}})
                .check.user.state.metadata({foo: 'baz'})
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, "Unexpected user state metadata");
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
                    .then(test_utils.fail, function(e) {
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
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
                    });
            });
        });

        describe(".check.reply(re)", function() {
            it("should regex match the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply(/Spam?/)
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Reply content 'Tea or coffee?",
                            "1. Tea",
                            "2. Coffee' did not match regular expression " +
                            "/Spam?/"].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
                    });
            });
        });

        describe(".check.reply(obj)", function() {
            it("should check the sent reply deep equals obj", function(){
                return tester
                    .input()
                    .check.reply({
                        content: 'Spam?'
                    })
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, "Unexpected reply");

                        assert.deepEqual(e.actual, {
                            in_reply_to: '1',
                            continue_session: true,
                            content: [
                                'Tea or coffee?',
                                '1. Tea',
                                '2. Coffee'
                            ].join('\n')
                        });

                        assert.deepEqual(e.expected, {content: 'Spam?'});
                    });
            });

            it("should check that only one reply was sent", function() {
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply({
                        content: [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'].join('\n')
                    })
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply({
                        content: [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'].join('\n')
                    })
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
                    });
            });
        });

        describe(".check.reply(fn)", function() {
            it("should call the function with the reply data",
            function() {
                var called = false;

                return tester.input().check.reply(function(reply) {
                    assert.deepEqual(reply, api.outbound.store[0]);
                    called = true;
                }).run().then(function() {
                    assert(called);
                });
            });

            it("should check that only one reply was sent", function() {
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply(function() {})
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply(function() {})
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
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

    describe(".check.reply.ends_session", function() {
        it("should succeed if the reply ended the session", function() {
            return tester
                .setup.user.state('initial_state')
                .input('2')
                .check.reply.ends_session()
                .run();
        });

        it("should fail if the reply did not end the session", function() {
            return tester
                .input()
                .check.reply.ends_session()
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg,
                        "Reply did not end the session");
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
                    .then(test_utils.fail, function(e) {
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
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, [
                        "Unexpected values for reply properties"].join(' '));
                    assert.deepEqual(e.actual, {in_reply_to: '1'});
                    assert.deepEqual(e.expected, {in_reply_to: '2'});
                });
        });

        it("should check that only one reply was sent", function() {
            api.outbound.store.push({
                content: 'fake reply',
                in_reply_to: '1'
            });

            return tester
                .input()
                .check.reply.properties({
                    content: [
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, [
                        "Expecting a single reply from the app",
                        "to the user"].join(' '));
                    assert.equal(e.expected, 1);
                    assert.equal(e.actual, 2);
                });
        });

        it("should check the reply char limit", function() {
            return tester
                .setup.char_limit(2)
                .input()
                .check.reply.properties({
                    content: [
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')
                })
                .run()
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, [
                        "The reply content's character count was longer",
                        "than the expected limit: 31 > 2"].join(' '));
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
                    .then(test_utils.fail, function(e) {
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
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply.content([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply.content([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n'))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
                    });
            });
        });

        describe(".check.reply.content(re)", function() {
            it("should regex match the content of the sent reply", function() {
                return tester
                    .input()
                    .check.reply.content(/Spam?/)
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Reply content 'Tea or coffee?",
                            "1. Tea",
                            "2. Coffee' did not match regular expression " +
                            "/Spam?/"].join('\n'));
                    });
            });

            it("should check that only one reply was sent", function() {
                api.outbound.store.push({
                    content: 'fake reply',
                    in_reply_to: '1'
                });

                return tester
                    .input()
                    .check.reply.content(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "Expecting a single reply from the app",
                            "to the user"].join(' '));
                        assert.equal(e.expected, 1);
                        assert.equal(e.actual, 2);
                    });
            });

            it("should check the reply char limit", function() {
                return tester
                    .setup.char_limit(2)
                    .input()
                    .check.reply.content(new RegExp([
                        'Tea or coffee?',
                        '1. Tea',
                        '2. Coffee'].join('\n')))
                    .run()
                    .then(test_utils.fail, function(e) {
                        assert.equal(e.msg, [
                            "The reply content's character count was longer",
                            "than the expected limit: 31 > 2"].join(' '));
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
                .then(test_utils.fail, function(e) {
                    assert.equal(e.msg, [
                        "The reply content's character count was longer than",
                        "the expected limit: 31 > 3"].join(' '));
                    assert.equal(e.expected, 3);
                    assert.equal(e.actual, 31);
                });
        });

        it("should check that only one reply was sent", function() {
            api.outbound.store.push({
                content: 'fake reply',
                in_reply_to: '1'
            });

            return tester
                .input()
                .check.reply.char_limit(100)
                .run()
                .then(test_utils.fail, function(e) {
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
                .then(test_utils.fail, function(e) {
                    assert.equal(
                        e.msg, 
                        "Expecting no replies from the app to the user");

                    assert.deepEqual(e.expected, []);

                    assert.deepEqual(e.actual, [{
                        in_reply_to: '1',
                        continue_session: true,
                        content: [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n')
                    }]);
                });
        });
    });
});
