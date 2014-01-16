// metrics.js
//  - MetricStore utility functions.

var Q = require('q');

var utils = require("./utils");
var events = require("./events");
var Eventable = events.Eventable;


function MetricStore(im) {
    var self = this;
    Eventable.call(self);

    self.im = im;

    self.setup = function(opts) {
        opts = utils.set_defaults(opts || {}, {store_name: 'default'});

        self.store_name = opts.store_name;
        return self.emit.setup();
    };

    self.fire = function(metric, value, agg) {
        return self.im
            .api_request("metrics.fire", {
                store: self.store_name,
                metric: metric,
                value: value,
                agg: agg
            }).then(function(reply) {
                return reply.success;
            });
    };

    function _mk_fire_agg(agg) {
        return function(metric, value) {
            return self.fire(metric, value, agg);
        };
    }

    function _mk_fire_agg_value(agg, value) {
        return function(metric) {
            return self.fire(metric, value, agg);
        };
    }

    self.fire_sum = _mk_fire_agg('sum');
    self.fire_avg = _mk_fire_agg('avg');
    self.fire_min = _mk_fire_agg('min');
    self.fire_max = _mk_fire_agg('max');
    self.fire_inc = _mk_fire_agg_value('sum', 1);
}


// exports
this.MetricStore = MetricStore;
