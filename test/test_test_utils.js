var assert = require('assert');
var vumigo = require("../lib");
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("test_utils", function() {
    describe(".requester", function() {
        describe("the returned function", function() {
            it("should return a promise fulfilled with the api result",
            function() {
                var api = new DummyApi();
                var request = test_utils.requester(api);

                var p = request('log.info', {msg: 'foo'});
                return p.then(function(result) {
                    assert.deepEqual(result, {
                        success: true,
                        cmd: 'log.info'
                    });

                    assert.deepEqual(api.logs, ['foo']);
                });
            });
        });
    });
});
