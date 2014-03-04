var assert = require('assert');
var vumigo = require("../lib");
var fixtures = vumigo.fixtures;
var test_utils = vumigo.test_utils;

var App = vumigo.App;
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

    describe(".make_im", function() {
        it("should allow a DummyApi instance to be given", function() {
            var api = new DummyApi({config: fixtures.config()});

            return test_utils.make_im({
                api: api
            }).then(function(im) {
                assert.strictEqual(im.api, api);
            });
        });

        it("should allow options to be given for a new DummyApi", function() {
            var config = fixtures.config();
            config.name = 'test_foo';

            return test_utils.make_im({
                api: {config: config}
            }).then(function(im) {
                assert.deepEqual(im.api.config.store, config);
            });
        });

        it("should allow the the im's message to be configured", function() {
            var msg = fixtures.msg();
            msg.content = 'foo';

            return test_utils.make_im({
                msg: msg
            }).then(function(im) {
                assert.strictEqual(im.msg, msg);
            });
        });

        it("should allow the app to be given", function() {
            var app = new App('foo');

            return test_utils.make_im({
                app: app
            }).then(function(im) {
                assert.strictEqual(im.app, app);
            });
        });
    });
});
