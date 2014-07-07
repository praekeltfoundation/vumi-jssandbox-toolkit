var assert = require('assert');
var vumigo = require('../../../lib');
var fixtures = require('./fixtures');
var app = require('../lib/app');
var HttpApp = app.HttpApp;
var AppTester = vumigo.AppTester;

describe("app", function() {
    describe("HttpApp", function() {
        var app;
        var tester;
        
        beforeEach(function() {
            app = new HttpApp();
            tester = new AppTester(app);

            tester
                .setup.config.app({
                    name: 'test_app'
                })
                .setup(function(api) {
                    // Add all of the fixtures.
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when the user starts a session", function() {
            it("should ask them to put or post", function() {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:start',
                        reply: [
                            'Choose your destiny:',
                            '1. Put something',
                            '2. Post something',
                            '3. Cause an error'
                        ].join('\n')
                    })
                    .run();
            });

            describe("when the user chooses to put", function() {
                it("should ask them to put something", function() {
                    return tester
                        .setup.user.state('states:start')
                        .input('1')
                        .check.interaction({
                            state: 'states:put',
                            reply: 'What would you like to put?'
                        })
                        .run();
                });
            });

            describe("when the user chooses to post", function() {
                it("should ask them to post something", function() {
                    return tester
                        .setup.user.state('states:start')
                        .input('2')
                        .check.interaction({
                            state: 'states:post',
                            reply: 'What would you like to post?'
                        })
                        .run();
                });
            });

            describe("when the user chooses to cause an error", function() {
                it("should tell them the result", function() {
                    return tester
                        .setup.user.state('states:start')
                        .input('3')
                        .check.interaction({
                            state: 'states:error',
                            reply: [
                                "You just performed a request.",
                                "It got a response with the status code 418"
                            ].join(' ')
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        describe("when the user is asked to put something", function() {
            it("should should put their response", function() {
                // We want to check that the response was given to httpbin.org,
                // so we look at the request stored under `api.http.requests`
                // and check the the request's data equals the content given by
                // the user.
                return tester
                    .setup.user.state('states:put')
                    .input('hello world!')
                    .check(function(api) {
                        var req = api.http.requests[0];
                        assert.deepEqual(req.data, {message: 'hello world!'});
                    })
                    .run();
            });

            it("should tell them the result", function() {
                // Here, we rely on the corresponding fixture to set the
                // response we were given. The echoed back 'hello world'
                // was determined by the fixture's response.
                return tester
                    .setup.user.state('states:put')
                    .input('hello world!')
                    .check.interaction({
                        state: 'states:done',
                        reply: [
                            "You just performed a put.",
                            "It was echoed back: hello world!"
                        ].join(' ')
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("when the user is asked to post something", function() {
            it("should should post their response", function() {
                // Similarly to the put test, we check that the message was
                // given to httpbin.org correctly by inspecting the data of the
                // requests stored under `api.http.requests`.
                return tester
                    .setup.user.state('states:post')
                    .input('hello world!')
                    .check(function(api) {
                        var req = api.http.requests[0];
                        assert.deepEqual(req.data, {message: 'hello world!'});
                    })
                    .run();
            });

            it("should tell them the result", function() {
                // Similarly to the test for put, we rely on the corresponding
                // fixture to set the response. The echoed back 'hello world'
                // was determined by the fixture's response.
                return tester
                    .setup.user.state('states:post')
                    .input('hello world!')
                    .check.interaction({
                        state: 'states:done',
                        reply: [
                            "You just performed a post.",
                            "It was echoed back: hello world!"
                        ].join(' ')
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });
    });
});
