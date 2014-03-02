var _ = require("lodash");

var utils = require("../utils");
var BaseError = utils.BaseError;

var structs = require("../structs");
var Model = structs.Model;

var events = require("../events");
var Eventable = events.Eventable;


var IMConfigError = BaseError.extend(function(self, config, message) {
    /**class:IMConfigError(message)
        Thrown when an error occurs while validating or accessing something on
        the interaction machine's config.

        :param IMConfig config: the im's config.
        :param string message: the error message.
    */
    self.config = config;
    self.name = 'IMConfigError';
    self.message = message;
});


var SandboxConfig = Eventable.extend(function(self, im) {
    /**class:SandboxConfig(im)

    Provides access to the sandbox's config data.

    :param InteractionMachine im:
        the interaction machine to which this sandbox config is associated
    */
    Eventable.call(self);
    self.im = im;

    self.setup = function() {
        return self.emit.setup();
    };

    self.get = function(key, opts) {
        /**:SandboxConfig.get(key, opts)
        Retrieve a value from the sandbox application's Vumi Go config. Returns
        a promise that will be fulfilled with the config value.

        :param string key:
            name of the configuration item to retrieve.
        :param boolean opts.json:
            whether to parse the returned value using ``JSON.parse``.
            Defaults to ``false``.
        */
        opts = _.defaults(opts || {}, {json: false});

        return self
            .im.api_request("config.get", {key: key})
            .then(function(reply) {
                return typeof reply.value != "undefined" && opts.json
                    ? JSON.parse(reply.value)
                    : reply.value;
            });
    };
});


var IMConfig = Model.extend(function(self, im) {
    /**class:IMConfig(im)

    Provides access to an :class:`InteractionMachine`'s config data.

    :param InteractionMachine im:
        the interaction machine to which this config is associated
    */
    Model.call(self);
    self.cls.im = im;

    self.cls.defaults = {
        delivery_class: 'ussd'
    };

    self.do.setup = function() {
        /**:IMConfig.setup()

        Sets up the interaction machine's config by reading the config from its
        value in the interaction machine's sandbox config (the value of the
        `config` key in the sandbox config). Emits a :class:`Setup` event once
        setup is complete. returns a promise that is fulfilled after setup is
        complete and after event listeners have done their work.
        */
        return self.cls.im.sandbox_config
            .get('config', {json: true})
            .then(function(attrs) {
                self.do.init(attrs);
                return self.do.emit.setup();
            });
    };

    self.do.validate = function() {
        if (!('name' in self)) {
            throw new IMConfigError(self, "No 'name' config property found");
        }
    };
});


this.SandboxConfig = SandboxConfig;
this.IMConfig = IMConfig;
this.IMConfigError = IMConfigError;
