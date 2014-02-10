var util = require('util');


function pop_prop(obj, k) {
    var v = obj[k];
    delete obj[k];
    return v;
}

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

function set_defaults(obj, defaults) {
    var v;

    for (var k in defaults) {
        v = defaults[k];
        if (typeof v != 'undefined' && typeof obj[k] == 'undefined') {
            obj[k] = v;
        }
    }

    return obj;
}

function update(dest, src) {
    for (var k in src) {
        if (src.hasOwnProperty(k)) {
            dest[k] = src[k];
        }
    }

    return dest;
}

function inherit(Parent, Child) {
    util.inherits(Child, Parent);
    update(Child, Parent);
    return Child;
}

function basic_auth(username, password) {
    var hash = new Buffer(username + ":" + password).toString('base64');
    return 'Basic ' + hash;
}

function url_encode(params) {
    return params.map(function(p) {
        return [p.name, p.value]
            .map(encodeURIComponent)
            .join('=');
    }).join('&');
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
    Error.apply(this, arguments);
});
BaseError.extend = Extendable.extend;


this.pop_prop = pop_prop;
this.noop = noop;
this.functor = functor;
this.update = update;
this.maybe_call = maybe_call;
this.inherit =inherit;
this.basic_auth = basic_auth;
this.url_encode = url_encode;
this.now = now;
this.uuid = uuid;
this.starts_with = starts_with;
this.Extendable = Extendable;
this.BaseError = BaseError;
