var vumigo = require('../../../lib');
var app = require('../lib/app');
var SimpleApp = app.SimpleApp;
var AppTester = vumigo.AppTester;

describe("app", function() {
    describe("SimpleApp", function() {
        var app;
        var tester;
        
        beforeEach(function() {
            app = new SimpleApp();
            tester = new AppTester(app);

            // Setup the app's config
            tester.setup.config.app({
                name: 'some_app'
            });
        });

        describe("when the user starts a session", function() {
            it("should ask them if they want tea or coffee", function() {
                // We want to test what happens when a session starts, so we
                // use `.start()` to create a new session. We then check that
                // the user arrives on the start state, and that they were
                // given the reply we were expecting. `.run()` runs the tasks
                // we just scheduled (starting a new session, then checking the
                // state and reply), returning a promise that is fulfilled once
                // they complete.
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:start',
                        reply: [
                            'Tea or coffee?',
                            '1. Tea',
                            '2. Coffee'
                        ].join('\n')
                    })
                    .run();
            });

            describe("when the user asks for tea", function() {
                it("should tell them our opinion on tea", function() {
                    // We want to test what happens when the user is on the
                    // start state and chooses tea, so we set the user to be on
                    // the start state, then input '1' (the number the user
                    // will enter corresponding to the tea choice). We then
                    // check that the user has been sent the correct reply
                    // text, and that they have moved back to the start state
                    // for the next session.
                    return tester
                        .setup.user.state('states:start')
                        .input('1')
                        .check.interaction({
                            state: 'states:tea',
                            reply: 'Meh. Bye.'
                        })
                        .run();
                });
            });

            describe("when the user asks for coffee", function() {
                it("should tell them our opinion on coffee", function() {
                    // We want to test what happens when the user is on the
                    // start state and chooses coffee. Similarly to the tea
                    // test above, we set the user to be on the start state,
                    // input '2' (which corresponds to coffee), then check that
                    // that we send the correct reply text to them and they
                    // they have been moved back to the start state.
                    return tester
                        .setup.user.state('states:start')
                        .input('2')
                        .check.interaction({
                            state: 'states:coffee',
                            reply: 'Cool :) Bye.'
                        })
                        .run();
                });
            });
        });

        describe("when the user is on the tea state", function() {
            it("should start the user at the start state next session", function() {
                // We want to test what happens when the user was on the tea
                // state at the end of the last session, and has now started a
                // new session. We set the user to be on the tea state, then
                // start a new session with `.start()`, then check that the
                // user is on the start state. Since we only need to check the
                // user's new state, we use `.setup.user.state` instead of
                // `.check.interaction`, although both could be used here.
                return tester
                    .setup.user.state('states:tea')
                    .start()
                    .check.user.state('states:start')
                    .run();
            });
        });

        describe("when the user is on the coffee state", function() {
            it("should start the user at the start state next session", function() {
                // We want to test what happens when the user was on the coffee
                // state at the end of the last session, and has now started a
                // new session. Similarly to the tea test above, we set the
                // user's current state to the coffee state, start a new
                // session, then check the user's new state.
                return tester
                    .setup.user.state('states:coffee')
                    .start()
                    .check.user.state('states:start')
                    .run();
            });
        });
    });
});
