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

function inherit(Parent, Child) {
    util.inherits(Child, Parent);
    update(Child, Parent);
    return Child;
}

function Extendable() {}
Extendable.extend = function(Child) {
    var Parent = this;

    var Surrogate = function() {
        Array.prototype.unshift.call(arguments, this);
        Child.apply(this, arguments);
    };

    return inherit(Parent, Surrogate);
};

var BaseError = inherit(Error, function(message) {
    Error.apply(this, arguments);
});
BaseError.extend = Extendable.extend;



this.update = update;
this.maybe_call = maybe_call;
this.set_defaults = set_defaults;
this.inherit =inherit;
this.Extendable = Extendable;
this.BaseError = BaseError;
