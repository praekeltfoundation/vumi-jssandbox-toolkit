var Q = require("q");
var _ = require("underscore");

var utils = require("../utils");
var Extendable = utils.Extendable;

var utils = require("../utils");
var BaseError = utils.BaseError;


var DummyResourceError = BaseError.extend(function(self, message) {
    self.name = "DummyResourceError";
    self.message = message;
});


var DummyResource = Extendable.extend(function(self) {
    self.name = null;

    self.handlers = {};

    self.handle = function(cmd) {
        return Q()
            .delay(0)
            .then(function() {
                var ns = cmd_namespace(cmd);
                var handler = self.handlers[ns.handler];

                if (!handler) {
                    throw new DummyResourceError([
                        "Resource '" + self.name + "' has no handler",
                        "'" + ns.handler + "'"].join(' '));
                }

                return handler.call(self, cmd);
            })
            .catch(function(e) {
                return {
                    success: false,
                    reason: e.message
                };
            });
    };
});

var DummyResources = Extendable.extend(function(self) {
    self.resources = {};

    self.add = function(resource) {
        if (resource.name in self.resources) {
            throw new DummyResourceError(
                "Resource '" + resource.name + "' already exists");
        }

        self.resources[resource.name] = resource;
    };

    self.get = function(name) {
        return self.resources[name];
    };

    self.has_resource_for = function(cmd) {
        var ns = cmd_namespace(cmd);
        return ns.resource in self.resources;
    };

    self.handle = function(cmd) {
        return Q()
            .delay(0)
            .then(function() {
                var ns = cmd_namespace(cmd);
                var resource = self.get(ns.resource);

                if (!resource) {
                    throw new DummyResourceError(
                        "Resource '" + ns.resource + "' does not exist");
                }

                return resource.handle(cmd);
            }).catch(function(e) {
                return {
                    success: false,
                    reason: e.message
                };
            });
    };

    self.attach = function(api) {
        _(self.resources).each(function(resource) {
            api[resource.name] = resource;
        });
    };
});


function cmd_namespace(cmd) {
    var parts = cmd.cmd.split('.', 2);

    return {
        resource: parts[0],
        handler: parts[1]
    };
}


this.DummyResource = DummyResource;
this.DummyResources = DummyResources;
this.DummyResourceError = DummyResourceError;
