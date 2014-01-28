var Q = require('q');
var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var AppTesterTaskSet = tasks.AppTesterTaskSet;


var ToyTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.name = function() {
        return 'toys';
    };

    self.validate = function(name) {
        if (name == 'bad') {
            throw new Error();
        }
    };

    self.methods.lerp = function(obj) {
        obj.lerped = true;
        return obj;
    };

    self.methods.lerp.larp = function(obj) {
        self.methods.lerp(obj);
        obj.larped = true;
        return obj;
    };

    self.methods.foo = {};

    self.methods.foo.bar = function(obj) {
        obj.barred = true;
        return obj;
    };

    self.methods.foo.baz = function(obj) {
        obj.bazzed = true;
        return obj;
    };
});


var FlyingToyTasks = ToyTasks.extend(function(self, tester) {
    ToyTasks.call(self, tester);

    self.name = function() {
        return 'flying_toys';
    };

    var methods = self.methods;
    self.methods = {};
    self.methods.flying = methods;
});

describe("AppTesterTasks", function() {
    var tester;
    var tasks;

    beforeEach(function() {
        tester = new AppTester(new App('start'));
        tasks = new ToyTasks(tester);
        tester.tasks.add('toys', tasks);
    });

    describe(".attach", function() {
        it("should attach its methods to the tester", function() {
            assert(!('lerp' in tester));
            assert(!('foo' in tester));

            tasks.attach();

            var obj = {};
            return tester
                .foo.bar(obj)
                .foo.baz(obj)
                .lerp(obj)
                .lerp.larp(obj)
                .run()
                .then(function() {
                    assert.deepEqual(obj, {
                        barred: true,
                        bazzed: true,
                        lerped: true,
                        larped: true
                    });
                });
        });
        
        it("should build the methods' task names", function() {
            tasks.attach();
            assert.equal(tester.foo.bar.__task_name__, 'foo.bar');
            assert.equal(tester.foo.baz.__task_name__, 'foo.baz');
            assert.equal(tester.lerp.__task_name__, 'lerp');
            assert.equal(tester.lerp.larp.__task_name__, 'lerp.larp');
        });
    });

    describe(".reset", function() {
        it("should clear the task list", function() {
            tasks.schedule('spam', function() {});
            assert.equal(tasks.length, 1);

            tasks.reset();
            assert.equal(tasks.length, 0);
        });
    });

    describe(".schedule", function() {
        it("should validate each scheduled task", function() {
            assert.throws(function() {
                tasks.schedule('bad', function() {});
            });
        });

        it("should schedule the given task function for next run", function() {
            var spammed = false;

            tasks.schedule('spam', function() {
                spammed = true;
            });

            assert(!spammed);
            return tasks.run().then(function() {
                assert(spammed);
            });
        });
    });

    describe(".run", function() {
        it("should perform scheduled tasks in order", function() {
            var record = [];
            var d1 = Q.defer();
            var d2 = Q.defer();

            tasks.schedule(1, function() {
                return d1.promise.then(function() {
                    record.push(1);
                });
            });

            tasks.schedule(2, function() {
                return d2.promise.then(function() {
                    record.push(2);
                });
            });

            var p = tasks.run();

            d1.resolve();

            return Q()
                .delay()
                .then(function() {
                    d2.resolve();
                })
                .delay()
                .then(function() {
                    d1.resolve();
                })
                .thenResolve(p)
                .then(function() {
                    assert.deepEqual(record, [1, 2]);
                });
        });

        it("should reset itself", function() {
            tasks.schedule('spam', function() {});
            assert.equal(tasks.length, 1);

            return tasks.run().then(function() {
                assert.equal(tasks.length, 0);
            });
        });
    });
});

describe("AppTesterTaskSet", function() {
    var tester;
    var tasks;

    var toys;
    var flying_toys;

    beforeEach(function() {
        tester = new AppTester(new App('start'));
        tasks = new AppTesterTaskSet();

        toys = new ToyTasks(tester);
        tasks.add('toys', toys);

        flying_toys = new FlyingToyTasks(tester);
        tasks.add('flying_toys', flying_toys);
    });

    describe(".attach", function() {
        it("should attach all its tasks' methods", function() {
            assert(!('lerp' in tester));
            assert(!('foo' in tester));
            assert(!('flying' in tester));

            tasks.attach();

            var obj = {};
            return tester
                .foo.bar(obj)
                .foo.baz(obj)
                .lerp(obj)
                .lerp.larp(obj)
                .flying.foo.bar(obj)
                .flying.foo.baz(obj)
                .flying.lerp(obj)
                .flying.lerp.larp(obj)
                .run();
        });
    });

    describe(".get", function() {
        it("should retrieve the associated tasks", function() {
            assert.strictEqual(tasks.get('toys'), toys);
        });
    });

    describe(".add", function() {
        it("should add a new task collection", function() {
            var more_toys = new ToyTasks(tester);
            assert(typeof tasks.get('more_toys') == 'undefined');

            tasks.add('more_toys', more_toys);
            assert.strictEqual(tasks.get('more_toys'), more_toys);

            assert.deepEqual(
                tasks.invoke('name'),
                ['toys', 'flying_toys', 'toys']);
        });
    });

    describe(".invoke", function() {
        it("should invoke the method on each task collection in order",
        function() {
            assert.deepEqual(
                tasks.invoke('name'),
                ['toys', 'flying_toys']);
        });
    });

    describe(".reset", function() {
        it("should reset all its tasks", function() {
            toys.schedule('a', function() {});
            flying_toys.schedule('b', function() {});
            assert.equal(tasks.length, 2);

            tasks.reset();
            assert.equal(tasks.length, 0);
        });
    });

    describe(".run", function() {
        it("should run its tasks in order", function() {
            var record = [];
            var d1 = Q.defer();
            var d2 = Q.defer();

            toys.schedule(1, function() {
                return d1.promise.then(function() {
                    record.push(1);
                });
            });

            flying_toys.schedule(2, function() {
                return d2.promise.then(function() {
                    record.push(2);
                });
            });

            var p = tasks.run();

            d1.resolve();

            return Q()
                .delay()
                .then(function() {
                    d2.resolve();
                })
                .delay()
                .then(function() {
                    d1.resolve();
                })
                .thenResolve(p)
                .then(function() {
                    assert.deepEqual(record, [1, 2]);
                });
        });
    });
});
