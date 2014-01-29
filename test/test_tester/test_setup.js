var Q = require('q');
var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var TaskMethodError = tester.TaskMethodError;

describe("AppTester Setup Tasks", function() {
    var api;
    var app;
    var tester;

    beforeEach(function() {
        app = new App('start');
        tester = new AppTester(app);
        api = tester.api;
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
                    api.config_store.foo = 'bar';
                })
                .run()
                .then(function() {
                    assert.equal(tester.api.config_store.foo, 'bar');
                });
        });
    });

    describe(".setup.user", function() {
        describe("if an object is given", function() {
            it("should update the user data with the given properties",
            function() {
                return tester.setup.user({
                    addr: '+81',
                    lang: 'jp'
                }).run().then(function() {
                    var user = api.kv_store['users.default.+81'];
                    assert.equal(user.lang, 'jp');
                    assert.equal(user.addr, '+81');
                });
            });
        });

        describe("if a function is given", function() {
            it("should update the user data with the function's result",
            function() {
                return tester.setup.user(function(user) {
                    user.addr = '+81';
                    user.lang = 'jp';
                    return user;
                }).run().then(function() {
                    var user = api.kv_store['users.default.+81'];
                    assert.equal(user.lang, 'jp');
                    assert.equal(user.addr, '+81');
                });
            });

            it("should allow the function to return its result via a promise",
            function() {
                var d = Q.defer();

                var p = tester.setup.user(function() {
                    return d.promise.then(function() {
                        return {
                            addr: '+81',
                            lang: 'jp'
                        };
                    });
                }).run().then(function() {
                    var user = api.kv_store['users.default.+81'];
                    assert.equal(user.lang, 'jp');
                    assert.equal(user.addr, '+81');
                });

                d.resolve();
                return p;
            });
        });
    });

    describe(".setup.user.lang", function() {
        it("should set the user's language", function() {
            return tester.setup.user.lang('af').run().then(function() {
                var user = api.kv_store['users.default.+27123456789'];
                assert.equal(user.lang, 'af');
            });
        });
    });

    describe(".setup.user.addr", function() {
        it("should set the user's address", function() {
            return tester.setup.user.addr('+2798765').run().then(function() {
                var user = api.kv_store['users.default.+2798765'];
                assert.equal(user.addr, '+2798765');
            });
        });
    });

    describe(".setup.user.answers", function() {
        it("should set the user's answers", function() {
            return tester.setup.user.answers({
                initial_state: 'coffee',
                coffee_state: 'yes'
            }).run().then(function() {
                var user = api.kv_store['users.default.+27123456789'];
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
                    var user = api.kv_store['users.default.+27123456789'];
                    assert.deepEqual(user.answers.initial_state, 'coffee');
                });
        });
    });
});
