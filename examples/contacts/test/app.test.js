var assert = require('assert');

require('mocha-as-promised')();
var vumigo = require('vumigo_v02');
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
                            states: 'states:registered',
                            reply: [
                                "Hello Anakin. I hear you like tea.",
                                "That's nice. Bye."
                            ].join(' ')
                        })
                        .run();
                });

                it("should tell them if they like coffee if they do", function() {
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
                            states: 'states:registered',
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
                            states: 'states:registration:name',
                            reply: "What is your name?"
                        })
                        .run();
                });
            });
        });

        describe("when the user is asked for their name", function() {
            describe("when the user responds", function() {
                it("should save their name", function() {
                    return tester
                        .setup.user.state('states:registration:name')
                        .input('Luke')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.name, 'Luke');
                        })
                        .run();
                });

                it("should ask them if if they like tea or coffee", function() {
                    return tester
                        .setup.user.state('states:registration:name')
                        .input('Luke')
                        .check.interaction({
                            states: 'states:registration:name',
                            reply: [
                                "Do you like tea or coffee?",
                                "1. Tea",
                                "2. Coffee"
                            ].join('\n')
                        })
                        .run();
                });
            });
        });

        describe("when the user is asked if they like tea or coffee", function() {
            describe("when the user chooses tea", function() {
                beforeEach(function() {
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
                    return tester
                        .input('1')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.beverage, 'tea');
                        })
                        .run();
                });

                it("should register the user", function() {
                    return tester
                        .input('1')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.registered, 'true');
                        })
                        .run();
                });

                it("should tell them their beverage preference", function() {
                    return tester
                        .input('1')
                        .check.interaction({
                            states: 'states:registration:name',
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
                    return tester
                        .input('2')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.beverage, 'coffee');
                        })
                        .run();
                });

                it("should register the user", function() {
                    return tester
                        .input('2')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.registered, 'true');
                        })
                        .run();
                });

                it("should tell them their beverage preference", function() {
                    return tester
                        .input('2')
                        .check.interaction({
                            states: 'states:registered',
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
