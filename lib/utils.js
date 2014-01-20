var util = require('util');


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

function inherit(parent, child) {
    util.inherits(child, parent);
    update(child, parent);
    return child;
}

function Extendable() {}
Extendable.extend = function(child) {
    return inherit(this, child);
};

var BaseError = inherit(Error, function() {
    Error.apply(this, arguments);
});
BaseError.extend = Extendable.extend;


exports.update = update;
exports.maybe_call = maybe_call;
exports.set_defaults = set_defaults;
exports.inherit =inherit;
exports.Extendable = Extendable;
