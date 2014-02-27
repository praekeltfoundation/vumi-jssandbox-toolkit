var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var api = vumigo.contacts.api;
var Contact = api.Contact;
var ContactStore = api.ContactStore;
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
        var im;

        beforeEach(function() {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
            });
        });

        describe(".setup", function() {
            it("should emit a setup event", function() {
                var contacts = new ContactStore();
                var p = contacts.once.resolved('setup');
                return contacts.setup().then(function() {
                    assert(p.isFulfilled());
                });
            });
        });

        describe(".request", function() {
            it("should make a raw request to the api's contacts resource",
            function() {
                im.api.contacts.add({
                    key: '123',
                    surname: 'Jones'
                });

                return im.contacts.request('get_by_key', {
                    key: '123'
                }).then(function(reply) {
                    assert.equal(reply.contact.surname, 'Jones');
                });
            });
        });

        describe(".create", function() {
            it("should create and add a new contact", function() {
                return im.contacts.create({
                    surname: 'Jones',
                    extra: {location: 'CPT'}
                }).then(function(contact) {
                    assert.equal(contact.surname, 'Jones');
                    assert.equal(contact.extra.location, 'CPT');
                    assert.deepEqual(im.api.contacts.store, [contact]);
                });
            });
        });

        describe(".get", function() {
            it("should create non-existent contacts if asked", function() {
                return im
                    .contacts.get('+27123', {
                        create: true,
                        delivery_class: 'ussd'
                    }).then(function(contact) {
                        assert.deepEqual(im.api.contacts.store, [contact]);
                    });
            });

            it("should fall back to the store's delivery class", function() {
                var contacts = new ContactStore(im);
                
                contacts.setup({delivery_class: 'twitter'}).then(function() {
                    return contacts
                        .get('@spam', {create: true})
                        .then(function(contact) {
                            assert.deepEqual(im.api.contacts.store, [contact]);
                        });
                });
            });
        });

        describe(".get_by_key", function() {
            it("should retrieve a contact by its key", function() {
                im.api.contacts.add({key: '123'});

                return im.contacts.get_by_key('123').then(function(contact) {
                    assert.deepEqual(im.api.contacts.store, [contact]);
                });
            });
        });

        describe(".for_user", function() {
            it("should create a contact for the user if necessary",
            function() {
                assert.deepEqual(im.api.contacts.store, []);

                return im.contacts.for_user().then(function(contact) {
                    assert.equal(contact.msisdn, im.user.addr);
                    assert.deepEqual(im.api.contacts.store, [contact]);
                });
            });

            it("should retrieve the user's contact if it exists", function() {
                im.api.contacts.add({msisdn: im.user.addr});

                return im.contacts.for_user().then(function(contact) {
                    assert.equal(contact.msisdn, im.user.addr);
                    assert.deepEqual(im.api.contacts.store, [contact]);
                });
            });
        });

        describe(".search", function() {
            it("should retrieve the matching contacts", function() {
                im.api.contacts.add({
                    key: '123',
                    name: 'Armin'
                });

                im.api.contacts.add({
                    key: '456',
                    name: 'Amon'
                });


                im.api.contacts.search_results['name:"A*"'] = ['123', '456'];

                return im.contacts
                    .search('name:"A*"')
                    .then(function(contacts) {
                        assert.deepEqual(im.api.contacts.store, contacts);
                    });
            });
        });

        describe(".search_keys", function() {
            it("should retrieve the matching keys", function() {
                im.api.contacts.search_results['name:"A*"'] = ['123', '456'];

                return im.contacts
                    .search_keys('name:"A*"')
                    .then(function(keys) {
                        assert.deepEqual(keys, ['123', '456']);
                    });
            });
        });

        describe(".save", function() {
            it("should save the given contact", function() {
                im.api.contacts.add({
                    msisdn: '+27123',
                    name: 'Amon',
                    extras: {foo: 'bar'}
                });

                return im
                    .contacts
                    .get('+27123')
                    .then(function(contact) {
                        contact.extras.foo = 'baz';
                        contact.extras.ham = 'spam';

                        return im.contacts.save(contact).then(function() {
                            assert.deepEqual(im.api.contacts.store, [contact]);
                        });
                    });
            });
        });
    });
});
