var Q = require('q');

var assert = require("assert");
var utils = require("../lib/utils");

describe("utils", function() {
    describe("each_prop", function() {
        it("should iterate through each property", function() {
            var obj = {
                foo: 'bar',
                baz: 'qux'
            };

            var copy = {};
            utils.each_prop(obj, function(value, name) {
                copy[name] = value;
            });

            assert.deepEqual(obj, copy);
        });
    });

    describe("functor", function() {
        describe("if the object is a function", function() {
            it("should simply return the object", function() {
                function f() {}
                assert.equal(utils.functor(f), f);
            });
        });

        describe("if the object is not a function", function() {
            it("should wrap the object in a function", function() {
                var obj = {};
                var f = utils.functor(obj);
                assert.equal(f(), obj);
            });
        });
    });

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

    describe("update", function() {
        it("should update the destination with the source", function() {
            var obj = {
                a: 'foo',
                b: 'bar',
                c: 'baz'
            };

            assert.equal(obj, utils.update(obj, {
                a: 'lerp',
                c: null
            }));

           assert.deepEqual(obj, {
                a: 'lerp',
                b: 'bar',
                c: null
           });
        });

        it("should ignore the source's prototype properties", function() {
            var dest = {
                a: 'foo',
                b: 'bar',
                c: 'baz'
            };

            var src = Object.create({
                a: 'lerp',
                b: 'larp'
            });

            src.c = 'lorem';

            utils.update(dest, src);
            assert.deepEqual(dest, {
                a: 'foo',
                b: 'bar',
                c: 'lorem'
            });
        });
    });

    describe(".inherit", function() {
        it("should set up the child's prototype chain", function() {
            var Parent = function() {};
            var Child = utils.inherit(Parent, function() {});

            var c = new Child();
            assert(c instanceof Parent);
            assert(c instanceof Child);
        });

        it("should set the parent's static methods on the child",
        function() {
            var Parent = function() {};
            Parent.foo = 'bar';

            var Child = utils.inherit(Parent, function() {});
            assert.equal(Child.extend, Parent.extend);
            assert.equal(Child.foo, Parent.foo);
        });
    });

    describe(".url_encode", function() {
        it("should url encode an object of parameters", function() {
            assert.equal(
                'a=foo&b=bar&c=null',
                utils.url_encode([{
                    name: 'a',
                    value: 'foo'
                }, {
                    name: 'b',
                    value: 'bar'
                }, {
                    name: 'c',
                    value: null
                }]));
        });
    });

    describe(".starts_with", function() {
        it("should determine whether the one string starts with the other",
        function() {
            assert(utils.starts_with('', ''));
            assert(utils.starts_with('foo', ''));
            assert(utils.starts_with('foo', 'foo'));
            assert(utils.starts_with('foobar', 'foo'));
            assert(!utils.starts_with('foobar', 'foobarbaz'));
        });
    });

    describe("Extendable", function() {
        var Extendable = utils.Extendable;

        describe(".extend", function() {
            it("should set up the child's prototype chain", function() {
                var Parent = Extendable.extend(function() {});
                var Child = Parent.extend(function() {});

                var p = new Parent();
                var c = new Child();

                assert(p instanceof Extendable);
                assert(p instanceof Parent);

                assert(c instanceof Extendable);
                assert(c instanceof Parent);
                assert(c instanceof Child);
            });

            it("should set the parent's static methods on the child",
            function() {
                var Parent = Extendable.extend(function() {});
                assert.equal(Parent.extend, Extendable.extend);
                Parent.foo = 'bar';

                var Child = Parent.extend(function() {});
                assert.equal(Child.extend, Parent.extend);
                assert.equal(Child.foo, Parent.foo);
            });

            describe("the returned constructor function", function() {
                it("should pass `this` to the actual constructor as an arg",
                function() {
                    var Thing = Extendable.extend(function(self, foo) {
                        self.foo = foo;
                    });

                    var thing = new Thing('bar');
                    assert.equal(thing.foo, 'bar');
                });
            });
        });
    });
});
