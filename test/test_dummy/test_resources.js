var assert = require("assert");

var api = require("../../lib/dummy/api");
var DummyApi = api.DummyApi;

var resources = require("../../lib/dummy/resources");
var DummyResourceError = resources.DummyResourceError;
var DummyResource = resources.DummyResource;
var DummyResources = resources.DummyResources;


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

var AnotherToyResource = DummyResource.extend(function(self) {
    DummyResource.call(self);

    self.name = 'another_toy';

    self.handlers.foo = function(cmd) {
        return {
            handler: 'foo',
            cmd: cmd
        };
    };
});

var BadToyResource = DummyResource.extend(function(self) {
    DummyResource.call(self);

    self.name = 'bad_toy';

    self.handlers.foo = function(cmd) {
        throw new Error(':(');
    };
});

describe("DummyResources", function() {
    describe(".add", function() {
        it("should add the resource", function() {
            var resources = new DummyResources();
            var resource = new ToyResource();
            resources.add(resource);
            assert.strictEqual(resources.get('toy'), resource);
        });

        it("should throw an error if the resource already exists", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource());

            assert.throws(function() {
                resources.add(new ToyResource());
            }, DummyResourceError);
        });
    });

    describe(".get", function() {
        it("should get the resource", function() {
            var resources = new DummyResources();
            var resource = new ToyResource();
            resources.add(resource);
            assert.strictEqual(resources.get('toy'), resource);
        });

        it("should throw an error if the resource does not exist", function() {
            var resources = new DummyResources();

            assert.throws(function() {
                resources.get('toy');
            }, DummyResourceError);
        });
    });

    describe(".can_handle", function() {
        it("should determine whether a command can be handled", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource());
            assert(resources.can_handle({cmd: 'toy.foo'}));
            assert(!resources.can_handle({cmd: 'toy.bar'}));
        });
    });

    describe(".handle", function() {
        it("should delegate to the correct resource handler", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource());

            return resources
                .handle({cmd: 'toy.foo'})
                .then(function(result) {
                    assert.deepEqual(result, {
                        handler: 'foo',
                        cmd: {cmd: 'toy.foo'}
                    });
                });
        });

        it("should fail if no such resource exists", function() {
            var resources = new DummyResources();
            return resources
                .handle({cmd: 'toy.foo'})
                .then(function(result) {
                    assert(!result.success);
                });
        });

        it("should fail if no such handler exists", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource());

            return resources
                .handle({cmd: 'toy.bar'})
                .then(function(result) {
                    assert(!result.success);
                });
        });

        it("should treat unhandled exceptions as failure replies", function() {
            var resources = new DummyResources();
            resources.add(new BadToyResource());

            return resources
                .handle({cmd: 'bad_toy.foo'})
                .then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, ':(');
                });
        });
    });

    describe(".attach", function() {
        it("should attach its resources to the api", function() {
            var api = new DummyApi();
            var resources = new DummyResources();
            resources.add(new ToyResource());
            resources.add(new AnotherToyResource());
            resources.attach(api);
            assert.strictEqual(api.toy, resources.get('toy'));
            assert.strictEqual(api.another_toy, resources.get('another_toy'));
        });
    });
});
