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
        it("should call the given function", function() {
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

    describe(".check.interaction", function() {
        it("should check the current state name");
        it("should check the reply content if given");
    });

    describe(".check.user", function() {
        describe(".check.user(obj)", function() {
            it("should check the user's state if given");

            it("should check the user's answers if given");

            it("should check arbitrary user fields");

            it("should throw an error if non-existant fields are given");
        });


        describe(".check.user(fn)", function() {
            it("should call the function with the user instance");
        });
    });

    describe(".check.user.answers", function() {
        it("should check the user's answers");
    });

    describe(".check.user.answer", function() {
        it("should check user's answer for the given state");
    });

    describe(".check.state", function() {
        describe(".check.state(name, metadata)", function() {
            it("should check the current state's name");
            it("should check the current state's metadata if given");
        });

        describe(".check.state(obj)", function() {
            it("should check the current state's name");
            it("should check the current state's metadata if given");
        });

        describe(".check.state(fn)", function() {
            it("should call the function with the state instance");
        });
    });

    describe(".check.state.attrs", function() {
        it("should check the current state's name");
        it("should check the current state's metadata if given");
    });

    describe(".check.state.metadata", function() {
        it("should check the current state's metadata");
    });

    describe(".check.reply", function() {
        describe(".check.reply(content)", function() {
            it("should check the content of the sent reply");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });

        describe(".check.reply(obj)", function() {
            it("should check the properties of the sent reply");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });

        describe(".check.reply(fn)", function() {
            it("should call the function with the state instance");
            it("should throw an error an error if no reply was sent");
            it("should throw an error if multiple replies were sent");
        });
    });

    describe(".check.reply.content", function() {
        it("should check the content of the sent reply");
        it("should throw an error an error if no reply was sent");
        it("should throw an error if multiple replies were sent");
    });

    describe(".check.reply.shorter_than", function() {
        it("should check that the reply char count is below the given number");
        it("should throw an error an error if no reply was sent");
        it("should throw an error if multiple replies were sent");
    });

    describe(".check.reply.no_reply", function() {
        it("should check that no reply was sent");
    });
});
