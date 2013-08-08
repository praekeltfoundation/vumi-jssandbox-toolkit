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
            assert.equal(reply.success, true)
            assert.equal(reply.cmd, cmd)
            assert.equal(api.logs.pop(), level);
        });
    });
});
