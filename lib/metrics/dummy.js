var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var DummyMetricsResource = DummyResource.extend(function(self, name) {
    /**class:DummyMetricsResource(name)

    Handles api requests to the metrics resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    */
    DummyResource.call(self, name);

    /**attribute:DummyMetricsResource.stores.<store_name>.<metric_name>.agg
    The aggregation method for metrics with the name ``metric_name`` that have
    been fired to the store with the name ``store_name``.
    */
    /**attribute:DummyMetricsResource.stores.<store_name>.<metric_name>.values
    An array of the metric values for metrics with the name ``metric_name``
    that have been fired to the store with the name ``store_name``.
    */
    self.stores = {};
    self.metric_pattern = /^[a-zA-Z][a-zA-Z0-9._]{0,100}$/;

    self.ensure_metric = function(data) {
        var store = self.stores[data.store] || {};
        self.stores[data.store] = store;

        var metric = store[data.metric] || {
            agg: data.agg,
            values: []
        };
        store[data.metric] = metric;

        return metric;
    };

    self.record = function(data) {
        /**:DummyMetricsResource.add(metric)

        Records a fired metric.

        :param string data.store:
            the name of the metric
        :param string data.metric:
            the name of the metric
        :param string data.agg:
            the name of the aggregation method
        :param number data.value:
            the value to store for the metric
        */
        if (!self.metric_pattern.test(data.metric)) {
            throw new DummyResourceError([
                "Metric name '" + data.metric + "' is invalid. It should",
                "match '" + self.metric_pattern.source + "'.",
            ].join(' '));
        }

        var metric = self.ensure_metric(data);

        if (data.agg !== metric.agg) {
            throw new DummyResourceError([
                "Inconsistent aggregation method for",
                "metric '" + data.metric + "' in store '" + data.store + "':",
                "found both '" + metric.agg + "' and '" + data.agg + "'"
            ].join(' '));
        }

        metric.values.push(data.value);
    };

    self.handlers.fire = function(cmd) {
        self.record(cmd);
        return {success: true};
    };
});


this.DummyMetricsResource = DummyMetricsResource;
