var Q = require('q');

var assert = require("assert");
var utils = require("../../lib/utils");

describe("utils", function() {
    describe("maybe_call", function() {
        it("should handle functions", function() {
            function f(b, c) {
                return this.a + b + c;
            }

            assert.equal(
                utils.maybe_call(f, {a: 'foo'}, ['bar', 'baz']),
                'foobarbaz');
        });

        it("should handle non-functions", function() {
            assert.equal(utils.maybe_call('foo'), 'foo');
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
               e: 'corge'
           });
        });

        it("should not set defaults that are undefined", function() {
            var obj = {};
            utils.set_defaults(obj, {foo: obj.foo});
            assert.deepEqual(obj, {});
        });
    });
});
