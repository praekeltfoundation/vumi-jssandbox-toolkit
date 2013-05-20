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

describe("DummyApi contacts resource", function () {
    var api;

    beforeEach(function () {
        api = new DummyApi();
    });

    var capture_reply = function(cmd_name, cmd) {
        var reply;
        api.request(
            cmd_name, cmd,
            function (reply_cmd) {
                reply = reply_cmd;
            });
        return reply;
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
    });
});