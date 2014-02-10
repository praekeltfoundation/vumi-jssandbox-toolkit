var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var AppTesterTaskSet = tasks.AppTesterTaskSet;


describe("AppTester", function() {
    var tester;
    var record;

    beforeEach(function() {
        tester = new AppTester(new App('start'));
        record = [];

        var setups = tester.tasks.get('setups');
        setups.methods.setups = {};
        setups.methods.setups.test = function() {
            record.push('setups');
        };

        var interactions = tester.tasks.get('interactions');
        interactions.methods.interactions = {};
        interactions.methods.interactions.test = function() {
            record.push('interactions');
        };

        var checks = tester.tasks.get('checks');
        checks.methods.checks = {};
        checks.methods.checks.test = function() {
            record.push('checks');
        };
        checks.methods.err = function() {
            throw new Error(':(');
        };

        tester.tasks.attach();
    });

    describe(".reset", function() {
        it("should reset its tasks", function() {
            tester
                .setups.test()
                .interactions.test()
                .checks.test();

            assert.equal(tester.tasks.length, 3);
            tester.reset();
            assert.equal(tester.tasks.length, 0);
        });

        it("should reset its data", function() {
            tester.data.foo = 'bar';
            tester.reset();
            assert.deepEqual(tester.data, {});
        });

        it("should use a new interaction machine", function() {
            var im = tester.im;
            tester.reset();
            assert.notEqual(tester.im, im);
        });

        it("should use a new api", function() {
            var api = tester.api;
            tester.reset();
            assert.notEqual(tester.api, api);
        });
    });

    describe(".run", function() {
        it("should run its tasks in order", function() {
            return tester
                .setups.test()
                .setups.test()
                .interactions.test()
                .interactions.test()
                .checks.test()
                .checks.test()
                .run()
                .then(function() {
                    assert.deepEqual(record, [
                        'setups',
                        'setups',
                        'interactions',
                        'interactions',
                        'checks',
                        'checks'
                    ]);
                });
        });

        it("should reset its data", function() {
            tester.data.foo = 'bar';
            return tester.run().then(function() {
                assert.deepEqual(tester.data, {});
            });
        });

        describe("if an error is thrown in one of the tasks", function() {
            it("should still ensure a reset is done", function() {
                tester.data.foo = 'bar';
                return tester.err().run().catch(function() {
                    assert.equal(tester.tasks.length, 0);
                    assert.deepEqual(tester.data, {});
                });
            });
        });
    });
});
