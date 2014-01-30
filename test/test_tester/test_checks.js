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


describe("AppTester Check Tasks", function() {
    var api;
    var app;
    var tester;

    beforeEach(function() {
        app = new App('start');

        app.states.add(new ChoiceState('initial_state', {
            question: "Tea or coffee?",
            choices: [
                new Choice('tea', 'Tea'),
                new Choice('coffee', 'Coffee')
            ],
            next: function(choice) {
                return {
                    tea: 'cofee_state',
                    coffee: 'tea_state'
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
        api = tester.api;
    });

    describe(".check", function() {
        it("should call the given checker function", function() {
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
    });
});
