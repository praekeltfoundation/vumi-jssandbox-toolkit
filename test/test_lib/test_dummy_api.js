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
    var reply;

    beforeEach(function () {
        api = new DummyApi();
    });

    var capture_reply = function(reply_cmd) {
        reply = reply_cmd;
    };

    it("should implement contacts.get", function() {
        api.add_contact({msisdn: "+12345", name: "Bob"});
        api.request("contacts.get",
                    {delivery_class: "sms", addr: "+12345"},
                    capture_reply);
        assert.equal(reply.success, true);
        assert.equal(reply.contact.msisdn, "+12345");
        assert.equal(reply.contact.name, "Bob");
        assert.equal(reply.contact.surname, null);
    });
});