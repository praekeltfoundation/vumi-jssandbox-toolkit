var _ = require('lodash');
var assert = require('assert');
var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;


describe("log.api", function() {
    var im;

    function contains_one(data, msg) {
        var matches = _.where(data, msg);
        return matches.length === 0;
    }

    beforeEach(function() {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;
        });
    });

    describe("Logger", function() {
        it("should log to the INFO log level if invoked directly", function() {
            return im.log('foo').then(function(result) {
                assert(contains_one(im.api.log.info, 'foo'));
            });
        });

        describe(".debug", function() {
            it("should log to the DEBUG log level", function() {
                return im.log.debug('foo').then(function(result) {
                    assert(contains_one(im.api.log.debug, 'foo'));
                });
            });
        });

        describe(".info", function() {
            it("should log to the INFO log level", function() {
                return im.log.info('foo').then(function(result) {
                    assert(contains_one(im.api.log.info, 'foo'));
                });
            });
        });

        describe(".warning", function() {
            it("should log to the WARNING log level", function() {
                return im.log.warning('foo').then(function(result) {
                    assert(contains_one(im.api.log.warning, 'foo'));
                });
            });
        });

        describe(".error", function() {
            it("should log to the ERROR log level", function() {
                return im.log.error('foo').then(function(result) {
                    assert(contains_one(im.api.log.error, 'foo'));
                });
            });
        });

        describe(".critical", function() {
            it("should log to the CRITICAL log level", function() {
                return im.log.critical('foo').then(function(result) {
                    assert(contains_one(im.api.log.critical, 'foo'));
                });
            });
        });
    });
});
