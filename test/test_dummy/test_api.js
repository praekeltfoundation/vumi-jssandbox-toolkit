var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
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

describe("DummyApi", function () {
    var api;
    var request;

    beforeEach(function () {
        api = new DummyApi();
        request = test_utils.requester(api);
    });

    it("should dispatch commands using its resource controller", function() {
        api.resources.add(new ToyResource());
        return request('toy.foo', {}).then(function(result) {
            assert.deepEqual(result, {
                handler: 'foo',
                cmd: {cmd: 'toy.foo'}
            });
        });
    });
});
