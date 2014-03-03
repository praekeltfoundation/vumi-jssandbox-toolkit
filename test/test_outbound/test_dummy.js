var assert = require('assert');

var vumigo = require('../../lib');
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
                it("should record the sent reply message", function() {
                    return request('outbound.reply_to', {
                        content: 'foo',
                        in_reply_to: '123',
                        continue_session: false
                    }).then(function(result) {
                        assert(result.success);
                        assert.equal(api.outbound.store.length, 1);

                        var message = api.outbound.store[0];
                        assert.deepEqual(message, {
                            content: 'foo',
                            in_reply_to: '123',
                            continue_session: false
                        });
                    });
                });

                it("should fail if 'content' isn't given", function() {
                    return request('outbound.reply_to', {
                        in_reply_to: '123',
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'content' must be given in replies");
                    });
                });

                it("should fail if 'content' isn't a string or null",
                function() {
                    return request('outbound.reply_to', {
                        content: 3,
                        in_reply_to: '123',
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'content' must be a string or null");
                    });
                });

                it("should fail if 'in_reply_to' isn't given", function() {
                    return request('outbound.reply_to', {
                        content: 'foo'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'in_reply_to' must be given in replies");
                    });
                });

                it("should fail if 'continue_session' isn't boolean",
                function() {
                    return request('outbound.reply_to', {
                        content: 'foo',
                        in_reply_to: '123',
                        continue_session: 3
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            ["'continue_session' must be either true or false",
                             "if given"].join(' '));
                    });
                });
            });

            describe(".reply_to_group", function() {
                it("should record the sent reply message", function() {
                    return request('outbound.reply_to_group', {
                        content: 'foo',
                        in_reply_to: '123',
                        continue_session: false
                    }).then(function(result) {
                        assert(result.success);
                        assert.equal(api.outbound.store.length, 1);

                        var message = api.outbound.store[0];
                        assert.deepEqual(message, {
                            group: true,
                            content: 'foo',
                            in_reply_to: '123',
                            continue_session: false
                        });
                    });
                });

                it("should fail if 'content' isn't given", function() {
                    return request('outbound.reply_to_group', {
                        in_reply_to: '123',
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'content' must be given in replies");
                    });
                });

                it("should fail if 'content' isn't a string or null",
                function() {
                    return request('outbound.reply_to_group', {
                        content: 3,
                        in_reply_to: '123',
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'content' must be a string or null");
                    });
                });

                it("should fail if 'in_reply_to' isn't given", function() {
                    return request('outbound.reply_to_group', {
                        content: 'foo'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'in_reply_to' must be given in replies");
                    });
                });

                it("should fail if 'continue_session' isn't boolean",
                function() {
                    return request('outbound.reply_to_group', {
                        content: 'foo',
                        in_reply_to: '123',
                        continue_session: 3
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            ["'continue_session' must be either true or false",
                             "if given"].join(' '));
                    });
                });
            });

            describe(".send_to_tag", function() {
                it("should fail with a deprecation error", function() {
                    return request('outbound.send_to_tag', {
                        content: 'foo',
                        to_addr: '+27123',
                        endpoint: 'sms'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(result.reason, [
                            "send_to_tag is no longer supported,",
                            "please use send_to_endpoint instead"
                        ].join(' '));
                    });
                });
            });

            describe(".send_to_endpoint", function() {
                it("should record the sent message", function() {
                    return request('outbound.send_to_endpoint', {
                        content: 'foo',
                        to_addr: '+27123',
                        endpoint: 'sms'
                    }).then(function(result) {
                        assert(result.success);
                        assert.equal(api.outbound.store.length, 1);

                        var message = api.outbound.store[0];
                        assert.deepEqual(message, {
                            content: 'foo',
                            to_addr: '+27123',
                            endpoint: 'sms'
                        });
                    });
                });

                it("should fail if 'to_addr' isn't a string", function() {
                    return request('outbound.send_to_endpoint', {
                        content: 'foo',
                        to_addr: null,
                        endpoint: 'sms'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'to_addr' needs to be a string");
                    });
                });

                it("should fail if 'content' isn't a string or null",
                function() {
                    return request('outbound.send_to_endpoint', {
                        content: 3,
                        to_addr: '+27123',
                        endpoint: 'sms'
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'content' needs to be a string or null");
                    });
                });

                it("should fail if 'endpoint' isn't a string", function() {
                    return request('outbound.send_to_endpoint', {
                        content: 'foo',
                        to_addr: '+27123',
                        endpoint: null,
                    }).then(function(result) {
                        assert(!result.success);
                        assert.equal(
                            result.reason,
                            "'endpoint' needs to be a string");
                    });
                });
            });
        });
    });
});
