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
    An object containing the sandbox's config data. Properties do not need to be
    JSON-stringified, this is done when the config is retrieved using a
    ``'config.get'`` api request.
    */
    self.store = store || {config: {}};

    /**attribute:DummyConfigResource.json
    An object specifying which keys in :attribute:`store` should be serialized
    to JSON when being retrieved using ``'config.get'``. The default for keys
    not listed is ``true``.
    */
    self.json = {};

    /**attribute:DummyConfigResource.app
    A shortcut to DummyConfigResource.store.config (the app's config).
    */
    Object.defineProperty(self, 'app', {
        get: function() {
            return self.store.config;
        },
        set: function(v) {
            self.store.config = v;
            return v;
        }
    });

    self.handlers.get = function(cmd) {
        var value = self.store[cmd.key];
        var json = self.json[cmd.key];

        if (_.isUndefined(value)) {
            value = null;
        }

        if (json !== false) {
            value = JSON.stringify(value);
        }

        return {
            success: true,
            value: value
        };
    };
});


this.DummyConfigResource = DummyConfigResource;
