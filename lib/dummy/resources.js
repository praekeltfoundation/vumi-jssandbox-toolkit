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
    /**class:DummyResource()

    A resource for handling api requests sent to a :class:`DummyApi`.
    */

    /**attribute:DummyResource.name
    The name of the resource. Should match the name given in api requests (for
    eg, name would be ``'http'`` for ``http.get`` api request).
    */
    self.name = null;

    /**attribute:DummyResource.handlers
    An object holding the resource's handlers. Each property name should be the
    name of the resource handler used in api requests (for eg, ``'get'`` for
    ``'http.get'``), and each property value should be a function which accepts
    a command and returns an api result. For eg:

    .. code-block:: javascript

        self.handlers.foo = function(cmd) {
            return {
                success: true,
                bar: 'baz'
            };
        };
    */
    self.handlers = {};

    self.handle = function(cmd) {
        /**:DummyResource.handle(cmd)

        Handles an api request by delegating to the resource handler that
        corresponds to ``cmd``.

        :param object cmd:
            The api request command to be handled.
        */
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
    /**class:DummyResources
    Controls a :class:`DummyApi`'s resources and delegates api requests to
    correspinding resource.
    **/
    self.resources = {};

    self.add = function(resource) {
        /**:DummyResources.add(resource)

        Adds a resource to the resource collection.

        :param DummyResource resource:
            The resource to be added.
        */
        if (resource.name in self.resources) {
            throw new DummyResourceError(
                "Resource '" + resource.name + "' already exists");
        }

        self.resources[resource.name] = resource;
    };

    self.get = function(name) {
        /**:DummyResources.get(name)

        Returns a resource by name

        :param string name:
            The name of the resource
        */
        return self.resources[name];
    };

    self.has_resource_for = function(cmd) {
        /**:DummyResources.has_resource_for(cmd)

        Determines whether the resource collection has a corresponding resource
        for ``cmd``.

        :param object cmd;
            The command to look for a resource for.
        */
        var ns = cmd_namespace(cmd);
        return ns.resource in self.resources;
    };

    self.handle = function(cmd) {
        /**:DummyResources.handle(cmd)

        Handles an api request by delegating to the corresponding resource.

        :param object cmd;
            The api request command to be handled.
        */
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
        /**:DummyResources.attach(api)

        Attaches the resource collection's resources directly onto a
        :class:`DummyApi`. Simply a convenience to provide users with
        direct access to the resource.

        :param DummyApi api;
            the api to attach to
        */
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
