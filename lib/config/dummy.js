var _ = require('lodash');

var resources = require('../dummy/resources');

var DummyResource = resources.DummyResource;


var DummyConfigResource = DummyResource.extend(function(self, name, store) {
    /**class:DummyConfigResource(name)
    
    Handles api requests to the config resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    */
    DummyResource.call(self, name);

    /**attribute:DummyConfigResource.store
    An object containing sandbox's config data. Properties do not need to be
    JSON-stringified, this is done when the config is retrieved using a
    ``'config.get'`` api request.
    */
    self.store = store || {};
    self.store.app = self.store.app || {};

    /**attribute:DummyConfigResource.app
    A shortcut to DummyConfigResource.store.app (the app's config).
    */
    Object.defineProperty(self, 'app', {
        get: function() {
            return self.store.app;
        },
        set: function(v) {
            self.store.app = v;
            return v;
        }
    });

    self.handlers.get = function(cmd) {
        var value = self.store[cmd.key];

        if (_.isUndefined(value)) {
            value = null;
        }

        return {
            success: true,
            value: JSON.stringify(value)
        };
    };
});


this.DummyConfigResource = DummyConfigResource;
