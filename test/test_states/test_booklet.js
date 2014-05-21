var _ = require('lodash');
var Q = require('q');

var vumigo = require('../../lib');
var fixtures = vumigo.fixtures;
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var test_utils = vumigo.test_utils;
var BookletState = vumigo.states.BookletState;


describe("states.booklet", function() {
    describe("BookletState", function() {
        var tester;

        beforeEach(function () {
            var app = new App('states:test');

            app.states.add('states:test', function(name) {
                _.defaults(tester.data.opts, {
                    next: "states:next",
                    pages: 3,
                    page_text: function(n) {
                        return Q("Page " + n + ".");
                    }
                });

                return new BookletState(name, tester.data.opts);
            });

            app.states.add('states:next', function(name) {
                return new EndState(name, {
                    text: 'You are on the next state.'
                });
            });

            tester = new AppTester(app);
            tester.data.opts = {};
        });

        it("should stay on page 0 when the user tries go back on it",
        function() {
            return tester
                .setup.user.state({
                    name: 'states:test',
                    metadata: {page: 0}
                })
                .input('1')
                .check.reply([
                    "Page 0.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should stay on the last page when the user tries go forward on it",
        function() {
            return tester
                .setup.user.state({
                    name: 'states:test',
                    metadata: {page: 2}
                })
                .input('2')
                .check.reply([
                    "Page 2.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should display the first page when the user enters", function() {
            return tester
                .input()
                .check.reply([
                    "Page 0.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should show the same page if bad input was given", function() {
            return tester
                .setup.user.state('states:test')
                .input('3')
                .check.reply([
                    "Page 0.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should go to the previous page if asked", function() {
            return tester
                .setup.user.state({
                    name: 'states:test',
                    metadata: {page: 1}
                })
                .input('1')
                .check.reply([
                    "Page 0.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should go to the next page if asked", function() {
            return tester
                .setup.user.state({
                    name: 'states:test',
                    metadata: {page: 1}
                })
                .input('2')
                .check.reply([
                    "Page 2.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'))
                .run();
        });

        it("should go to the next state if asked", function() {
            return tester
                .setup.user.state('states:test')
                .input('0')
                .check.reply("You are on the next state.")
                .check.user.state('states:next')
                .run();
        });

        it("should translate the displayed content", function() {
            tester.data.opts = {
                pages: 2,
                page_text: function(i) {
                    return [
                        test_utils.$('hello'),
                        test_utils.$('goodbye')
                    ][i];
                },
                footer_text: test_utils.$('yes or no?')
            };

            return tester
                .setup.config(fixtures.config())
                .setup.user.lang('af')
                .input()
                .check.reply([
                    "hallo",
                    "ja of nee?"
                ].join('\n'))
                .run();
        });
    });
});
