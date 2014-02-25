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
                    user_account: 'user_foo'
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

                assert(api.contacts.find_where({
                    name: 'super',
                    surname: 'rainbow'
                }));
            });
        });
    });

    describe(".find_where", function() {
        it("should find the contact matching the given attributes", function() {
            api.contacts.add({
                extra: {foo: 'bar'},
                groups: ['group_1']
            });

            api.contacts.add({
                extra: {foo: 'baz'},
                groups: ['group_1']
            });

            var contact_1 = api.contacts.find_where({
                extra: {foo: 'bar'},
                groups: ['group_1']
            });

            var contact_2 = api.contacts.find_where({
                extra: {foo: 'baz'},
                groups: ['group_1']
            });

            assert.deepEqual(contact_1.attrs.extra, {foo: 'bar'});
            assert.deepEqual(contact_1.attrs.groups, ['group_1']);

            assert.deepEqual(contact_2.attrs.extra, {foo: 'baz'});
            assert.deepEqual(contact_1.attrs.groups, ['group_1']);
        });

        it("should return undefined if no contain is found", function() {
            assert.equal(
                typeof api.contacts.find_where({foo: 'bar'}),
                'undefined');
        });
    });

    describe(".handlers", function() {
        describe(".get", function() {
            it("retrieve the contact by if it exists", function() {
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
                        user_account: 'user_foo',
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
