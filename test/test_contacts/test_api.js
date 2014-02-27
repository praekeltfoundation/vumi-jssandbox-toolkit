var assert = require("assert");

var vumigo = require("../../lib");
var api = vumigo.contacts.api;
var Contact = api.Contact;
var ContactError = api.ContactError;


describe("contacts.api", function() {
    describe("Contact", function() {
        describe(".do.validate", function() {
            it("should throw an error for non-string msisdns", function() {
                var contact = new Contact({
                    key: '123',
                    msisdn: '+27123',
                    user_account: 'user_foo'
                });

                contact.msisdn = null;

                assert.throws(
                    function() { contact.do.validate(); },
                    function(error) {
                        assert(error instanceof ContactError);
                        assert.equal(
                            error.message,
                            ["Contact has an msisdn of type 'object' instead of",
                             "'string': null"].join(' '));

                        return true;
                    });
            });

            it("should throw an error for non-string groups", function() {
                var contact = new Contact({
                    key: '123',
                    msisdn: '+27123',
                    user_account: 'user_foo',
                });

                contact.groups.push(null);

                assert.throws(
                    function() { contact.do.validate(); },
                    function(error) {
                        assert(error instanceof ContactError);
                        assert.equal(
                            error.message,
                            ["Contact has a group of type 'object' instead of",
                             "'string': null"].join(' '));

                        return true;
                    });
            });

            it("should throw an error for non-string extra values", function() {
                var contact = new Contact({
                    key: '123',
                    msisdn: '+27123',
                    user_account: 'user_foo',
                });

                contact.extra.spam = null;

                assert.throws(
                    function() { contact.do.validate(); },
                    function(error) {
                        assert(error instanceof ContactError);
                        assert.equal(
                            error.message,
                            ["Contact extra 'spam' has a value of type 'object'",
                             "instead of 'string': null"].join(' '));

                        return true;
                    });
            });

            it("should throw an error for non-string subscription values",
            function() {
                var contact = new Contact({
                    key: '123',
                    msisdn: '+27123',
                    user_account: 'user_foo',
                });

                contact.subscriptions.conv3 = null;

                assert.throws(
                    function() { contact.do.validate(); },
                    function(error) {
                        assert(error instanceof ContactError);
                        assert.equal(
                            error.message,
                            ["Contact subscription 'conv3' has a value of type",
                             "'object' instead of 'string': null"].join(' '));

                        return true;
                    });
            });
        });
    });

    describe("ContactStore", function() {
        describe(".setup", function() {
            it("should emit a setup event");
        });

        describe(".request", function() {
            it("should makea raw request to the api's contacts resource");
        });

        describe(".get", function() {
            it("should create non-existant contacts if asked");
            it("should accept fall back to the store's delivery class");
        });

        describe(".get_by_key", function() {
            it("should retrieve a contact by its key");
        });

        describe(".for_user", function() {
            it("should create a contact for the user if necessary");
            it("should retrieve the user's contact if it exists");
        });

        describe(".search", function() {
            it("should retrieve the matching contacts");
        });

        describe(".search_keys", function() {
            it("should retrieve the matching keys");
        });

        describe(".save", function() {
            it("should save the given contact");
        });
    });
});
