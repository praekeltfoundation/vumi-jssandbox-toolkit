var assert = require("assert");
var vumigo = require("../../lib");

var DummyApi = vumigo.dummy_api.DummyApi;


describe("DummyApi (async)", function () {
    var api;

    beforeEach(function () {
        api = new DummyApi();
        api.async = true;
    });

    it("should dispatch commands asynchronously", function(done) {
        var has_reply = false;
        api.request("kv.get", {key: "foo"}, function (reply) {
            has_reply = true;
            assert.equal(reply.success, true);
            assert.equal(reply.value, null);
        });
        // check reply wasn't called immediately
        assert.equal(has_reply, false);
        var p = api.pending_calls_complete();
        p.then(function () {
            assert.equal(has_reply, true);
        })
        .then(done, done);
    });
});

var capture_api_reply = function(api, cmd_name, cmd) {
    var reply;
    api.request(
        cmd_name, cmd,
        function (reply_cmd) {
            reply = reply_cmd;
        });
    return reply;
};


describe("DummyApi contacts resource", function () {
    var api;

    beforeEach(function () {
        api = new DummyApi();
    });

    var capture_reply = function(cmd_name, cmd) {
        return capture_api_reply(api, cmd_name, cmd);
    };

    var assert_fails = function(cmd_name, cmd, reason) {
        var reply = capture_reply(cmd_name, cmd);
        assert.equal(reply.success, false);
        assert.equal(reply.reason, reason);
    };

    it("contacts.get should retrieve existing contacts", function() {
        api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.get", {delivery_class: "sms", addr: "+12345"});
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, "Bob");
        assert.equal(reply.contact.surname, null);
    });

    it("contacts.get should fail to find non-existant contacts", function() {
        assert_fails("contacts.get", {delivery_class: "sms", addr: "+12345"},
                     "Contact not found");
    });

    it("contacts.get_or_create should retrieve existing contacts", function() {
        api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.get_or_create", {delivery_class: "sms", addr: "+12345"});
        assert.equal(reply.success, true);
        assert.equal(reply.created, false);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, "Bob");
        assert.equal(reply.contact.surname, null);
    });

    it("contacts.get_or_create should create new contacts", function() {
        var reply = capture_reply(
            "contacts.get_or_create", {delivery_class: "sms", addr: "+12345"});
        assert.equal(reply.success, true);
        assert.equal(reply.created, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, null);
        assert.equal(reply.contact.surname, null);
        assert.equal(api.contact_store[reply.contact.key].msisdn, "+12345");
    });

    it("contacts.update should update existing contacts", function() {
        var contact = api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.update", {
                key: contact.key,
                fields: {
                    name: "Bob",
                    surname: "Smith"
                }
            });
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, "Bob");
        assert.equal(reply.contact.surname, "Smith");
        assert.equal(contact.name, "Bob");
        assert.equal(contact.surname, "Smith");
    });

    it("contacts.update should fail to update non-existant contacts", function() {
        assert_fails("contacts.update", {key: "unknown", fields: {}},
                     "Contact not found");
    });

    it("contacts.update_extras should update existing contacts", function() {
        var contact = api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.update_extras", {
                key: contact.key,
                fields: {
                    foo: "Foo",
                    bar: "Bar",
                }
            });
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact['extras-foo'], "Foo");
        assert.equal(reply.contact['extras-bar'], "Bar");
        assert.equal(contact['extras-foo'], "Foo");
        assert.equal(contact['extras-bar'], "Bar");
    });

    it("contacts.update_extras should fail to update non-existant contacts", function() {
        assert_fails("contacts.update_extras", {key: "unknown", fields: {}},
                     "Contact not found");
    });

    it("contacts.update_subscriptions should update existing contacts", function() {
        var contact = api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.update_subscriptions", {
                key: contact.key,
                fields: {
                    foo: "Foo",
                    bar: "Bar",
                }
            });
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact['subscription-foo'], "Foo");
        assert.equal(reply.contact['subscription-bar'], "Bar");
        assert.equal(contact['subscription-foo'], "Foo");
        assert.equal(contact['subscription-bar'], "Bar");
    });

    it("contacts.update_subscriptions should fail to update non-existant contacts", function() {
        assert_fails("contacts.update_subscriptions", {key: "unknown", fields: {}},
                     "Contact not found");
    });

    it("contacts.new should create new contacts", function() {
        var reply = capture_reply(
            "contacts.new", {
                contact: {
                    name: "Bob",
                    surname: "Smith",
                    msisdn: "+12345"
                }
            });
        assert.equal(reply.success, true);
        assert.equal(reply.contact.name, "Bob");
        assert.equal(reply.contact.surname, "Smith");
        assert.equal(reply.contact.msisdn, "+12345");
        var contact = api.find_contact("sms", "+12345");
        assert.equal(contact.name, "Bob");
        assert.equal(contact.surname, "Smith");
        assert.equal(contact.msisdn, "+12345");
    });

    it("contacts.save should save existing contacts", function() {
        var contact = api.add_contact({msisdn: "+12345", name: "Bob"});
        var reply = capture_reply(
            "contacts.save", {
                contact: {
                    key: contact.key,
                    msisdn: "+12345",
                    name: "Robert",
                    surname: "Smith",
                }
            });
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, "Robert");
        assert.equal(reply.contact.surname, "Smith");
        contact = api.contact_store[contact.key];
        assert.equal(contact.msisdn, "+12345");
        assert.equal(contact.name, "Robert");
        assert.equal(contact.surname, "Smith");
    });

    it("contacts.save should fail for non-existant contacts", function () {
        assert_fails("contacts.save", {contact: {key: "unknown"}},
                     "Contact not found");
    });
});

