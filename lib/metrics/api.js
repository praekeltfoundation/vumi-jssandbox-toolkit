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

    /**:MetricStore.fire.sum(metric, value)

    Fires a metric with the ``sum`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire.sum = function(metric, value) {
        return self.fire(metric, value, 'sum');
    };

    /**:MetricStore.fire.avg(metric, value)

    Fires a metric with the ``avg`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire.avg = function(metric, value) {
        return self.fire(metric, value, 'avg');
    };

    /**:MetricStore.fire.min(metric, value)

    Fires a metric with the ``min`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire.min = function(metric, value) {
        return self.fire(metric, value, 'min');
    };

    /**:MetricStore.fire.max(metric, value)

    Fires a metric with the ``max`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire.max = function(metric, value) {
        return self.fire(metric, value, 'max');
    };

    /**:MetricStore.fire.last(metric, value)

    Fires a metric with the ``last`` aggregation method.

    :param string metric: the name of the metric
    :param float value: the value of the metric
    */
    self.fire.last = function(metric, value) {
        return self.fire(metric, value, 'last');
    };

    /**:MetricStore.fire.inc(metric)

    Fires a metric with the ``sum`` aggregation method and a value of ``1``,
    which has the effect of 'incrementing' the metric value as each new metric
    is fired.

    :param string metric: the name of the metric
    */
    self.fire.inc = function(metric) {
        return self.fire.sum(metric, 1);
    };
});


this.MetricStore = MetricStore;
