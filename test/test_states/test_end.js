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
                .setup.user.state('states:start')
                .setup.user.lang('af')
                .input('foo')
                .check.reply('totsiens')
                .run();
        });

        it("should move the user to the next state after showing content",
        function() {
            return tester
                .setup.user.state('states:start')
                .input('foo')
                .check.reply('goodbye')
                .check.user.state('states:start')
                .run();
        });
    });
});
