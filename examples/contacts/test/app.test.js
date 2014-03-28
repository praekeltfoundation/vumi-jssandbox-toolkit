var assert = require('assert');

require('mocha-as-promised')();
var vumigo = require('../../../lib');
var app = require('../lib/app');
var ContactsApp = app.ContactsApp;
var AppTester = vumigo.AppTester;

describe("app", function() {
    describe("ContactsApp", function() {
        var app;
        var tester;
        
        beforeEach(function() {
            app = new ContactsApp();
            tester = new AppTester(app);

            tester.setup.config.app({
                name: 'some_app'
            });
        });

        describe("when the user starts a session", function() {
            describe("if they are registered", function() {
                it("should tell them if they like tea if they do", function() {
                    // We want to test what happens if a user that likes tea
                    // reaches this screen, so we create a contact that likes
                    // tea. It is important to set the contact's msisdn to the
                    // same address as the user that will be interacting with
                    // the app in this test, so that the app pulls the right
                    // contact from the store for the user.
                    return tester
                        .setup.user.addr('+273321')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+273321',
                                name: 'Anakin',
                                extra: {
                                    registered: 'true',
                                    beverage: 'tea'
                                }
                            });
                        })
                        .start()
                        .check.interaction({
                            state: 'states:registered',
                            reply: [
                                "Hello Anakin. I hear you like tea.",
                                "That's nice. Bye."
                            ].join(' ')
                        })
                        .run();
                });

                it("should tell them if they like coffee if they do", function() {
                    // Similar to the tea test above, we set the contact up to
                    // like coffee.
                    return tester
                        .setup.user.addr('+273123')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+273123',
                                name: 'Luke',
                                extra: {
                                    registered: 'true',
                                    beverage: 'coffee'
                                }
                            });
                        })
                        .start()
                        .check.interaction({
                            state: 'states:registered',
                            reply: [
                                "Hello Luke. I hear you like coffee.",
                                "That's nice. Bye."
                            ].join(' ')
                        })
                        .run();
                });

            });

            describe("if they are not registered", function() {
                it("should ask them their name", function() {
                    return tester
                        .start()
                        .check.interaction({
                            state: 'states:registration:name',
                            reply: "What is your name?"
                        })
                        .run();
                });
            });
        });

        describe("when the user is asked for their name", function() {
            it("should save their name", function() {
                // We need to test that the contact store was given the
                // name that the user responded with, so we need to do a
                // custom check using `.check`. We inspect the first
                // contact in the api's contact store, since only one new
                // contact would be created for the user.
                return tester
                    .setup.user.state('states:registration:name')
                    .input('Luke')
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.name, 'Luke');
                    })
                    .run();
            });

            it("should ask them if they like tea or coffee", function() {
                return tester
                    .setup.user.state('states:registration:name')
                    .input('Luke')
                    .check.interaction({
                        state: 'states:registration:beverage',
                        reply: [
                            "Do you like tea or coffee?",
                            "1. Tea",
                            "2. Coffee"
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user is asked if they like tea or coffee", function() {
            it("should register the user with their response", function() {
                // We want to check that the user is registered after
                // choosing any valid option, so we send any valid choice
                // (in this case '1') from the user, then check that the
                // user is registered.
                return tester
                    .setup.user.state('states:registration:beverage')
                    .input('1')
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.registered, 'true');
                    })
                    .run();
            });

            describe("when the user chooses tea", function() {
                beforeEach(function() {
                    // Here, we add some setting up that will be happening for
                    // all of the tests in this `describe`. We set up the
                    // contact information we would have about the user so far
                    // (their name and address), and put the user on the
                    // 'states:registration:beverage' state.
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+273321',
                                name: 'Anakin',
                            });
                        })
                        .setup.user.addr('+273321')
                        .setup.user.state('states:registration:beverage');
                });

                it("should save their beverage preference", function() {
                    // We want to check that we stored the contact's beverage
                    // as tea if they enter tea as a choice, so tell the tester
                    // to input '1' from the user (which corresponds to tea),
                    // then check that we stored this on the contact.
                    return tester
                        .input('1')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.beverage, 'tea');
                        })
                        .run();
                });

                it("should tell them their beverage preference", function() {
                    return tester
                        .input('1')
                        .check.interaction({
                            state: 'states:registered',
                            reply: [
                                "Hello Anakin. I hear you like tea.",
                                "That's nice. Bye."
                            ].join(' ')
                        })
                        .run();
                });
            });

            describe("when the user chooses coffee", function() {
                beforeEach(function() {
                    // similar to `beforeEach` for the tea tests above, we add
                    // some setting up that will be happening for each of this
                    // `describe`'s tests.
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+273123',
                                name: 'Luke',
                            });
                        })
                        .setup.user.addr('+273123')
                        .setup.user.state('states:registration:beverage');
                });

                it("should save their beverage preference", function() {
                    // Similar to the tea test, we tell the tester to send '2'
                    // from the user (for coffee), then check that we stored
                    // 'coffee' as the contact's beverage.
                    return tester
                        .input('2')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.beverage, 'coffee');
                        })
                        .run();
                });

                it("should tell them their beverage preference", function() {
                    return tester
                        .input('2')
                        .check.interaction({
                            state: 'states:registered',
                            reply: [
                                "Hello Luke. I hear you like coffee.",
                                "That's nice. Bye."
                            ].join(' ')
                        })
                        .run();
                });
            });
        });
    });
});
