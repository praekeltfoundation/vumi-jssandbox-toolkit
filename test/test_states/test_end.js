var _ = require('lodash');
var vumigo = require('../../lib');
var fixtures = vumigo.fixtures;

var App = vumigo.App;
var AppTester = vumigo.AppTester;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;


describe("states.end", function() {
    describe("EndState", function () {
        var tester;
        var opts;

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
                _.defaults(opts, {
                    text: 'goodbye',
                    next: 'states:start'
                });

                return new EndState(name, opts);
            });

            app.states.add('states:delegate_to_end', function(name) {
                return app.states.create('states:end');
            });

            opts = {};
            tester = new AppTester(app);
        });

        it("should translate the displayed content", function() {
            opts.text = tester.app.$('goodbye');

            return tester
                .setup.config(fixtures.config())
                .setup.user.state('states:mid')
                .setup.user.lang('af')
                .input('foo')
                .check.reply('totsiens')
                .run();
        });

        describe("when the state is reached with a session-based message",
        function() {
            it("should show the state, then the next state on a new session",
            function() {
                var user = tester.im.user;

                return tester
                    .setup.user.state('states:mid')
                    .input('foo')
                    .check.user.state('states:end')
                    .check.reply('goodbye')
                    .run()
                    .then(function() {
                        return tester
                            .setup.user(user.serialize())
                            .input({
                                content: null,
                                session_event: 'new'
                            })
                            .check.reply('hello')
                            .check.user.state('states:start')
                            .run();
                    });
            });
        });

        describe("when the state is reached with a non-session-based message",
        function() {
            it("should show the state, then the next state on a new session",
            function() {
                var user = tester.im.user;

                return tester
                    .setup.user.state('states:mid')
                    .input('foo')
                    .check.user.state('states:end')
                    .check.reply('goodbye')
                    .run()
                    .then(function() {
                        return tester
                            .setup.user(user.serialize())
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

        describe("when the state is delegated to at the start of a session",
        function() {
            it("should show the state, then the next state on a new session",
            function() {
                var user = tester.im.user;

                return tester
                    .setup.user.state('states:delegate_to_end')
                    .input({
                        content: null,
                        session_event: 'new'
                    })
                    .check.user.state('states:end')
                    .check.reply('goodbye')
                    .run()
                    .then(function() {
                        return tester
                            .setup.user(user.serialize())
                            .input({
                                content: null,
                                session_event: 'new'
                            })
                            .check.reply('hello')
                            .check.user.state('states:start')
                            .run();
                    });
            });
        });
    });
});
