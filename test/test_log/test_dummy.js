var assert = require('assert');

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("log.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyLogResource", function() {
        it("should provide shortcuts for the standard log levels");

        describe(".add", function() {
            it("should ensure the log level is initialised");
            it("should add a log at the given level");
        });

        describe(".handlers", function() {
            describe(".log", function() {
                it("should log a message at the given level");
            });

            describe(".debug", function() {
                it("should log a message at the DEBUG level");
            });

            describe(".info", function() {
                it("should log a message at the INFO level");
            });

            describe(".warning", function() {
                it("should log a message at the WARNING level");
            });

            describe(".error", function() {
                it("should log a message at the ERROR level");
            });

            describe(".critical", function() {
                it("should log a message at the CRITICAL level");
            });
        });
    });
});
