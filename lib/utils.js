var util = require('util');
var assert = require('assert');
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


function noop(obj) {
    /**function:noop(obj)
    A function that returns its argument unchanged.

    Used when a no-op conversion function is needed.

    :param Object obj:
        The object to return.
    */
    return obj;
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
        An value ``moment`` can interpret as a UTC date.
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


function deep_equals(a, b) {
    /**function:deep_equals(a, b)
    Return ``true`` if a and b have the same contents and ``false`` otherwise.

    :param Object a:
        An object to compare.
    :param Object b:
        The object to compare it with.
    */
    try { assert.deepEqual(a, b); }
    catch (e) { return false; }
    return true;
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
    return {
        sms: 'msisdn',
        ussd: 'msisdn',
        gtalk: 'gtalk_id',
        twitter: 'twitter_handle'
    }[delivery_class];
}


function format_addr(addr, type) {
    var formatter = format_addr[type] || _.identity;
    return formatter(addr);
}


format_addr.msisdn = function(addr) {
    return '+' + addr.replace('+', '');
};


format_addr.gtalk_id = function(addr) {
    return addr.split('/')[0];
};


function Extendable() {}
Extendable.extend = function(Child) {
    var Parent = this;

    var Surrogate = function() {
        Array.prototype.unshift.call(arguments, this);
        return Child.apply(this, arguments);
    };

    return inherit(Parent, Surrogate);
};


var BaseError = inherit(Error, function(message) {
    var self = this;
    Error.apply(self, arguments);
});
BaseError.extend = Extendable.extend;


var DeprecationError = BaseError.extend(function(self, message) {
    self.name = "DeprecationError";
    self.message = message;
});


this.noop = noop;
this.functor = functor;
this.maybe_call = maybe_call;
this.inherit =inherit;
this.basic_auth = basic_auth;
this.vumi_utc = vumi_utc;
this.uuid = uuid;
this.starts_with = starts_with;
this.deep_equals = deep_equals;
this.exists = exists;
this.is_integer = is_integer;
this.infer_addr_type = infer_addr_type;
this.format_addr = format_addr;
this.Extendable = Extendable;
this.BaseError = BaseError;
this.DeprectationError = DeprecationError;
