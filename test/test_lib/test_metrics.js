var assert = require("assert");
var dummy_api = require("../../lib/dummy_api");
var metrics = require("../../lib/metrics");

var DummyApi = dummy_api.DummyApi;
var MetricStore = metrics.MetricStore;

describe("MetricStore", function() {
    var api;
    var store;

    beforeEach(function() {
        api = new DummyApi();
        store = new MetricStore(api, 'luke_the_store');
    });

    describe(".fire", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire('yaddle-the-metric', 23,  'sum')
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire('yoda_the_metric', 23,  'sum');
            store.fire('yoda_the_metric', 42,  'sum');
            store.fire('yaddle_the_metric', 22,  'avg');

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'sum',
                            values: [23, 42]
                        },
                        yaddle_the_metric: {
                            agg: 'avg',
                            values: [22]
                        }
                    }
                });
            }).nodeify(done);
        });
    });

    describe(".fire_sum", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire_sum('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire_sum('yoda_the_metric', 23);
            store.fire_sum('yoda_the_metric', 42);
            store.fire_sum('yaddle_the_metric', 22);

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'sum',
                            values: [23, 42]
                        },
                        yaddle_the_metric: {
                            agg: 'sum',
                            values: [22]
                        }
                    }
                });
            }).nodeify(done);
        });
    });

    describe(".fire_avg", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire_avg('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire_avg('yoda_the_metric', 23);
            store.fire_avg('yoda_the_metric', 42);
            store.fire_avg('yaddle_the_metric', 22);

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'avg',
                            values: [23, 42]
                        },
                        yaddle_the_metric: {
                            agg: 'avg',
                            values: [22]
                        }
                    }
                });
            }).nodeify(done);
        });
    });

    describe(".fire_min", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire_min('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire_min('yoda_the_metric', 23);
            store.fire_min('yoda_the_metric', 42);
            store.fire_min('yaddle_the_metric', 22);

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'min',
                            values: [23, 42]
                        },
                        yaddle_the_metric: {
                            agg: 'min',
                            values: [22]
                        }
                    }
                });
            }).nodeify(done);
        });
    });

    describe(".fire_max", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire_max('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire_max('yoda_the_metric', 23);
            store.fire_max('yoda_the_metric', 42);
            store.fire_max('yaddle_the_metric', 22);

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'max',
                            values: [23, 42]
                        },
                        yaddle_the_metric: {
                            agg: 'max',
                            values: [22]
                        }
                    }
                });
            }).nodeify(done);
        });
    });

    describe(".fire_inc", function() {
        it("should return the status of the fire call", function(done) {
            store
                .fire_inc('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                })
                .nodeify(done);
        });

        it("should record the metric", function(done) {
            assert.deepEqual(api.metrics, {});

            store.fire_inc('yoda_the_metric');
            store.fire_inc('yoda_the_metric');
            store.fire_inc('yaddle_the_metric');

            api.pending_calls_complete().then(function() {
                assert.deepEqual(api.metrics, {
                    luke_the_store:{
                        yoda_the_metric: {
                            agg: 'sum',
                            values: [1, 1]
                        },
                        yaddle_the_metric: {
                            agg: 'sum',
                            values: [1]
                        }
                    }
                });
            }).nodeify(done);
        });
    });
});
