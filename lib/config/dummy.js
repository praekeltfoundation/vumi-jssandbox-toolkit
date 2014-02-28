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
    An object containing the config's the sandbox config data.
    NOTE: properties do not need to be JSON-stringified, this is done when the
    config is retrieved when a 'config.get' api request is made.
    */
    self.store = store || {};

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