describe("DummyApi logging resource", function () {
    var api;

    beforeEach(function () {
        api = new DummyApi();
    });

    var capture_reply = function(cmd_name, cmd) {
        return capture_api_reply(api, cmd_name, cmd);
    };

    it('should log calls on the known levels', function() {
        var levels = ['info', 'debug', 'warning', 'error', 'critical'];
        levels.forEach(function(level) {
            var cmd = 'log.' + level;
            var reply = capture_reply(cmd, {msg: level});
            assert.equal(reply.success, true);
            assert.equal(reply.cmd, cmd);
            assert.equal(api.logs.pop(), level);
        });
    });
});

describe('DummyApi Groups resource', function() {
    var api;

    beforeEach(function() {
        api = new DummyApi();
    });

    var capture_reply = function(cmd_name, cmd) {
        return capture_api_reply(api, cmd_name, cmd);
    };

    var assert_fails = function(cmd_name, cmd, reason) {
        var reply = capture_reply(cmd_name, cmd);
        assert.equal(reply.success, false);
        assert.equal(reply.reason, reason);
    };

    it('should provide groups.count_members for static groups', function() {
        api.add_group({key: 'group-1'});
        api.add_contact({groups:['group-1']});
        var reply = capture_reply(
            "groups.count_members", {key: 'group-1'});
        assert.equal(reply.success, true);
        assert.equal(reply.count, 1);
    });

    it('should provide groups.count_members for smart groups', function() {
        api.add_group({key: 'group-1', query: 'foo'});
        api.set_smart_group_query_results('foo', ['contact-1', 'contact-2']);
        var reply = capture_reply(
            "groups.count_members", {key: 'group-1'});
        assert.equal(reply.success, true);
        assert.equal(reply.count, 2);
    });

    it('should provide groups.get', function() {
        api.add_group({key: 'group-1', name: 'Group 1'});
        var reply = capture_reply(
            'groups.get', {key: 'group-1'});
        assert.equal(reply.success, true);
        assert.equal(reply.group.key, 'group-1');
        assert.equal(reply.group.name, 'Group 1');
    });

    it('should provide groups.get_by_name', function() {
        api.add_group({key: 'group-1', name: 'Group 1'});
        api.add_group({key: 'group-2', name: 'Foo Group'});
        api.add_group({key: 'group-3', name: 'Foo Group'});

        var reply = capture_reply(
            'groups.get_by_name', {name: 'Group 1'});
        assert.equal(reply.success, true);
        assert.equal(reply.group.key, 'group-1');
        assert.equal(reply.group.name, 'Group 1');

        reply = capture_reply(
            'groups.get_by_name', {name: 'Foo Group'});
        assert.equal(reply.success, false);
        assert.equal(reply.reason, 'Multiple groups found');

        reply = capture_reply(
            'groups.get_by_name', {name: 'Bar Group'});
        assert.equal(reply.success, false);
        assert.equal(reply.reason, 'Group not found');
    });

    it('should provide groups.get_or_create_by_name', function() {
        var reply = capture_reply(
            'groups.get_or_create_by_name', {name: 'Group 1'});
        assert.equal(reply.success, true);
        assert.equal(reply.created, true);
        assert.equal(reply.group.name, 'Group 1');

        var created_key = reply.group.key;

        reply = capture_reply(
            'groups.get_or_create_by_name', {name: 'Group 1'});
        assert.equal(reply.success, true);
        assert.equal(reply.created, false);
        assert.equal(reply.group.name, 'Group 1');
        assert.equal(reply.group.key, created_key);
    });

    it('should provide groups.list', function() {
        api.add_group({key: 'group-1', name: 'Group 1'});
        api.add_group({key: 'group-2', name: 'Group 2'});
        var reply = capture_reply('groups.list', {});
        assert.equal(reply.success, true);
        assert.equal(reply.groups[0].key, 'group-1');
        assert.equal(reply.groups[1].key, 'group-2');
    });

    it('should provide groups.search', function() {
        api.add_group({key: 'group-1', name: 'Group 1'});
        api.add_group({key: 'group-2', name: 'Group 2'});
        api.set_group_search_results('query 1', ['group-1', 'group-2']);
        var reply = capture_reply('groups.search', {query: 'query 1'});
        assert.equal(reply.success, true);
        assert.equal(reply.groups[0].key, 'group-1');
        assert.equal(reply.groups[1].key, 'group-2');

        reply = capture_reply('groups.search', {query: 'no-results'});
        assert.equal(reply.success, true);
        assert.equal(reply.groups.length, 0);
    });

    it('should provide groups.update', function() {
        api.add_group({key: 'group-1', name: 'Group 1'});
        var reply = capture_reply('groups.update', {
            key: 'group-1',
            name: 'Foo Group'
        });
        assert.equal(reply.success, true);
        assert.equal(reply.group.name, 'Foo Group');
        assert.equal(api.group_store['group-1'].name, 'Foo Group');
    });

});