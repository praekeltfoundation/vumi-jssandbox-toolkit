var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;


describe("AppTester Setup Tasks", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new App('start');
        tester = new AppTester(app);
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
