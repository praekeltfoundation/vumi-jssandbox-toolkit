var assert = require('assert');
var Q = require('q');

var vumigo = require('../../lib');
var DummyApi = vumigo.dummy.api.DummyApi;
var DummyResource = vumigo.dummy.resources.DummyResource;


var ToyResource = DummyResource.extend(function(self) {
    DummyResource.call(self);

    self.name = 'toy';

    self.handlers.foo = function(cmd) {
        return {
            handler: 'foo',
            cmd: cmd
        };
    };
});


describe("dummy.api", function() {
    describe("DummyApi", function () {
        var api;

        function api_request(name, data) {
            var d = Q.defer();

            api.request(name, data, function(reply) {
                d.resolve(reply);
            });

            return d.promise;
        }

        beforeEach(function () {
            api = new DummyApi();
        });

        // TODO remove when pending_calls_complete is removed
        it.skip("should dispatch commands asynchronously", function() {
            var has_reply = false;

            api_request("kv.get", {key: "foo"}).then(function (reply) {
                has_reply = true;
                assert(reply.success);
                assert.equal(reply.value, null);
            });

            // check reply wasn't called immediately
            assert(!has_reply);
            return api.pending_calls_complete().then(function () {
                assert(has_reply);
            });
        });

        it("should dispatch commands using its resource controller when possible",
        function() {
            api.resources.add(new ToyResource());
            return api_request('toy.foo', {}).then(function(result) {
                assert.deepEqual(result, {
                    handler: 'foo',
                    cmd: {cmd: 'toy.foo'}
                });
            });
        });

        describe(".find_contact", function() {
            it("should fail for unknown address types", function() {
                assert.throws(
                    function () { api.find_contact("unknown", "+12334"); },
                    "/Unsupported delivery class " +
                    "(got: unknown with address +12334)/");
            });
        });
    });
});
