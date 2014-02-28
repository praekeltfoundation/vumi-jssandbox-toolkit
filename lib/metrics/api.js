var _ = require("lodash");

var events = require("../events");
var Eventable = events.Eventable;


var MetricStore = Eventable.extend(function(self, im) {
    /**class:MetricStore(im)

    Provides metric firing capabilties for the :class:`InteractionMachine`.

    :param InteractionMachine im:
        the interaction machine to which this sandbox config is associated
    */

    Eventable.call(self);
    self.im = im;

    self.setup = function(opts) {
        /**:MetricStore.setup([opts])

        Sets up the metric store.

        :param opts.store_name:
            the store/namespace to use for fired metrics. Defaults to 'default'
        */
        opts = _.defaults(opts || {}, {store_name: 'default'});
        self.store_name = opts.store_name;
        return self.emit.setup();
    };

    self.fire = function(metric, value, agg) {
        /**:MetricStore.fire(metric, value, agg)

        Fires a metric.

        :param string metric: the name of the metric
        :param number value: the value of the metric
        :param string agg: the aggregation method to use
        */
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

    /**:MetricStore.fire_sum(metric, value)

    Fires a metric with the ``sum`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire_sum = _mk_fire_agg('sum');

    /**:MetricStore.fire_avg(metric, value)

    Fires a metric with the ``avg`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire_avg = _mk_fire_agg('avg');

    /**:MetricStore.fire_min(metric, value)

    Fires a metric with the ``min`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire_min = _mk_fire_agg('min');

    /**:MetricStore.fire_max(metric, value)

    Fires a metric with the ``max`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire_max = _mk_fire_agg('max');

    /**:MetricStore.fire_inc(metric)

    Fires a metric with the ``sum`` aggregation method and a value of ``1``,
    which has the effect of 'incrementing' the metric value as each new metric
    is fired.

    :param string metric: the name of the metric
    */
    self.fire_inc = _mk_fire_agg_value('sum', 1);
});


this.MetricStore = MetricStore;
