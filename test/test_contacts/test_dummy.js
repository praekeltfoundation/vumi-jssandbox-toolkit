var _ = require('lodash');
var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;
var Contact = vumigo.contacts.api.Contact;
var Group = vumigo.contacts.api.Group;


describe("contacts.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyContactsResource", function() {
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

            describe(".add(attrs)", function() {
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
                    api.contacts.add({
                        msisdn: '+27123',
                        extra: {foo: 'bar'},
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.get', {
                        addr: '27123',
                        delivery_class: 'sms'
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;
                        assert.equal(contact.msisdn, '+27123');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['subscription-conv1'], '1');
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
                    api.contacts.add({
                        key: '123',
                        extra: {foo: 'bar'},
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.get_by_key', {
                        key: '123',
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;
                        assert.equal(contact.key, '123');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['subscription-conv1'], '1');
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
                    api.contacts.add({
                        msisdn: '+27123',
                        extra: {foo: 'bar'},
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.get_or_create', {
                        addr: '27123',
                        delivery_class: 'sms'
                    }).then(function(result) {
                        assert(result.success);
                        assert(!result.created);

                        var contact = result.contact;
                        assert.equal(contact.msisdn, '+27123');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['subscription-conv1'], '1');
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
                            surname: 'mop',
                            extra: {foo: 'bar'},
                            subscription: {conv1: '1'}
                        }
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;
                        assert.equal(contact.name, 'iggy');
                        assert.equal(contact.surname, 'mop');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['subscription-conv1'], '1');
                    });
                });
            });

            describe(".save", function() {
                it("should save the contact if it exists", function() {
                    api.contacts.add({
                        key: '123',
                        msisdn: '+27123',
                        name: 'nobody',
                        extra: {foo: 'bar'},
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.save', {
                        contact: {
                            key: '123',
                            msisdn: '+27123',
                            user_account: 'user1',
                            name: 'somebody',
                            extra: {baz: 'qux'},
                            subscription: {conv2: '2'}
                        }
                    }).then(function(result) {
                        assert(result.success);
                        assert.equal(result.contact.name, 'somebody');

                        var contact = result.contact;
                        assert.equal(contact.name, 'somebody');
                        assert.equal(contact['extras-baz'], 'qux');
                        assert.equal(contact['subscription-conv2'], '2');

                        assert(!('extras-foo' in contact));
                        assert(!('subscription-conv1' in contact));
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
                        },
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.update', {
                        key: '123',
                        fields: {
                            extra: {foo: 'bar'},
                            subscription: {conv2: '2'}
                        }
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;

                        assert.equal(contact.name, 'iggy');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['subscription-conv2'], '2');

                        assert(!('extras-desk' in result.contact));
                        assert(!('extras-tennis' in result.contact));
                        assert(!('subscription-conv1' in contact));
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
                        },
                        subscription: {conv1: '1'}
                    });

                    return request('contacts.update_extras', {
                        key: '123',
                        fields: {foo: 'bar'}
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;
                        assert.equal(contact.name, 'iggy');
                        assert.equal(contact['subscription-conv1'], '1');

                        assert.equal(contact['extras-tennis'], 'instructor');
                        assert.equal(contact['extras-foo'], 'bar');
                        assert.equal(contact['extras-desk'], 'lamp');
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
                        extra: {foo: 'bar'},
                        subscription: {
                            conv1: '1',
                            conv2: '2'
                        }
                    });

                    return request('contacts.update_subscriptions', {
                        key: '123',
                        fields: {conv3: '3'}
                    }).then(function(result) {
                        assert(result.success);

                        var contact = result.contact;
                        assert.equal(contact.name, 'iggy');
                        assert.equal(contact['extras-foo'], 'bar');

                        assert.equal(contact['subscription-conv1'], '1');
                        assert.equal(contact['subscription-conv2'], '2');
                        assert.equal(contact['subscription-conv3'], '3');
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

                it("should return extras as extras-<name>", function() {
                    api.contacts.add({
                        key: '123',
                        name: 'iggy',
                        extra: {foo: 'bar'},
                        subscription: {
                            conv1: 'counter1',
                            conv2: 'counter2'
                        }
                    });

                    return request('contacts.update_subscriptions', {
                        key: '123',
                        fields: {conv3: 'counter3'}
                    }).then(function(result) {
                        assert(!('extra' in result.contact));
                        assert.equal(result.contact['extras-foo'], 'bar');
                    });
                });
            });

            describe(".search", function() {
                it("should return the fixed query results", function() {
                    api.contacts.search_results['name:"Foo"'] = ['1', '2'];

                    return request('contacts.search', {
                        query: 'name:"Foo"',
                    }).then(function(result) {
                        assert(result.success);
                        assert.deepEqual(result.keys, ['1', '2']);
                    });
                });
            });
        });
    });

    describe("DummyGroupsResource", function() {
        describe(".add", function() {
            describe(".add(group)", function() {
                it("should add the group to the store", function() {
                    var group = new Group({
                        key: '123',
                        user_account: 'user1',
                        name: 'cats'
                    });

                    api.groups.add(group);
                    assert.deepEqual(api.groups.store, [group]);
                });
            });

            describe(".add(attrs)", function() {
                it("should add a corresponding group to the store",
                function() {
                    api.groups.add({
                        name: 'cats',
                        query: 'surname:"cat"'
                    });

                    assert.equal(api.groups.store.length, 1);
                    var group = api.groups.store[0];
                    assert(group instanceof Group);
                    assert.equal(group.name, 'cats');
                    assert.equal(group.query, 'surname:"cat"');
                });
            });
        });

        describe(".handlers", function() {
            describe(".get", function() {
                it("retrieve the group if it exists", function() {
                    api.groups.add({
                        key: '123',
                        name: 'cats'
                    });

                    return request('groups.get', {
                        key: '123'
                    }).then(function(result) {
                        assert(result.success);
                        assert.deepEqual(api.groups.store, [result.group]);
                    });
                });

                it("should fail if no group is found", function() {
                    return request('groups.get', {
                        key: '123'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, "Group not found");
                    });
                });
            });

            describe(".get_by_name", function() {
                it("retrieve the group if it exists", function() {
                    api.groups.add({name: 'cats'});

                    return request('groups.get_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(result.success);
                        assert.deepEqual(api.groups.store,  [result.group]);
                    });
                });

                it("should fail if no group is found", function() {
                    return request('groups.get_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, "Group not found");
                    });
                });

                it("should fail if multiple groups were found", function() {
                    api.groups.add({name: 'cats'});
                    api.groups.add({name: 'cats'});

                    return request('groups.get_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, "Multiple groups found");
                    });
                });
            });

            describe(".get_or_create_by_name", function() {
                it("retrieve the group if it exists", function() {
                    api.groups.add({name: 'cats'});

                    return request('groups.get_or_create_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(result.success);
                        assert(!result.created);
                        assert.deepEqual(api.groups.store,  [result.group]);
                    });
                });

                it("should create a new group if it does not yet exist",
                function() {
                    return request('groups.get_or_create_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(result.success);
                        assert(result.created);
                        assert.equal(result.group.name, 'cats');
                        assert.deepEqual(api.groups.store,  [result.group]);
                    });
                });

                it("should fail if multiple groups were found", function() {
                    api.groups.add({name: 'cats'});
                    api.groups.add({name: 'cats'});

                    return request('groups.get_or_create_by_name', {
                        name: 'cats'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, "Multiple groups found");
                    });
                });
            });

            describe(".update", function() {
                it("should update the group if found", function() {
                    api.groups.add({
                        key: '123',
                        name: 'cats'
                    });

                    return request('groups.update', {
                        key: '123',
                        name: 'pandas',
                        query: '"surname:"Panda"'
                    }).then(function(result) {
                        assert(result.success);
                        assert.equal(result.group.name, 'pandas');
                        assert.equal(result.group.query, '"surname:"Panda"');
                        assert.deepEqual([result.group], api.groups.store);
                    });
                });

                it("should fail if the group was not found", function() {
                    return request('groups.update', {
                        key: '123',
                        name: 'pandas',
                        query: '"surname:"Panda"'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, 'Group not found');
                    });
                });

                it("should fail if the update failed", function() {
                    api.groups.add({
                        key: '123',
                        name: 'cats'
                    });

                    return request('groups.update', {
                        key: '123',
                        name: 3
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            ["Group has a name of type 'number' instead of",
                             "'string': 3"].join(' '));
                    });
                });
            });

            describe(".search", function() {
                it("should return the fixed query results", function() {
                    var group1 = api.groups.add({
                        key: '1',
                        name: 'one'
                    });

                    var group2 = api.groups.add({
                        key: '2',
                        name: 'two'
                    });

                    api.groups.add({
                        key: '3',
                        name: 'three'
                    });

                    api.groups.search_results['name:"Foo"'] = ['1', '2'];

                    return request('groups.search', {
                        query: 'name:"Foo"',
                    }).then(function(result) {
                        assert(result.success);
                        assert.deepEqual(result.groups, [group1, group2]);
                    });
                });
            });

            describe(".list", function() {
                it("should list all the stored groups", function() {
                    api.groups.add({
                        key: '1',
                        name: 'one'
                    });

                    api.groups.add({
                        key: '2',
                        name: 'two'
                    });

                    return request('groups.list', {}).then(function(result) {
                        assert(result.success);
                        assert.deepEqual(result.groups, api.groups.store);
                    });
                });
            });

            describe(".count_members", function() {
                it("should return the member count for static groups",
                function() {
                    var cats = api.groups.add({
                        key: '1',
                        name: 'cats'
                    });

                    var pandas = api.groups.add({
                        key: '2',
                        name: 'pandas'
                    });

                    api.contacts.add({groups: [cats.key]});
                    api.contacts.add({groups: [pandas.key]});
                    api.contacts.add({groups: [cats.key, pandas.key]});

                    return request('groups.count_members', {
                        key: '1'
                    }).then(function(result) {
                        assert(result.success);
                        assert(result.count, 2);
                        assert.deepEqual(result.group, cats);
                    });
                });

                it("should return the member count for smart groups",
                function() {
                    api.contacts.search_results['surname:"Cat"'] = ['1', '2'];

                    var group = api.groups.add({
                        key: 'group1',
                        name: 'cats',
                        query: 'surname:"Cat"'
                    });

                    return request('groups.count_members', {
                        key: 'group1'
                    }).then(function(result) {
                        assert(result.success);
                        assert(result.count, 2);
                        assert.deepEqual(result.group, group);
                    });
                });

                it("should fail if no group is found", function() {
                    return request('groups.count_members', {
                        key: 'group1'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, "Group not found");
                    });
                });
            });
        });
    });
});
