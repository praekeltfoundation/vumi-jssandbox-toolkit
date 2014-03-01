var utils = require('../utils');
var Extendable = utils.Extendable;


var Logger = Extendable.extend(function(self, im) {
    /**class:Logger(im)

    Provides logging for the app and interaction machine.

    :param InteractionMachine im:
        the interaction machine associated to the logger.

    The initialised logger can also be invoked directly, which delegates to
    :meth:`Logger.info`:

    .. code-block:: javascript

        im.log('foo');
    */

    self = function(msg) {
        return self.info(msg);
    };

    self.im = im;

    self.support_level = function(level) {
        self[level] = function(msg) {
            return self.im.api_request('log.' + level, {msg: msg});
        };
    };

    /**:Logger.debug(message)

    Logs a message at the ``'DEBUG'`` log level

    :param string message:
        The message to log.
    */
    self.support_level('debug');

    /**:Logger.info(message)

    Logs a message at the ``'INFO'`` log level

    :param string message:
        The message to log.
    */
    self.support_level('info');

    /**:Logger.warning(message)

    Logs a message at the ``'WARNING'`` log level

    :param string message:
        The message to log.
    */
    self.support_level('warning');

    /**:Logger.error(message)

    Logs a message at the ``'CRITICAL'`` log level

    :param string message:
        The message to log.
    */
    self.support_level('error');

    /**:Logger.critical(message)

    Logs a message at the ``'CRITICAL'`` log level

    :param string message:
        The message to log.
    */
    self.support_level('critical');
    
    return self;
});


this.Logger = Logger;
