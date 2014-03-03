var assert = require("assert");

var vumigo = require("../../lib");
var DummyApi = vumigo.dummy.api.DummyApi;
var DummyResource = vumigo.dummy.resources.DummyResource;
var DummyResources = vumigo.dummy.resources.DummyResources;
var DummyResourceError = vumigo.dummy.resources.DummyResourceError;


var ToyResource = DummyResource.extend(function(self, name) {
    DummyResource.call(self, name);

    self.handlers.foo = function(cmd) {
        return {
            handler: 'foo',
            cmd: cmd
        };
    };
});

var BadToyResource = DummyResource.extend(function(self, name) {
    DummyResource.call(self, name);

    self.handlers.foo = function(cmd) {
        throw new Error(':(');
    };
});

describe("DummyResource", function() {
    describe(".handle", function() {
        it("should delegate to the corresponding handling", function() {
            var resource = new ToyResource('toy');

            return resource
                .handle({cmd: 'toy.foo'})
                .then(function(result) {
                    assert.deepEqual(result, {
                        handler: 'foo',
                        cmd: {cmd: 'toy.foo'}
                    });
                });
        });

        it("should fail if there is no handler for the command", function() {
            var resource = new ToyResource('toy');

            return resource
                .handle({cmd: 'toy.bar'})
                .then(function(result) {
                    assert(!result.success);
                });
        });

        it("should treat unhandled exceptions as failure replies", function() {
            var resource = new BadToyResource('bad_toy');

            return resource
                .handle({cmd: 'bad_toy.foo'})
                .then(function(result) {
                    assert(!result.success);
                    assert.equal(result.reason, ':(');
                });
        });
    });
});

describe("DummyResources", function() {
    describe(".add", function() {
        it("should add the resource", function() {
            var resources = new DummyResources();
            var resource = new ToyResource('toy');
            resources.add(resource);
            assert.strictEqual(resources.get('toy'), resource);
        });

        it("should throw an error if the resource already exists", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource('toy'));

            assert.throws(function() {
                resources.add(new ToyResource('toy'));
            }, DummyResourceError);
        });
    });

    describe(".get", function() {
        it("should get the resource", function() {
            var resources = new DummyResources();
            var resource = new ToyResource('toy');
            resources.add(resource);
            assert.strictEqual(resources.get('toy'), resource);
        });
    });

    describe(".has_resource_for", function() {
        it("should determine whether there is a resource for the command",
        function() {
            var resources = new DummyResources();
            resources.add(new ToyResource('toy'));
            assert(resources.has_resource_for({cmd: 'toy.foo'}));
            assert(!resources.has_resource_for({cmd: 'spam.foo'}));
        });
    });

    describe(".handle", function() {
        it("should delegate to the correct resource handler", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource('toy'));

            return resources
                .handle({cmd: 'toy.foo'})
                .then(function(result) {
                    assert.deepEqual(result, {
                        handler: 'foo',
                        cmd: {cmd: 'toy.foo'}
                    });
                });
        });

        it("should fail if there is no resource for the command", function() {
            var resources = new DummyResources();

            return resources
                .handle({cmd: 'toy.foo'})
                .then(function(result) {
                    assert(!result.success);
                });
        });

        it("should fail if there is no handler for the command", function() {
            var resources = new DummyResources();
            resources.add(new ToyResource('toy'));

            return resources
                .handle({cmd: 'toy.bar'})
                .then(function(result) {
                    assert(!result.success);
                });
        });

        it("should treat unhandled exceptions as failure replies", function() {
            var resources = new DummyResources();
            resources.add(new BadToyResource('bad_toy'));

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

            resources.add(new ToyResource('toy'));
            resources.add(new ToyResource('another_toy'));

            resources.attach(api);
            assert.strictEqual(api.toy, resources.get('toy'));
            assert.strictEqual(api.another_toy, resources.get('another_toy'));
        });
    });
});
