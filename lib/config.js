var utils = require("./utils");
var events = require("./events");
var Eventable = events.Eventable;


function SandboxConfig(im) {
    var self = this;
    Eventable.call(self);
    self.im = im;

    self.setup = function() {
        return self.emit.setup();
    };

    self.get = function(key, opts) {
        /**:InteractionMachine.fetch_config_value(key, json)

        Retrieve a value from the sandbox application's Vumi Go config. Returns
        a promise that will be fulfilled with the config value.

        :param string key:
            name of the configuration item to retrieve.
        :param boolean opts.json:
            whether to parse the returned value using ``JSON.parse``.
            Defaults to ``false``.
        */
        opts = utils.set_defaults(opts || {}, {json: false});

        return self
            .im.api_request("config.get", {key: key})
            .then(function(reply) {
                return typeof reply.value != "undefined" && opts.json
                    ? JSON.parse(reply.value)
                    : reply.value;
            });
    };
}


function IMConfig(im) {
    var self = this;
    Eventable.call(self);
    self.im = im;

    self.setup = function(im) {
        self.data = null;

        return self.im.sandbox_config
            .get('config', {json: true})
            .then(function(data) {
                self.data = data || {};
                return self.emit.setup();
            });
    };

    self.get = function(key) {
        return self.data[key];
    };
}


this.SandboxConfig = SandboxConfig;
this.IMConfig = IMConfig;
