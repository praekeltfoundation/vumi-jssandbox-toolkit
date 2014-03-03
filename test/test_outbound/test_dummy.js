var assert = require('assert');

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("outbound.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyOutboundResource", function() {
        describe(".handlers", function() {
            describe(".reply_to", function() {
                it("should record the sent reply message");
                it("should fail if 'content' isn't given");
                it("should fail if 'content' isn't a string or null");
                it("should fail if 'in_reply_to' isn't given");
                it("should fail if 'continue_session' isn't boolean");
            });

            describe(".reply_to_group", function() {
                it("should record the sent reply message");
                it("should fail if 'content' isn't given");
                it("should fail if 'content' isn't a string or null");
                it("should fail if 'in_reply_to' isn't given");
                it("should fail if 'continue_session' isn't boolean");
            });

            describe(".send_to_tag", function() {
                it("should record the sent message");
                it("should fail if 'to_addr' isn't a string");
                it("should fail if 'content' isn't a string");
                it("should fail if 'tag' isn't a string");
                it("should fail if 'tagpool' isn't a string");
            });

            describe(".send_to_endpoint", function() {
                it("should record the sent message");
                it("should fail if 'to_addr' isn't a string");
                it("should fail if 'content' isn't a string");
                it("should fail if 'endpoint' isn't a string");
            });
        });
    });
});
