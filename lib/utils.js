function call_possible_function(obj, that, args) {
    return typeof obj != 'function'
        ? obj
        : obj.apply(that, args);
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

exports.call_possible_function = call_possible_function;
exports.set_defaults = set_defaults;
