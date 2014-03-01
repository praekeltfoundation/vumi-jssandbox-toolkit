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
        it("should provide a shortcut for DEBUG", function() {
            api.log.debug.push('foo');
            assert.deepEqual(api.log.store[10], ['foo']);
        });

        it("should provide a shortcut for INFO", function() {
            api.log.info.push('foo');
            assert.deepEqual(api.log.store[20], ['foo']);
        });

        it("should provide a shortcut for WARNING", function() {
            api.log.warning.push('foo');
            assert.deepEqual(api.log.store[30], ['foo']);
        });

        it("should provide a shortcut for ERROR", function() {
            api.log.error.push('foo');
            assert.deepEqual(api.log.store[40], ['foo']);
        });

        it("should provide a shortcut for CRITICAL", function() {
            api.log.critical.push('foo');
            assert.deepEqual(api.log.store[50], ['foo']);
        });

        describe(".add", function() {
            it("should ensure the log level is initialised", function() {
                assert(!(42 in api.log.store));
                api.log.add(42, 'foo');
                assert(42 in api.log.store);
            });

            it("should add a log at the given level", function() {
                api.log.add(23, 'foo');
                api.log.add(42, 'bar');
                api.log.add(42, 'baz');

                assert.deepEqual(api.log.store[23], ['foo']);
                assert.deepEqual(api.log.store[42], ['bar', 'baz']);
            });
        });

        describe(".handlers", function() {
            describe(".log", function() {
                it("should log a message at the given level", function() {
                    return request('log.log', {
                        level: 42,
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.store[42], ['foo']);
                    });
                });
            });

            describe(".debug", function() {
                it("should log a message at the DEBUG level", function() {
                    return request('log.debug', {
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.debug, ['foo']);
                    });
                });
            });

            describe(".info", function() {
                it("should log a message at the INFO level", function() {
                    return request('log.info', {
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.info, ['foo']);
                    });
                });
            });

            describe(".warning", function() {
                it("should log a message at the WARNING level", function() {
                    return request('log.warning', {
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.warning, ['foo']);
                    });
                });
            });

            describe(".error", function() {
                it("should log a message at the ERROR level", function() {
                    return request('log.error', {
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.error, ['foo']);
                    });
                });
            });

            describe(".critical", function() {
                it("should log a message at the CRITICAL level", function() {
                    return request('log.critical', {
                        msg: 'foo'
                    }).then(function() {
                        assert.deepEqual(api.log.critical, ['foo']);
                    });
                });
            });
        });
    });
});
