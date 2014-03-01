var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;
var DummyResourceError = vumigo.dummy.resources.DummyResourceError;


describe("kv.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyKvResource", function() {
        describe(".incr", function() {
            it("should increment the value if it is an integer", function() {
                api.kv.store.foo = 2;
                assert.strictEqual(api.kv.incr('foo', 6), 8);
                assert.equal(api.kv.store.foo, 8);
            });

            it("should use 1 as the default increment amount", function() {
                api.kv.store.foo = 2;
                assert.strictEqual(api.kv.incr('foo'), 3);
                assert.equal(api.kv.store.foo, 3);
            });

            it("should throw an error for non-integer values", function() {
                api.kv.store.foo = 'bar';

                assert.throws(
                    function() {
                        api.kv.incr('foo');
                    },
                    function(e) {
                        assert(e instanceof DummyResourceError);
                        assert.equal(
                            e.message,
                            ["Cannot increment non-integer value for key",
                             "'foo': bar"].join(' '));

                        return true;
                    });
            });

            it("should throw an error for non-integer amount", function() {
                api.kv.store.foo = 2;

                assert.throws(
                    function() {
                        api.kv.incr('foo', 'bar');
                    },
                    function(e) {
                        assert(e instanceof DummyResourceError);
                        assert.equal(
                            e.message,
                            ["Non-integer increment amount given for key",
                             "'foo': bar"].join(' '));

                        return true;
                    });
            });
        });

        describe(".handlers", function() {
            describe(".get", function() {
                it("should retrieve the value for the given key", function() {
                    api.kv.store.foo = 'bar';

                    return request('kv.get', {
                        key: 'foo'
                    }).then(function(reply) {
                        assert(reply.success);
                        assert.equal(reply.value, 'bar');
                    });
                });

                it("should return null if the key does not exist", function() {
                    return request('kv.get', {
                        key: 'foo'
                    }).then(function(reply) {
                        assert(reply.success);
                        assert.strictEqual(reply.value, null);
                    });
                });
            });

            describe(".set", function() {
                it("should set the value of the given key", function() {
                    return request('kv.set', {
                        key: 'foo',
                        value: 'bar'
                    }).then(function(reply) {
                        assert(reply.success);
                        assert.equal(api.kv.store.foo, 'bar');
                    });
                });
            });

            describe(".incr", function() {
                it("should increment the value of the given key", function() {
                    api.kv.store.foo = 2;

                    return request('kv.incr', {
                        key: 'foo',
                        amount: 6
                    }).then(function(reply) {
                        assert(reply.success);
                        assert.equal(reply.value, 8);
                        assert.equal(api.kv.store.foo, 8);
                    });
                });

                it("should use 1 as the default increment amount", function() {
                    api.kv.store.foo = 2;

                    return request('kv.incr', {
                        key: 'foo',
                    }).then(function(reply) {
                        assert(reply.success);
                        assert.equal(reply.value, 3);
                        assert.equal(api.kv.store.foo, 3);
                    });
                });

                it("should fail for non-integer keys", function() {
                    api.kv.store.foo = 'bar';

                    return request('kv.incr', {
                        key: 'foo',
                    }).then(function(reply) {
                        assert(!reply.success);
                        assert.equal(
                            reply.reason,
                            ["Cannot increment non-integer value for key",
                             "'foo': bar"].join(' '));
                    });
                });

                it("should fail for non-integer amounts", function() {
                    api.kv.store.foo = 2;

                    return request('kv.incr', {
                        key: 'foo',
                        amount: 'bar'
                    }).then(function(reply) {
                        assert(!reply.success);
                        assert.equal(
                            reply.reason,
                            ["Non-integer increment amount given for key",
                             "'foo': bar"].join(' '));
                    });
                });
            });

            describe(".delete", function() {
                it("should delete the give key from the store", function() {
                    api.kv.store.foo = 'bar';

                    return request('kv.delete', {
                        key: 'foo',
                    }).then(function(reply) {
                        assert(reply.success);
                        assert(!('foo' in api.kv.store));
                    });
                });

                it("should reply with whether the key existed", function() {
                    api.kv.store.foo = 'bar';

                    return Q.all([
                        request('kv.delete', {key: 'foo'}),
                        request('kv.delete', {key: 'bar'})
                    ]).spread(function(reply1, reply2) {
                        assert(reply1.success);
                        assert(reply1.existed);

                        assert(reply2.success);
                        assert(!reply2.existed);
                    });
                });
            });
        });
    });
});
