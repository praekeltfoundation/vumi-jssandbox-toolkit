var assert = require('assert');
var Q = require('q');

var vumigo = require("../../lib");
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

        it("should dispatch commands using its resource controller",
        function() {
            api.resources.add(new ToyResource());
            return api_request('toy.foo', {}).then(function(result) {
                assert.deepEqual(result, {
                    handler: 'foo',
                    cmd: {cmd: 'toy.foo'}
                });
            });
        });
    });
});
