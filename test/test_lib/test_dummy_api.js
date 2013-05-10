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