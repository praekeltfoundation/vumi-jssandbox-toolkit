var _ = require('lodash');

var events = require('../events');
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

    self.support_agg = function(agg) {
        self.fire[agg] = function(metric, value) {
            return self.fire(metric, value, agg);
        };
    };

    /**:MetricStore.fire.sum(metric, value)

    Fires a metric with the ``sum`` aggregation method.

    :param string metric: the name of the metric
    :param number value: the value of the metric
    */
    self.support_agg('sum');

    /**:MetricStore.fire.avg(metric, value)

    Fires a metric with the ``avg`` aggregation method.

    :param string metric: the name of the metric
    :param number value: the value of the metric
    */
    self.support_agg('avg');

    /**:MetricStore.fire.min(metric, value)

    Fires a metric with the ``min`` aggregation method.

    :param string metric: the name of the metric
    :param number value: the value of the metric
    */
    self.support_agg('min');

    /**:MetricStore.fire.max(metric, value)

    Fires a metric with the ``max`` aggregation method.

    :param string metric: the name of the metric
    :param number value: the value of the metric
    */
    self.support_agg('max');

    /**:MetricStore.fire.last(metric, value)

    Fires a metric with the ``last`` aggregation method.

    :param string metric: the name of the metric
    :param number value: the value of the metric
    */
    self.support_agg('last');

    self.fire.inc = function(metric, opts) {
        /**:MetricStore.fire.inc(metric[, opts])

        Increments the value for the key ``metric`` in in the kv store, fires a
        metric with the new total using the ``'last`` aggregation method, then
        returns the total via a promise.

        :param string metric: the name of the metric
        :param number opts.amount: the amount to increment by. Defaults to
        ``1``.
        */
        opts = _.defaults(opts || {}, {amount: 1});

        return self
            .im.api_request('kv.incr', {
                key: [self.store_name, metric].join('.'),
                amount: opts.amount
            })
            .then(function(reply) {
                return self
                    .fire.last(metric, reply.value)
                    .thenResolve(reply.value);
            });
    };
});


this.MetricStore = MetricStore;
