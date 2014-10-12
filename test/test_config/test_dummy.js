var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;


describe("config.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyConfigResource", function() {
        describe(".app", function() {
            it("should be a shortcut to .store.config", function() {
                assert.strictEqual(api.config.store.config, api.config.app);

                api.config.store.config = {};
                assert.strictEqual(api.config.store.config, api.config.app);

                api.config.app = {};
                assert.strictEqual(api.config.store.config, api.config.app);
            });
        });

        describe(".handlers", function() {
            describe(".get", function() {
                it("should return the corresponding value", function() {
                    api.config.store.foo = {bar: 'baz'};

                    return request('config.get', {
                        key: 'foo'
                    }).then(function(reply) {
                        assert.equal(reply.value, '{"bar":"baz"}');
                    });
                });

                it("should return null if the key does not exist", function() {
                    return request('config.get', {
                        key: 'foo'
                    }).then(function(reply) {
                        assert.equal(reply.value, 'null');
                    });
                });

                it("should return the unformatted value if requested",
                function() {
                    api.config.json.foo = false;
                    api.config.store.foo = "<doc>A doc</doc>";
                    return request('config.get', {
                        key: 'foo',
                    }).then(function(reply) {
                        assert.equal(reply.value, '<doc>A doc</doc>');
                    });
                });
            });
        });
    });
});
