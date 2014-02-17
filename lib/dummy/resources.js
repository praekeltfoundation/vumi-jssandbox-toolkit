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
        if (!(name in self.resources)) {
            throw new DummyResourceError(
                "Resource '" + name + "' does not exist");
        }

        return self.resources[name];
    };

    self.cmd_namespace = function(cmd) {
        var parts = cmd.cmd.split('.', 2);

        return {
            resource: parts[0],
            handler: parts[1]
        };
    };

    self.can_handle = function(cmd) {
        var ns = self.cmd_namespace(cmd);
        return ns.resource in self.resources
            && ns.handler in self.get(ns.resource).handlers;
    };

    self.handle = function(cmd) {
        var ns = self.cmd_namespace(cmd);
        var resource = self.get(ns.resource);
        var handler = resource.handlers[ns.handler];

        if (!handler) {
            throw new DummyResourceError([
                "Resource '" + ns.resource + "' has no handler",
                "'" + ns.handler + "'"].join(' '));
        }

        return Q()
            .delay(0)
            .then(function() {
                return handler.call(resource, cmd);
            });
    };

    self.attach = function(api) {
        _(self.resources).each(function(resource) {
            api[resource.name] = resource;
        });
    };
});


this.DummyResource = DummyResource;
this.DummyResources = DummyResources;
this.DummyResourceError = DummyResourceError;
