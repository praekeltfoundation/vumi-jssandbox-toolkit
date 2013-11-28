var Q = require('q');

function call_possible_function(obj, that, args) {
    return Q(typeof obj != 'function'
        ? obj
        : obj.apply(that, args));
}

exports.call_possible_function = call_possible_function;
