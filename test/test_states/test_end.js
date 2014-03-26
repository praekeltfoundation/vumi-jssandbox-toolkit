var _ = require('lodash');
var vumigo = require('../../lib');
var fixtures = vumigo.fixtures;

var App = vumigo.App;
var AppTester = vumigo.AppTester;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;


describe.only("states.end", function() {
    describe("EndState", function () {
        var tester;

        beforeEach(function() {
            var app = new App('states:start');

            app.states.add('states:start', function(name) {
                return new FreeText(name, {
                    question: 'hello',
                    next: 'states:mid'
                });
            });

            app.states.add('states:mid', function(name) {
                return new FreeText(name, {
                    question: 'middle',
                    next: 'states:end'
                });
            });

            app.states.add('states:end', function(name) {
                _.defaults(tester.data.opts, {
                    text: 'goodbye',
                    next: 'states:start'
                });

                return new EndState(name, tester.data.opts);
            });

            tester = new AppTester(app);
            tester.data.opts = {};
        });

        it("should translate the displayed content", function() {
            tester.data.opts.text = tester.app.$('goodbye');

            return tester
                .setup.config(fixtures.config())
                .setup.user.state('states:mid')
                .setup.user.lang('af')
                .input('foo')
                .check.reply('totsiens')
                .run();
        });

        it("should move the user to the next state after showing the state",
        function() {
            return tester
                .setup.user.state('states:mid')
                .input('foo')
                .check.reply('goodbye')
                .check.user.state('states:start')
                .run();
        });

        describe("when dealing with session-based messages", function() {
            it("should show the next state on a new session", function() {
                return tester
                    .setup.user.state('states:start')
                    .input({
                        content: null,
                        session_event: 'new'
                    })
                    .check.reply('hello')
                    .check.user.state('states:start')
                    .run();
            });
        });

        describe("when dealing with non-session-based messages", function() {
            it("should show the next state on a new session", function() {
                return tester
                    .setup.user.state('states:start')
                    .input({
                        content: 'foo',
                        session_event: null
                    })
                    .check.reply('hello')
                    .check.user.state('states:start')
                    .run();
            });
        });
    });
});
