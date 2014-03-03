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
            });

            describe(".reply_to_group", function() {
                it("should record the sent reply message");
            });

            describe(".send_to_tag", function() {
                it("should record the sent message");
            });

            describe(".send_to_endpoint", function() {
                it("should record the sent message");
            });
        });
    });
});
