// metrics.js
//  - MetricStore utility functions.

var Q = require('q');


function MetricStore(api, store) {

    var self = this;

    self.api = api;
    self.store = store;

    self.fire = function(metric, value, agg) {
        var d = Q.defer();

        self.api.request(
            "metrics.fire", {
                store: self.store,
                metric: metric,
                value: value,
                agg: agg
            }, function(reply) {
                d.resolve(reply.success);
            });

        return d.promise;
    };

    var _mk_fire_agg = function(agg) {
        return function(metric, value) {
            return self.fire(metric, value, agg);
        };
    };

    var _mk_fire_agg_value = function(agg, value) {
        return function(metric) {
            return self.fire(metric, value, agg);
        };
    };

    self.fire_sum = _mk_fire_agg('sum');
    self.fire_avg = _mk_fire_agg('avg');
    self.fire_min = _mk_fire_agg('min');
    self.fire_max = _mk_fire_agg('max');
    self.fire_inc = _mk_fire_agg_value('sum', 1);
}


// exports
this.MetricStore = MetricStore;
