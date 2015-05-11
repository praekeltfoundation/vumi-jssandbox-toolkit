var _ = require('lodash');

var utils = require('../utils');
var resources = require('../dummy/resources');

var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var DummyKvResource = DummyResource.extend(function(self, name, store) {
    /**class:DummyKvResource(name[, store])
    
    Handles api requests to the kv resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    :param object store:
        The data to initialise the store with.
    */
    DummyResource.call(self, name);

    /**attribute:DummyKvResource.store
    An object mapping all the keys in the store to their corresponding values.
    */
    self.store = store || {};

    /**attribute:DummyKvResource.ttl
    An object mapping keys set to expire to their lifetime (in seconds).
    */
    self.ttl = {};

    self.incr = function(key, amount) {
        /**:DummyKvResource.incr(key[, amount])

        Increment the value of an integer key. The current value of the key
        must be an integer. If the key does not exist, it is set to zero.
        Returns the result.
        
        :param string key:
            The key corresponding to the value to increment
        :param integer amount:
            The amount to increment by. Defaults to 1.
        */
        amount = utils.exists(amount)
            ? amount
            : 1;

        if (!utils.is_integer(amount)) {
            throw new DummyResourceError([
                "Non-integer increment amount given for key",
                "'" + key + "': " + amount
            ].join(' '));
        }

        var value = key in self.store
            ? self.store[key]
            : 0;

        if (!utils.is_integer(value)) {
            throw new DummyResourceError([
                "Cannot increment non-integer value for key",
                "'" + key + "': " + value
            ].join(' '));
        }

        value += amount;
        self.store[key] = value;
        return value;
    };

    self.set_ttl = function(key, seconds) {
        /**:DummyKvResource.set_ttl(key[, seconds])

        Set or remove the ttl (expiry time) of a key.

        If seconds is ``null`` or undefined the key is set not to expire (and
        its ttl is removed).

        :param string key:
            The key to set the ttl for.
        :param integer seconds:
            The number of seconds to set the ttl to. Defaults to ``null``.
        */
        seconds = (typeof seconds !== 'undefined') ? seconds : null;
        if (seconds === null) {
            delete self.ttl[key];
        }
        else {
            self.ttl[key] = seconds;
        }
    };

    self.handlers.get = function(cmd) {
        var value = self.store[cmd.key];

        if (_.isUndefined(value)) {
            value = null;
        }

        return {
            success: true,
            value: value
        };
    };

    self.handlers.set = function(cmd) {
        self.store[cmd.key] = cmd.value;
        self.set_ttl(cmd.key, cmd.seconds);
        return {success: true};
    };

    self.handlers.incr = function(cmd) {
        return {
            success: true,
            value: self.incr(cmd.key, cmd.amount)
        };
    };

    self.handlers.delete = function(cmd) {
        var existed = cmd.key in self.store;
        delete self.store[cmd.key];
        return {
            success: true,
            existed: existed
        };
    };
});


this.DummyKvResource = DummyKvResource;
