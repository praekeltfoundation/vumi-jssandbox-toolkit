var util = require('util');
var assert = require('assert');
var _ = require("underscore");


function functor(obj) {
    return typeof obj != 'function'
        ? function() { return obj; }
        : obj;
}

function noop(obj) {
    return obj;
}

function maybe_call(obj, that, args) {
    return typeof obj == 'function'
        ? obj.apply(that, args)
        : obj;
}

function inherit(Parent, Child) {
    util.inherits(Child, Parent);
    _.extend(Child, Parent);
    return Child;
}

function basic_auth(username, password) {
    var hash = new Buffer(username + ":" + password).toString('base64');
    return 'Basic ' + hash;
}

function url_encode(url, params) {
    params = params.map(function(p) {
        return [p.name, p.value]
            .map(encodeURIComponent)
            .join('=');
    }).join('&');

    return [url, params].join('?');
}

function url_decode(url) {
    var url_parts = url.split('?', 2);

    var data = {
        url: url_parts[0],
        params: []
    };

    if (url_parts[1]) {
        data.params = url_parts[1]
            .split('&')
            .map(function(param) {
                var parts = param.split('=', 2);

                return {
                    name: decodeURIComponent(parts[0]),
                    value: decodeURIComponent(parts[1])
                };
            });
    }

    return data;
}

function now() {
    return new Date()
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '');
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function(c) {
            var r = Math.floor(Math.random() * 16);
            var v = c == 'x' ? r : (r & (0x3 | 0x8));
            return v.toString(16);
        });
}

function starts_with(haystack, needle) {
    haystack = haystack || '';
    return haystack.lastIndexOf(needle || '', 0) === 0;
}

function deep_equals(a, b) {
    try { assert.deepEqual(a, b); }
    catch (e) { return false; }
    return true;
}

function deep_matches(haystack, needles) {
    return _(needles).every(function(v, k) {
        return deep_equals(v, haystack[k]);
    });
}

function exists(v) {
    return typeof v != 'undefined' && v !== null;
}


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


this.noop = noop;
this.functor = functor;
this.maybe_call = maybe_call;
this.inherit =inherit;
this.basic_auth = basic_auth;
this.url_encode = url_encode;
this.url_decode = url_decode;
this.now = now;
this.uuid = uuid;
this.starts_with = starts_with;
this.deep_equals = deep_equals;
this.deep_matches = deep_matches;
this.exists = exists;
this.Extendable = Extendable;
this.BaseError = BaseError;
