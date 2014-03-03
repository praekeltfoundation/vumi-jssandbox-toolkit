var assert = require('assert');

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("outbound.api", function() {
    describe("OutboundHelper", function() {
        describe(".setup", function() {
            it("should emit a 'setup' event");
        });

        describe(".send_to", function() {
            describe(".send_to(to_addr, endpoint)", function() {
                it("should send to the given address");
            });

            describe(".send_to(contact, endpoint, opts)", function() {
                it("should send to the given contact");
                it("should fall back to the configured delivery class");
                it("should finally fall back to the helper's delivery class");
            });
        });

        describe(".send_to_user", function() {
            it("should send to the user");
        });
    });
});
