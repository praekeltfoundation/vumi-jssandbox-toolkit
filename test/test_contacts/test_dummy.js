var _ = require('lodash');
var assert = require('assert');

var vumigo = require("../../lib");
var dummy = vumigo.contacts.dummy;
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;
var Contact = vumigo.contacts.api.Contact;


describe("DummyContactsResource", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe(".add", function() {
        describe(".add(contact)", function() {
            it("should add the contact to the store", function() {
                var contact = new Contact({
                    key: '123',
                    msisdn: '+27123',
                    user_account: 'user1'
                });

                api.contacts.add(contact);
                assert.deepEqual(api.contacts.store, [contact]);
            });
        });

        describe(".add(data)", function() {
            it("should add a corresponding contact to the store", function() {
                api.contacts.add({
                    name: 'super',
                    surname: 'rainbow'
                });

                assert(_.find(api.contacts.store, {
                    name: 'super',
                    surname: 'rainbow'
                }));
            });
        });
    });

    describe(".handlers", function() {
        describe(".get", function() {
            it("retrieve the contact if it exists", function() {
                api.contacts.add({msisdn: '+27123'});

                return request('contacts.get', {
                    addr: '27123',
                    delivery_class: 'sms'
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.msisdn, '+27123');
                });
            });

            it("should fail if no contact is found", function() {
                return request('contacts.get', {
                    addr: '+27123',
                    delivery_class: 'sms'
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });

            it("should fail if a bad delivery class is given", function() {
                return request('contacts.get', {
                    addr: '+27123',
                    delivery_class: 'bad'
                }).then(function(result) {
                    assert(!result.success);

                    assert.equal(
                        result.reason,
                        ["Unsupported delivery class",
                         "(got: bad with address +27123)"].join(' '));
                });
            });
        });

        describe(".get_by_key", function() {
            it("retrieve the contact if it exists", function() {
                api.contacts.add({key: '123'});

                return request('contacts.get_by_key', {
                    key: '123',
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.key, '123');
                });
            });

            it("should fail if no contact is found", function() {
                return request('contacts.get_by_key', {
                    key: '123',
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });
        });

        describe(".get_or_create", function() {
            it("retrieve the contact if it exists", function() {
                api.contacts.add({msisdn: '+27123'});

                return request('contacts.get_or_create', {
                    addr: '27123',
                    delivery_class: 'sms'
                }).then(function(result) {
                    assert(result.success);
                    assert(!result.created);
                    assert.equal(result.contact.msisdn, '+27123');
                });
            });

            it("should create a new contact if it does not yet exist",
            function() {
                return request('contacts.get_or_create', {
                    addr: '27123',
                    delivery_class: 'sms'
                }).then(function(result) {
                    assert(result.success);
                    assert(result.created);
                    assert.equal(result.contact.msisdn, '+27123');
                });
            });

            it("should fail if a bad delivery class is given", function() {
                return request('contacts.get_or_create', {
                    addr: '+27123',
                    delivery_class: 'bad'
                }).then(function(result) {
                    assert(!result.success);

                    assert.equal(
                        result.reason,
                        ["Unsupported delivery class",
                         "(got: bad with address +27123)"].join(' '));
                });
            });
        });

        describe(".new", function() {
            it("should create a new contact", function() {
                return request('contacts.new', {
                    contact: {
                        name: 'iggy',
                        surname: 'mop'
                    }
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.name, 'iggy');
                    assert.equal(result.contact.surname, 'mop');
                });
            });
        });

        describe(".save", function() {
            it("should save the contact if it exists", function() {
                api.contacts.add({
                    key: '123',
                    msisdn: '+27123',
                    name: 'nobody'
                });

                return request('contacts.save', {
                    contact: {
                        key: '123',
                        msisdn: '+27123',
                        user_account: 'user1',
                        name: 'somebody'
                    }
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.name, 'somebody');
                });
            });

            it("should fail if the contact does not exist", function() {
                return request('contacts.save', {
                    contact: {
                        key: '123',
                        name: 'nobody'
                    }
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });

            it("should fail if an invalid attributes are given", function() {
                api.contacts.add({key: '123'});

                return request('contacts.save', {
                    contact: {
                        key: '123',
                        msisdn: '+27123',
                        user_account: 'user1',
                        extra: {foo: 3}
                    }
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(
                        result.reason,
                        ["Contact extra 'foo' has a value of type 'number'",
                         "instead of 'string': 3"].join(' '));
                });
            });
        });

        describe(".update", function() {
            it("should update the contact if found", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                    extra: {
                        desk: 'lamp',
                        tennis: 'instructor'
                    }
                });

                return request('contacts.update', {
                    key: '123',
                    fields: {extra: {foo: 'bar'}}
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.name, 'iggy');
                    assert.deepEqual(result.contact.extra, {foo: 'bar'});
                });
            });

            it("should fail if the contact was not found", function() {
                return request('contacts.update', {
                    key: '123',
                    fields: {extra: {foo: 'bar'}}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });

            it("should fail if the update failed", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                });

                return request('contacts.update', {
                    key: '123',
                    fields: {extra: {foo: 3}}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(
                        result.reason,
                        ["Contact extra 'foo' has a value of type 'number'",
                         "instead of 'string': 3"].join(' '));
                });
            });
        });

        describe(".update_extras", function() {
            it("should update the contact if found", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                    extra: {
                        desk: 'lamp',
                        tennis: 'instructor'
                    }
                });

                return request('contacts.update_extras', {
                    key: '123',
                    fields: {foo: 'bar'}
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.name, 'iggy');
                    assert.deepEqual(result.contact.extra, {
                        foo: 'bar',
                        desk: 'lamp',
                        tennis: 'instructor'
                    });
                });
            });

            it("should fail if the contact was not found", function() {
                return request('contacts.update_extras', {
                    key: '123',
                    fields: {extra: {foo: 'bar'}}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });

            it("should fail if the update failed", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                });

                return request('contacts.update_extras', {
                    key: '123',
                    fields: {foo: 3}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(
                        result.reason,
                        ["Contact extra 'foo' has a value of type 'number'",
                         "instead of 'string': 3"].join(' '));
                });
            });
        });

        describe(".update_subscriptions", function() {
            it("should update the contact if found", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                    subscriptions: {
                        conv1: 'counter1',
                        conv2: 'counter2'
                    }
                });

                return request('contacts.update_subscriptions', {
                    key: '123',
                    fields: {conv3: 'counter3'}
                }).then(function(result) {
                    assert(result.success);
                    assert.equal(result.contact.name, 'iggy');
                    assert.deepEqual(result.contact.subscriptions, {
                        conv1: 'counter1',
                        conv2: 'counter2',
                        conv3: 'counter3'
                    });
                });
            });

            it("should fail if the contact was not found", function() {
                return request('contacts.update_subscriptions', {
                    key: '123',
                    fields: {conv3: 'counter3'}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, "Contact not found");
                });
            });

            it("should fail if the update failed", function() {
                api.contacts.add({
                    key: '123',
                    name: 'iggy',
                });

                return request('contacts.update_subscriptions', {
                    key: '123',
                    fields: {conv3: 3}
                }).then(function(result) {
                    assert(!result.success);
                    assert.equal(
                        result.reason,
                        ["Contact subscription 'conv3' has a value of type",
                         "'number' instead of 'string': 3"].join(' '));
                });
            });
        });

        describe(".search", function() {
            it("should return the fixed query results", function() {
                api.contacts.search_results['foo:bar'] = ['1', '2'];

                return request('contacts.search', {
                    query: 'foo:bar',
                }).then(function(result) {
                    assert(result.success);
                    assert.deepEqual(result.keys, ['1', '2']);
                });
            });
        });
    });

    describe(".format_addr", function() {
        it("should format msisdns", function() {
            assert.equal(dummy.format_addr('27123', 'msisdn'), '+27123');
            assert.equal(dummy.format_addr('+27123', 'msisdn'), '+27123');
        });

        it("should format gtalk ids", function() {
            assert.equal(dummy.format_addr('foo/bar', 'gtalk_id'), 'foo');
            assert.equal(dummy.format_addr('foo', 'gtalk_id'), 'foo');
        });

        it("should be a noop for other address types", function() {
            assert.equal(dummy.format_addr('foo', 'unknown_type'), 'foo');
        });
    });

    describe(".infer_addr_type", function() {
        it("should infer the address type for sms", function() {
            assert.equal(dummy.infer_addr_type('sms'), 'msisdn');
        });

        it("should infer the address type for ussd", function() {
            assert.equal(dummy.infer_addr_type('ussd'), 'msisdn');
        });

        it("should infer the address type for gtalk", function() {
            assert.equal(dummy.infer_addr_type('gtalk'), 'gtalk_id');
        });

        it("should infer the address type for twitter", function() {
            assert.equal(dummy.infer_addr_type('twitter'), 'twitter_handle');
        });

        it("should return undefined for unrecognized delivery classes",
        function() {
            assert.equal(
                typeof dummy.infer_addr_type('unknown_type'),
                'undefined');
        });
    });
});
