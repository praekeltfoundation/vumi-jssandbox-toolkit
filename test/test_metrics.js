var assert = require("assert");

var vumigo = require("../lib");
var test_utils = vumigo.test_utils;

var metrics = require("../lib/metrics");
var MetricStore = metrics.MetricStore;


describe("MetricStore", function() {
    var im;
    var metrics;

    beforeEach(function() {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;
            metrics = im.metrics;
        });
    });

    describe(".setup", function() {
        var metrics;

        beforeEach(function() {
            metrics = new MetricStore(im);
        });

        it("should emit a 'setup' event", function() {
            var p = metrics.once.resolved('setup');
            return metrics.setup().thenResolve(p);
        });
    });

    describe(".fire", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire('yaddle-the-metric', 23,  'sum')
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire('yoda_the_metric', 23,  'sum');
            metrics.fire('yoda_the_metric', 42,  'sum');
            metrics.fire('yaddle_the_metric', 22,  'avg');

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });

    describe(".fire_sum", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire_sum('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire_sum('yoda_the_metric', 23);
            metrics.fire_sum('yoda_the_metric', 42);
            metrics.fire_sum('yaddle_the_metric', 22);

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });

    describe(".fire_avg", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire_avg('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire_avg('yoda_the_metric', 23);
            metrics.fire_avg('yoda_the_metric', 42);
            metrics.fire_avg('yaddle_the_metric', 22);

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });

    describe(".fire_min", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire_min('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire_min('yoda_the_metric', 23);
            metrics.fire_min('yoda_the_metric', 42);
            metrics.fire_min('yaddle_the_metric', 22);

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });

    describe(".fire_max", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire_max('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire_max('yoda_the_metric', 23);
            metrics.fire_max('yoda_the_metric', 42);
            metrics.fire_max('yaddle_the_metric', 22);

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });

    describe(".fire_inc", function() {
        it("should return the status of the fire call", function() {
            return metrics
                .fire_inc('yaddle-the-metric', 23)
                .then(function(success) {
                    assert(success);
                });
        });

        it("should record the metric", function() {
            assert.deepEqual(im.api.metrics, {});

            metrics.fire_inc('yoda_the_metric');
            metrics.fire_inc('yoda_the_metric');
            metrics.fire_inc('yaddle_the_metric');

            return im.api.pending_calls_complete().then(function() {
                assert.deepEqual(im.api.metrics, {
                    test_app:{
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
            });
        });
    });
});
