var assert = require('assert');
var vumigo = require('../lib');
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("test_utils", function() {
    describe(".requester", function() {
        describe("the returned function", function() {
            it("should return a promise fulfilled with the api result",
            function() {
                var api = new DummyApi();
                var request = test_utils.requester(api);

                return request('log.info', {
                    msg: 'foo'
                }).then(function(result) {
                    assert(result.success);
                    assert.deepEqual(api.log.info, ['foo']);
                });
            });
        });
    });
});
