var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var TaskMethodError = tester.TaskMethodError;

describe("AppTester Setup Tasks", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new App('start');
        tester = new AppTester(app);
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
});
