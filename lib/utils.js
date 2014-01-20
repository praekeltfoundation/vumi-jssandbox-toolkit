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

function Extendable() {}
Extendable.extend = function(child) {
    var parent = this;
    util.inherits(child, parent);
    update(child, parent);
    return child;
};

exports.update = update;
exports.maybe_call = maybe_call;
exports.set_defaults = set_defaults;
exports.Extendable = Extendable;
