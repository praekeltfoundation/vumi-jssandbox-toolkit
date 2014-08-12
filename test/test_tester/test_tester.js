var assert = require('assert');

var vumigo = require('../../lib');
var State = vumigo.states.State;
var App = vumigo.app.App;
var AppTester = vumigo.tester.AppTester;


describe("tester.tester", function() {
    describe("AppTester", function() {
        var tester;
        var record;

        beforeEach(function() {
            var app = new App('start');
            app.states.add(new State('start'));

            tester = new AppTester(app);
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
                assert.notStrictEqual(tester.im, im);

                im = tester.im;
                assert.strictEqual(tester.tasks.get('setups').im, im);
                assert.strictEqual(tester.tasks.get('interactions').im, im);
                assert.strictEqual(tester.tasks.get('checks').im, im);
            });

            it("should use a new api", function() {
                var api = tester.api;
                tester.reset();
                assert.notStrictEqual(tester.api, api);

                api = tester.api;
                assert.strictEqual(tester.tasks.get('setups').api, api);
                assert.strictEqual(tester.tasks.get('interactions').api, api);
                assert.strictEqual(tester.tasks.get('checks').api, api);
            });
        });

        describe(".reset.interaction", function() {
            it("should use a new interaction machine", function() {
                var im = tester.im;
                tester.reset.interaction();
                assert.notStrictEqual(tester.im, im);

                im = tester.im;
                assert.strictEqual(tester.tasks.get('setups').im, im);
                assert.strictEqual(tester.tasks.get('interactions').im, im);
                assert.strictEqual(tester.tasks.get('checks').im, im);
            });

            it("should bind an event listener that rethrows errors", function() {
                var app = tester.app;

                function bad_fullfill() {
                    throw new Error('Promise should not have been fulfilled');
                }

                function bad_reject() {
                    throw new Error('Promise should not have been rejected');
                }

                return app.teardown()
                    .then(function() {
                        return app.emit.app_error('no foo');
                    })
                    .then(function() {
                        tester.reset.interaction();
                        return app.emit.app_error('no bar');
                    }, bad_reject)
                    .then(bad_fullfill, function(e) {
                        assert(e instanceof Error);
                        assert.equal(e.message, 'no bar');
                    });
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
});
