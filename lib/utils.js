var util = require('util');
var _ = require('lodash');
var moment = require('moment');


function functor(obj) {
    /**function:functor(obj)
    Coerce ``obj`` to a function.

    If ``obj`` is a function, return the function. Otherwise return
    a constant function that returns ``obj`` when called.

    :param Object obj:
        The object to coerce.
    */
    return typeof obj != 'function'
        ? function() { return obj; }
        : obj;
}


function maybe_call(obj, that, args) {
    /**function:maybe_call(obj, that, args)
    Coerce a function to its result.

    If ``obj`` is a function, call it with the given arguments and return
    the result. Otherwise return ``obj``.

    :param Object obj:
        The function to call or result to return.
    :param Object that:
        The value of ``this`` to bind to the function.
    :param Array args:
        Arguments to call the function with.
    */
    return typeof obj == 'function'
        ? obj.apply(that, args)
        : obj;
}


function inherit(Parent, Child) {
    /**function:inherit(Parent, Child)
    Inherit the parent's prototype and mark the child as extending the parent.

    :param Class Parent:
        The parent class to inherit and extend from.
    :param Class Child:
        The child class that inherits and extends.
    */
    util.inherits(Child, Parent);
    _.extend(Child, Parent);
    return Child;
}


function basic_auth(username, password) {
    /**function:basic_auth(username, password)
    Return an HTTP Basic authentication header value for the given username
    and password.

    :param string username:
        The username to authenticate as.
    :param string password:
        The password to authenticate with.
    */
    var hash = new Buffer(username + ":" + password).toString('base64');
    return 'Basic ' + hash;
}


function vumi_utc(date) {
    /**function:vumi_utc(date)
    Format a date in Vumi's date format.

    :param obj date:
        A value ``moment`` can interpret as a UTC date.
    */
    return moment(date)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSSS');
}


function uuid() {
    /**function:uuid()
    Return a UUID (version 4).
    */
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function(c) {
            var r = Math.floor(Math.random() * 16);
            var v = c == 'x' ? r : (r & (0x3 | 0x8));
            return v.toString(16);
        });
}


function starts_with(haystack, needle) {
    /**function:starts_with(haystack, needle)
    Return ``true`` if haystack starts with needle and ``false`` otherwise.

    :param string haystack:
        The string to search within.
    :param string needle:
        The string to look for.

    If either parameter is false-like, it is treated as the empty string.
    */
    haystack = haystack || '';
    return haystack.lastIndexOf(needle || '', 0) === 0;
}


function exists(v) {
    /**function:exists(v)
    Return ``true`` if v is defined and not null, and ``false`` otherwise.

    :param Object v:
        The value to check.
    */
    return typeof v != 'undefined' && v !== null;
}


function is_integer(v) {
    /**function:is_integer(v)
    Return ``true`` if v is of type number and has no fractional part.

    :param Object v:
        The value to check.
    */
    return typeof v == 'number' && v % 1 === 0;
}


function infer_addr_type(delivery_class) {
    /**function:infer_addr_type(delivery_class)
    Return the address type for the given delivery class.

    A ``delivery class`` is type of system that messages can
    be sent or received over. Common values are ``sms``, ``ussd``,
    ``gtalk`` and ``twitter``.

    An ``address type`` is a type of address used to identify
    a user. Common values are ``msisdn``, ``gtalk_id`` and
    ``twitter_handler``.

    If the ``delivery_class`` isn't know, the ``delivery_class``
    itself is returned as the ``address_type``.

    :param string delivery_class:
        The delivery class to look up.
    */
    return {
        sms: 'msisdn',
        ussd: 'msisdn',
        gtalk: 'gtalk_id',
        twitter: 'twitter_handle'
    }[delivery_class];
}


function format_addr(addr, type) {
    /**function:format_addr(addr, type)
    Format an address as a standardized string.

    This function delegates to the formatter ``format_addr[type]`` or
    returns the address unchanged if there is no custom formatter.

    :param string addr:
        The address to format.
    :param string type:
        The address type for the address.
    */
    var formatter = format_addr[type] || _.identity;
    return formatter(addr);
}


format_addr.msisdn = function(addr) {
    /**function:format_addr.msisdn(addr)
    Canonicalize an MSISDN by adding a ``+`` prefix if one is not present.

    :param string addr:
        The MSISDN to format.
    */
    return '+' + addr.replace('+', '');
};


format_addr.gtalk_id = function(addr) {
    /**function:format_addr.gtalk_id(addr)
    Canonicalize a Gtalk address by stripping the device-specifier, if any.

    :param string addr:
        The Gtalk address to format.
    */
    return addr.split('/')[0];
};


function Extendable() {
    /**class:Extendable()

    A base class for extendable classes.
    */
}

Extendable.extend = function(Child) {
    /**class:Extendable.extend(Child)
    Create a sub-class.

    :param Class Child:
        The constructor for the child class.

    Example usage::

        var MyClass = Extendable.extend(function(self, name) {
            self.my_name = name;
        });

        var OtherClass = MyClass.extend(function(self, other) {
            MyClass.call("custom_name");
            self.other_var = other;
        });
    */
    var Parent = this;

    var Surrogate = function() {
        Array.prototype.unshift.call(arguments, this);
        return Child.apply(this, arguments);
    };

    return inherit(Parent, Surrogate);
};


var BaseError = inherit(Error, function(message) {
    /**class:BaseError()

    An extendable error class that inherits from :class:`Error`.

    Example usage::

        var MyError = BaseError.extend(function(self, message) {
            self.name = "MyError";
            self.message = message;
        });

    .. note::

       :class:`BaseError` copies `.extend` from :class:`Extendable`
       rather than inheriting it because it inherits from :class:`Error`
       already.
    */
    var self = this;
    Error.apply(self, arguments);
});
BaseError.extend = Extendable.extend;


var DeprecationError = BaseError.extend(function(self, message) {
    /**class:DeprecationError

    Thrown when deprecated functionality is used.
    */
    self.name = "DeprecationError";
    self.message = message;
});


this.functor = functor;
this.maybe_call = maybe_call;
this.inherit =inherit;
this.basic_auth = basic_auth;
this.vumi_utc = vumi_utc;
this.uuid = uuid;
this.starts_with = starts_with;
this.exists = exists;
this.is_integer = is_integer;
this.infer_addr_type = infer_addr_type;
this.format_addr = format_addr;
this.Extendable = Extendable;
this.BaseError = BaseError;
this.DeprectationError = DeprecationError;
