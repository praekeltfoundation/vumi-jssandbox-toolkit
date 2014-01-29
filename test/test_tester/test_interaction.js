var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var TaskMethodError = tester.TaskMethodError;

describe("AppTester Interaction Tasks", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new App('start');
        tester = new AppTester(app);
    });

    describe("if checking tasks have already been scheduled", function() {
        beforeEach(function() {
            var checks = tester.tasks.get('checks');
            checks.methods.check = function() {};
            tester.tasks.attach();
        });

        it("should throw an error when scheduling interaction tasks", function() {
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
});
