var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;


var DummyLogResource = DummyResource.extend(function(self, name) {
    /**class:DummyLogResource(name)
    
    Handles api requests to the log resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    */
    DummyResource.call(self, name);

    /**:DummyLogResource.store
    An object mapping log levels to the messages logged at that level.
    */
    self.store = {};

    self.ensure_level = function(level) {
        var logs = self.store[level] || [];
        self.store[level] = logs;
        return logs;
    };

    self.support_level = function(name, level) {
        self.ensure_level(level);

        Object.defineProperty(self, name, {
            get: function() {
                return self.store[level];
            }
        });

        self.handlers[name] = function(cmd) {
            self.add(level, cmd.msg);
            return {success: true};
        };
    };

    /**attribute:DummyLogResource.debug
    An array of the messages logged at the ``'DEBUG'`` log level
    */
    self.support_level('debug', 10);

    /**attribute:DummyLogResource.info
    An array of the messages logged at the ``'INFO'`` log level
    */
    self.support_level('info', 20);

    /**attribute:DummyLogResource.warning
    An array of the messages logged at the ``'WARNING'`` log level
    */
    self.support_level('warning', 30);

    /**attribute:DummyLogResource.error
    An array of the messages logged at the ``'CRITICAL'`` log level
    */
    self.support_level('error', 40);

    /**attribute:DummyLogResource.critical
    An array of the messages logged at the ``'CRITICAL'`` log level
    */
    self.support_level('critical', 50);

    self.add = function(level, message) {
        var logs = self.ensure_level(level);
        logs.push(message);
    };

    self.handlers.log = function(cmd) {
        self.add(cmd.level, cmd.msg);
        return {success: true};
    };
});


this.DummyLogResource = DummyLogResource;
