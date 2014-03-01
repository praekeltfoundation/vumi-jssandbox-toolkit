var Q = require('q');
var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var states = require('../../lib/states');
var EndState = states.EndState;
var Choice = states.Choice;
var ChoiceState = states.ChoiceState;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;
var TaskMethodError = tester.TaskMethodError;


describe("AppTester Setup Tasks", function() {
    var api;
    var app;
    var tester;

    beforeEach(function() {
        app = new App('initial_state');
        tester = new AppTester(app);
        api = tester.api;

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
    });

    describe("if interaction tasks have already been scheduled", function() {
        beforeEach(function() {
            var interactions = tester.tasks.get('interactions');
            interactions.methods.interact = function() {};
            tester.tasks.attach();
        });

        it("should throw an error when scheduling setup tasks", function() {
            tester.interact();

            assert.throws(function() {
                tester.setup();
            }, TaskMethodError);
        });
    });

    describe("if checking tasks have already been scheduled", function() {
        beforeEach(function() {
            var checks = tester.tasks.get('checks');
            checks.methods.check = function() {};
            tester.tasks.attach();
        });

        it("should throw an error when scheduling setup tasks", function() {
            tester.check();

            assert.throws(function() {
                tester.setup();
            }, TaskMethodError);
        });
    });

    describe(".setup", function() {
        it("should call the given function with the api", function() {
            return tester
                .setup(function(api) {
                    api.config.store.foo = 'bar';
                })
                .run()
                .then(function() {
                    assert.equal(api.config.store.foo, 'bar');
                });
        });
    });

    describe(".setup.user", function() {
        describe(".setup.user(obj)", function() {
            it("should update the user data with the given properties",
            function() {
                return tester
                    .setup.user({addr: '+81'})
                    .setup.user({lang: 'jp'})
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+81'];
                        assert.equal(user.lang, 'jp');
                        assert.equal(user.addr, '+81');
                    });
            });
        });

        describe(".setup.user(fn)", function() {
            it("should set the user data with the function's result",
            function() {
                return tester
                    .setup.user(function(user) {
                        user.addr = '+81';
                        user.lang = 'jp';
                        return user;
                    })
                    .setup.user(function(user) {
                        delete user.lang;
                        return user;
                    })
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+81'];
                        assert.notEqual(user.lang, 'jp');
                        assert.equal(user.addr, '+81');
                    });
            });

            it("should allow the function to return its result via a promise",
            function() {
                return tester.setup.user(function() {
                    return Q({
                        addr: '+81',
                        lang: 'jp'
                    });
                }).run().then(function() {
                    var user = api.kv_store['users.test_app.+81'];
                    assert.equal(user.lang, 'jp');
                    assert.equal(user.addr, '+81');
                });
            });
        });
    });

    describe(".setup.user.lang", function() {
        it("should set the user's language", function() {
            return tester.setup.user.lang('af').run().then(function() {
                var user = api.kv_store['users.test_app.+27123456789'];
                assert.equal(user.lang, 'af');
            });
        });
    });

    describe(".setup.user.addr", function() {
        it("should set the user's address", function() {
            return tester.setup.user.addr('+2798765').run().then(function() {
                var user = api.kv_store['users.test_app.+2798765'];
                assert.equal(user.addr, '+2798765');
            });
        });
    });

    describe(".setup.user.state", function() {
        describe(".setup.user.state(obj)", function() {
            it("should set the user's state's name", function() {
                return tester
                    .setup.user.state({name: 'initial_state'})
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+27123456789'];
                        assert.equal(user.state.name, 'initial_state');
                    });
            });

            it("should set the user's state metadata", function() {
                return tester
                    .setup.user.state({
                        name: 'initial_state',
                        metadata: {foo: 'bar'}
                    })
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+27123456789'];
                        assert.deepEqual(user.state.metadata, {foo: 'bar'});
                    });
            });
        });

        describe(".setup.user.state(name, opts)", function() {
            it("should set the user's state's name", function() {
                return tester
                    .setup.user.state('initial_state')
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+27123456789'];
                        assert.equal(user.state.name, 'initial_state');
                    });
            });

            it("should set the user's state metadata", function() {
                return tester
                    .setup.user.state('initial_state', {
                        metadata: {foo: 'bar'}
                    })
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+27123456789'];
                        assert.deepEqual(user.state.metadata, {foo: 'bar'});
                    });
            });

            it("should set the user's state creator opts", function() {
                return tester
                    .setup.user.state('initial_state', {
                        creator_opts: {foo: 'bar'}
                    })
                    .run()
                    .then(function() {
                        var user = api.kv_store['users.test_app.+27123456789'];
                        assert.deepEqual(user.state.creator_opts, {foo: 'bar'});
                    });
            });
        });
    });

    describe(".setup.user.state.metadata", function() {
        it("should update the user's state metadata", function() {
            return tester
                .setup.user.state('initial_state')
                .setup.user.state.metadata({foo: 'bar'})
                .setup.user.state.metadata({baz: 'qux'})
                .run()
                .then(function() {
                    var user = api.kv_store['users.test_app.+27123456789'];
                    assert.deepEqual(user.state.metadata, {
                        foo: 'bar',
                        baz: 'qux'
                    });
                });
        });
    });

    describe(".setup.user.answers", function() {
        it("should set the user's answers", function() {
            return tester.setup.user.answers({
                initial_state: 'coffee',
                coffee_state: 'yes'
            }).run().then(function() {
                var user = api.kv_store['users.test_app.+27123456789'];
                assert.equal(user.answers.initial_state, 'coffee');
                assert.equal(user.answers.coffee_state, 'yes');
            });
        });
    });

    describe(".setup.user.answer", function() {
        it("should set the user's answer to the given state", function() {
            return tester
                .setup.user.answer('initial_state', 'coffee')
                .run()
                .then(function() {
                    var user = api.kv_store['users.test_app.+27123456789'];
                    assert.deepEqual(user.answers.initial_state, 'coffee');
                });
        });
    });

    describe(".setup.user.metadata", function() {
        it("should update the user's metadata", function() {
            return tester
                .setup.user.metadata({foo: 'bar'})
                .setup.user.metadata({baz: 'qux'})
                .run()
                .then(function() {
                    var user = api.kv_store['users.test_app.+27123456789'];
                    assert.deepEqual(user.metadata, {
                        foo: 'bar',
                        baz: 'qux'
                    });
                });
        });
    });

    describe(".setup.config", function() {
        it("should update the sandbox config with the given properties",
        function() {
            return tester
                .setup.config({foo: 'bar'})
                .setup.config({baz: 'qux'})
                .run()
                .then(function() {
                    assert.equal(api.config.store.foo, 'bar');
                    assert.equal(api.config.store.baz, 'qux');
                });
        });

        it("should update the sandbox's app config with the given properties",
        function() {
            return tester
                .setup.config.app({foo: 'bar'})
                .setup.config.app({baz: 'qux'})
                .run()
                .then(function() {
                    assert.equal(api.config.app.foo, 'bar');
                    assert.equal(api.config.app.baz, 'qux');
                });
        });
    });

    describe(".setup.kv", function() {
        describe(".setup.kv(obj)", function() {
            it("should update the kv data with the given properties",
            function() {
                return tester
                    .setup.kv({foo: 'bar'})
                    .setup.kv({baz: 'qux'})
                    .run()
                    .then(function() {
                        assert.equal(api.kv_store.foo, 'bar');
                        assert.equal(api.kv_store.baz, 'qux');
                    });
            });
        });

        describe(".setup.kv(fn)", function() {
            it("should set the kv data with the function's result",
            function() {
                return tester
                    .setup.kv(function(kv) {
                        kv.foo = 'bar';
                        kv.baz = 'qux';
                        return kv;
                    })
                    .setup.kv(function(kv) {
                        delete kv.baz;
                        return kv;
                    })
                    .run()
                    .then(function() {
                        assert.equal(api.kv_store.foo, 'bar');
                        assert(!('baz' in api.kv_store));
                    });
            });

            it("should allow the function to return its result via a promise",
            function() {
                return tester.setup.kv(function() {
                    return Q({foo: 'bar'});
                }).run().then(function() {
                    assert.equal(api.kv_store.foo, 'bar');
                });
            });
        });
    });

    describe(".setup.char_limit", function() {
        it("should change the char limit used in the checking phase", function() {
            return tester
                .setup.char_limit(2)
                .setup.char_limit(3)
                .input()
                .check.reply([
                    'Tea or coffee?',
                    '1. Tea',
                    '2. Coffee'].join('\n'))
                .run()
                .catch(function(e) {
                    assert.equal(e.msg, [
                        "The reply content's character count was longer",
                        "than the expected limit: 31 > 3"].join(' '));
                });
        });
    });
});
