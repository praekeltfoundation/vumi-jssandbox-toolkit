require('mocha-as-promised')();
var assert = require('assert');
var vumigo = require('vumigo_v02');
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
            tester = new AppTester(app, {
                api: {http: {default_encoding: 'json'}}
            });

            tester
                .setup.config.app({
                    name: 'test_app'
                })
                .setup(function(api) {
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
                            '2. Post something'
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
        });

        describe("when the user is asked to put something", function() {
            it("should should put their response", function() {
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
                    .run();
            });
        });

        describe("when the user is asked to post something", function() {
            it("should should post their response", function() {
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
                    .run();
            });
        });
    });
});
