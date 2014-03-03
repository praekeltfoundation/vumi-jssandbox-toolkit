var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var DummyApi = vumigo.dummy.api.DummyApi;
var DummyResourceError = vumigo.dummy.resources.DummyResourceError;


describe("metrics.dummy", function() {
    var api;
    var request;

    beforeEach(function() {
        api =  new DummyApi();
        request = test_utils.requester(api);
    });

    describe("DummyMetricsResource", function() {
        describe(".record", function() {
            it("should create the store if it does not exist", function() {
                assert(!('store' in api.metrics.stores));

                api.metrics.record({
                    store: 'store',
                    metric: 'metric',
                    agg: 'sum',
                    value: 3
                });

                assert('store' in api.metrics.stores);
            });

            it("should create the metric if it does not exist", function() {
                api.metrics.stores.store = {};

                api.metrics.record({
                    store: 'store',
                    metric: 'metric',
                    agg: 'sum',
                    value: 3
                });

                assert('metric' in api.metrics.stores.store);
            });

            it("should record the metric", function() {
                api.metrics.record({
                    store: 'store1',
                    metric: 'metric1',
                    agg: 'sum',
                    value: 1
                });

                api.metrics.record({
                    store: 'store1',
                    metric: 'metric1',
                    agg: 'sum',
                    value: 2
                });

                api.metrics.record({
                    store: 'store1',
                    metric: 'metric2',
                    agg: 'min',
                    value: 3
                });

                api.metrics.record({
                    store: 'store2',
                    metric: 'metric1',
                    agg: 'avg',
                    value: 4
                });

                assert.deepEqual(api.metrics.stores, {
                    store1: {
                        metric1: {
                            agg: 'sum',
                            values: [1, 2]
                        },
                        metric2: {
                            agg: 'min',
                            values: [3]
                        }
                    },
                    store2: {
                        metric1: {
                            agg: 'avg',
                            values: [4]
                        }
                    }
                });
            });

            it("should fail if inconsistent aggregation methods are given",
            function() {
                api.metrics.record({
                    store: 'store',
                    metric: 'metric',
                    agg: 'sum',
                    value: 1
                });

                assert.throws(
                    function() {
                        api.metrics.record({
                            store: 'store',
                            metric: 'metric',
                            agg: 'avg',
                            value: 2
                        });
                    },
                    function(e) {
                        assert(e instanceof DummyResourceError);
                        assert.equal(
                            e.message,
                            ["Inconsistent aggregation method for",
                             "metric 'metric' in store 'store':",
                             "found both 'sum' and 'avg'"].join(' '));

                        return true;
                    });
            });
        });

        describe(".handlers", function() {
            describe(".fire", function() {
                it("should record the fired metric", function() {
                    request('metrics.fire', {
                        store: 'store',
                        metric: 'metric',
                        agg: 'avg',
                        value: 2
                    }).then(function() {
                        assert.deepEqual(api.metrics.stores, {
                            store: {
                                metric: {
                                    agg: 'sum',
                                    values: [2]
                                }
                            }
                        });
                    });
                });
            });
        });
    });
});
