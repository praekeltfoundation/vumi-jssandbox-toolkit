var Q = require('q');

var assert = require("assert");
var utils = require("../../lib/utils");

describe("utils", function() {
    describe("call_possible_function", function() {
        it("should handle functions", function() {
          assert.equal(
              utils.call_possible_function(
                  function(b, c) { return this.a + b + c; },
                  {a: 'foo'},
                  ['bar', 'baz']),
              'foobarbaz');
        });

        it("should handle non-functions", function() {
            assert.equal(utils.call_possible_function('foo'), 'foo');
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
