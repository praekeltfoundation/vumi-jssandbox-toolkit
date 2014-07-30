var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var fixtures = vumigo.fixtures;
var test_utils = vumigo.test_utils;
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var PaginatedState = vumigo.states.PaginatedState;


describe("states.paginated", function() {
    describe("PaginatedState", function() {
        var tester;
        var opts;

        function pager(i) {
            return {
                0: 'Page 0',
                1: 'Page 1',
                2: 'Page 2',
            }[i];
        }

        beforeEach(function () {
            var app = new App('states:test');
            opts = function() { return {}; };

            app.states.add('states:test', function(name) {
                return new PaginatedState(name, opts);
            });

            app.states.add('states:next', function(name) {
                return new EndState(name, {text: 'You are on the next state.'});
            });

            tester = new AppTester(app);
        });

        it("should pass the correct args to the page function", function() {
            opts.chars = 12;

            opts.text = 'foo';

            opts.page = function(i, text, n) {
                assert([0, 1].indexOf(i) > -1);
                assert.equal(text, 'foo');
                assert.equal(n, 12);
            };

            return tester
                .start()
                .run();
        });

        describe("when on the first page", function() {
            it("should show only the more and exit choices", function() {
                opts.page = pager;

                return tester
                    .start()
                    .check.reply([
                        "Page 0",
                        "1. More",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should show more when asked", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1')
                    .check.reply([
                        "Page 1",
                        "1. Back",
                        "2. More",
                        "3. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should exit the state when asked", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '2')
                    .check.user.state('states:next')
                    .check.reply('You are on the next state.')
                    .run();
            });

            it("should stay on the same page on invalid input", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '3', '4', 'a', 'b')
                    .check.reply([
                        "Page 0",
                        "1. More",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });
        });

        describe("when on the last page", function() {
            it("should show only the back and exit choices", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1', '2')
                    .check.reply([
                        "Page 2",
                        "1. Back",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should go back when asked", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1', '2', '1')
                    .check.reply([
                        "Page 1",
                        "1. Back",
                        "2. More",
                        "3. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should exit the state when asked", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '1', '2', '2')
                    .check.user.state('states:next')
                    .check.reply('You are on the next state.')
                    .run();
            });

            it("should stay on the same page on invalid input", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '1', '2', '3', '4', 'a', 'b')
                    .check.reply([
                        "Page 2",
                        "1. Back",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });
        });

        describe("when not on the first or last page", function() {
            it("should show the back, more and exit choices", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1')
                    .check.reply([
                        "Page 1",
                        "1. Back",
                        "2. More",
                        "3. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should go back when asked", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1', '1')
                    .check.reply([
                        "Page 0",
                        "1. More",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should show more when asked", function() {
                opts.page = pager;

                return tester
                    .inputs(null, '1', '2')
                    .check.reply([
                        "Page 2",
                        "1. Back",
                        "2. Exit",
                    ].join('\n'))
                    .run();
            });

            it("should exit the state when asked", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '1', '3')
                    .check.user.state('states:next')
                    .check.reply('You are on the next state.')
                    .run();
            });

            it("should stay on the same page on invalid input", function() {
                opts.page = pager;
                opts.next = 'states:next';

                return tester
                    .inputs(null, '1', '4', 'a', 'b')
                    .check.reply([
                        "Page 1",
                        "1. Back",
                        "2. More",
                        "3. Exit",
                    ].join('\n'))
                    .run();
            });
        });

        it("should translate the displayed content", function() {
            opts.page = function(i, text) { return text; };
            opts.text = test_utils.$('hello');
            opts.back = test_utils.$('no');
            opts.more = test_utils.$('yes');
            opts.exit = test_utils.$('goodbye');

            return tester
                .setup.config(fixtures.config())
                .setup.user.lang('af')
                .inputs(null, '1')
                .check.reply([
                    "hallo",
                    "1. nee",
                    "2. ja",
                    "3. totsiens",
                ].join('\n'))
                .run();
        });

        describe("default 'page' function", function() {
            it("should display the words fitting on the page", function() {
                opts.chars = 5;
                opts.text = 'fo bar bz qx';

                return Q()
                    .then(function() {
                        return tester
                            .start()
                            .check.reply([
                                "fo",
                                "1. More",
                                "2. Exit",
                            ].join('\n'))
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '1')
                            .check.reply([
                                "bar",
                                "1. Back",
                                "2. More",
                                "3. Exit",
                            ].join('\n'))
                            .run();
                    })
                    .then(function() {
                        return tester
                            .inputs(null, '1', '2')
                            .check.reply([
                                "bz qx",
                                "1. Back",
                                "2. Exit",
                            ].join('\n'))
                            .run();
                    });
            });
        });
    });
});
