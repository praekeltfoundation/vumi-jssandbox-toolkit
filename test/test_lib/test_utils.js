var Q = require('q');

var assert = require("assert");
var utils = require("../../lib/utils");

describe("utils", function() {
    describe("call_possible_function", function() {
        it("should handle sync functions", function(done) {
            utils
                .call_possible_function(
                    function(b, c) { return this.a + b + c; },
                    {a: 'foo'},
                    ['bar', 'baz'])
                .then(function(result) {
                    assert.equal(result, 'foobarbaz');
                })
                .then(done, done);
        });

        it("should handle async functions", function(done) {
            utils
                .call_possible_function(
                    function(b, c) {
                        var d = Q.defer();

                        var self = this;
                        setImmediate(function() {
                            return d.resolve(self.a + b + c);
                        });

                        return d.promise;
                    },
                    {a: 'foo'},
                    ['bar', 'baz'])
                .then(function(result) {
                    assert.equal(result, 'foobarbaz');
                })
                .then(done, done);
        });

        it("should handle non-functions", function(done) {
            utils
                .call_possible_function('foo')
                .then(function(result) {
                    assert.equal(result, 'foo');
                })
                .then(done, done);
        });
    });

    describe("set_defaults", function() {
        it("should set defaults on the object", function() {
            var obj = {
                a: 'foo',
                c: null,
                d: false,
                e: undefined
            };

            assert.equal(obj, utils.set_defaults(obj, {
                a: 'bar',
                b: 'baz',
                c: 'qux',
                d: 'quux',
                e: 'corge'
            }));

           assert.deepEqual(obj, {
               a: 'foo',
               b: 'baz',
               c: null,
               d: false,
               e: undefined
           });
        });
    });
});
