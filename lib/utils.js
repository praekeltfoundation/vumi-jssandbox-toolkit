var Q = require('q');

function call_possible_function(obj, that, args) {
    return typeof obj != 'function'
        ? obj
        : obj.apply(that, args);
}


function set_defaults(obj, defaults) {
    for (var k in defaults) {
        if (!(k in obj)) {
            obj[k] = defaults[k];
        }
    }

    return obj;
}

exports.call_possible_function = call_possible_function;
exports.set_defaults = set_defaults;
