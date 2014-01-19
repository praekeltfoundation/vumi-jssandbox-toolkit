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

exports.maybe_call = maybe_call;
exports.set_defaults = set_defaults;
