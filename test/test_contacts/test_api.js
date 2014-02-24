var assert = require("assert");

var vumigo = require("../../lib");
var api = vumigo.contacts.api;
var Contact = api.Contact;
var ContactError = api.ContactError;


describe("Contact", function() {
    describe(".reset", function() {
        it("should reset the contact using the given attributes", function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
                extra: {ham: 'spam'},
                groups: ['foo']
            });

            contact.reset({
                key: '123',
                user_account: 'user_foo',
                groups: ['bar']
            });

            assert.deepEqual(contact.serialize(), {
                key: '123',
                user_account: 'user_foo',
                extra: {},
                groups: ['bar']
            });
        });

        it("should re-validate the contact", function() {
            var validated = false;

            var contact = new Contact({
                key: '123',
                user_account: 'user_foo'
            });

            contact.validate = function() {
                validated = true;
            };

            assert(!validated);
            contact.reset({
                key: '123',
                user_account: 'user_foo',
                extra: {ham: 'spam'}
            });
            assert(validated);
        });
    });

    describe(".validate", function() {
        it("should throw an error for non-string groups", function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
            });

            contact.attrs.groups.push(null);

            assert.throws(
                function() { contact.validate(); },
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
                user_account: 'user_foo',
            });

            contact.attrs.extra.spam = null;

            assert.throws(
                function() { contact.validate(); },
                function(error) {
                    assert(error instanceof ContactError);
                    assert.equal(
                        error.message,
                        ["Contact extra 'spam' has a value of type 'object'",
                         "instead of 'string': null"].join(' '));

                    return true;
                });
        });
    });

    describe(".serialize", function() {
        it("should validate the contact", function() {
            var validated = false;

            var contact = new Contact({
                key: '123',
                user_account: 'user_foo'
            });

            contact.validate = function() {
                validated = true;
            };

            assert(!validated);
            contact.serialize();
            assert(validated);
        });

        it("should serialize the contact", function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });

            assert.deepEqual(contact.serialize(), {
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });
        });

        it("should return a shallow copy of the contact's attributes",
        function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });

            var data = contact.serialize();
            data.key = '456';

            assert.deepEqual(contact.attrs, {
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });
        });

        it("should return a shallow copy of the contact's groups",
        function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });

            var data = contact.serialize();
            data.groups.push('group_2');

            assert.deepEqual(
                contact.attrs.groups,
                ['group_1']);
        });

        it("should return a shallow copy of the contact's extras",
        function() {
            var contact = new Contact({
                key: '123',
                user_account: 'user_foo',
                groups: ['group_1'],
                extra: {ham: 'spam'}
            });

            var data = contact.serialize();
            data.extra.lamb = 'ram';

            assert.deepEqual(
                contact.attrs.extra,
                {ham: 'spam'});
        });
    });
});
