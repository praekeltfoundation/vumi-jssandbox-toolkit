var _ = require('lodash');
var assert = require('assert');

var vumigo = require("../../lib");
var dummy = vumigo.kv.dummy;
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("kv.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyKvResource", function() {
        describe(".incr", function() {
            it("should increment the value if it is an integer");
            it("should use 1 as the fallback increment amount");
            it("should throw an error for non-integer values");
        });

        describe(".handlers", function() {
            describe(".get", function() {
                it("should retrieve the value for the given key");
                it("should return null if the key does not exist");
            });

            describe(".set", function() {
                it("should set the value of the given key");
            });

            describe(".incr", function() {
                it("should fail for non-integer keys");
                it("should use 1 as the fallback increment amount");
                it("should increment the value of the given key");
            });

            describe(".delete", function() {
                it("should delete the give key from the store");
            });
        });
    });
});
