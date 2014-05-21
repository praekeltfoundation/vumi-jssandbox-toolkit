var _ = require('lodash');
var assert = require('assert');

var vumigo = require('../lib');
var structs = vumigo.structs;
var Model = structs.Model;
var Opts = structs.Opts;


describe("structs", function() {
    describe("Model", function() {
        describe(".do.clear", function() {
            it("should clear all of the model's attributes", function() {
                var model = new Model({
                    foo: 'bar',
                    baz: 'qux'
                });

                assert.deepEqual(model, {
                    foo: 'bar',
                    baz: 'qux'
                });

                model.do.clear();

                assert.deepEqual(model, {});
            });
        });

        describe(".do.reset", function() {
            it("should parse the given attributes", function() {
                var model = new Model();

                model.do.parse = function(attrs) {
                    attrs.foo = attrs.foo + '!';
                    return attrs;
                };

                model.do.reset({foo: 'bar'});
                assert.equal(model.foo, 'bar!');
            });

            it("should validate the model", function() {
                var model = new Model();

                var validated = false;
                model.do.validate = function() {
                    validated = true;
                };

                model.do.reset();
                assert(validated);
            });

            it("should reset the model's attributes", function() {
                var model = new Model({
                    foo: 'bar',
                    baz: 'qux'
                });

                assert.deepEqual(model, {
                    foo: 'bar',
                    baz: 'qux'
                });

                model.do.reset({
                    foo: 'lorem',
                    lerp: 'larp'
                });

                assert.deepEqual(model, {
                    foo: 'lorem',
                    lerp: 'larp'
                });
            });

            it("should apply the model's default attributes", function() {
                var model = new Model();

                model.cls.defaults = {
                    'foo': 'lerp',
                    'baz': 'larp'
                };

                model.do.reset({foo: 'bar'});
                assert.deepEqual(model, {
                    foo: 'bar',
                    baz: 'larp'
                });
            });
        });

        describe(".do.serialize", function() {
            it("should validate the model", function() {
                var model = new Model();

                var validated = false;
                model.cls.validate = function() {
                    validated = true;
                };

                model.do.serialize();
                assert(validated);
            });

            it("should return a deep copy of its attributes", function() {
                var model = new Model({
                    foo: 'bar',
                    baz: {qux: 'corge'}
                });

                var data = model.do.serialize();
                assert.deepEqual(data, {
                    foo: 'bar',
                    baz: {qux: 'corge'}
                });

                data.foo = 'spam';
                data.baz.qux = 'ham';

                assert.deepEqual(model, {
                    foo: 'bar',
                    baz: {qux: 'corge'}
                });
            });
        });

        it("should allow only model attributes to be enumerable", function() {
            var model = new Model({foo: 'bar'});
            model.cls.spam = 'ham';
            assert.deepEqual(_.keys(model), ['foo']);
        });

        describe(".extend", function() {
            it("should set up the child's prototype chain", function() {
                var Parent = Model.extend(function() {});
                var Child = Parent.extend(function() {});

                var p = new Parent();
                var c = new Child();

                assert(p instanceof Model);
                assert(p instanceof Parent);

                assert(c instanceof Model);
                assert(c instanceof Parent);
                assert(c instanceof Child);
            });

            it("should set the parent's static methods on the child",
            function() {
                var Parent = Model.extend(function() {});
                assert.equal(Parent.extend, Model.extend);
                Parent.foo = 'bar';

                var Child = Parent.extend(function() {});
                assert.equal(Child.extend, Parent.extend);
                assert.equal(Child.foo, Parent.foo);
            });

            it("should pass the context as the first constructor arg",
            function() {
                var Thing = Model.extend(function(self) {
                    assert.strictEqual(self, this);
                });

                new Thing();
            });

            it("should ensure all constructors get the correct context",
            function() {
                var parent_context;
                var child_context;

                var Parent = Model.extend(function(self) {
                    parent_context = self;
                    Model.call(self);
                });

                var Child = Parent.extend(function(self) {
                    child_context = self;
                    Parent.call(self);
                });

                var context = new Child();
                assert.strictEqual(context, child_context);
                assert.strictEqual(child_context, parent_context);
            });
        });
    });

    describe("Opts", function() {
        it("should support option inheritance", function() {
            var ThingOpts = Opts.extend().support('samuel');
            var SubthingOpts = ThingOpts.extend().support('leroy');
            var SubsubthingOpts = SubthingOpts.extend().support('jackson');

            var opts = new SubsubthingOpts({
                samuel: 'foo',
                leroy: 'bar',
                jackson: 'baz'
            });

            assert.equal(opts.samuel(), 'foo');
            assert.equal(opts.leroy(), 'bar');
            assert.equal(opts.jackson(), 'baz');
        });

        it("should support defaults", function() {
            var ThingOpts = Opts.extend().support('samuel', {default: 'foo'});
            var opts = new ThingOpts();
            assert.equal(opts.samuel(), 'foo');
        });

        it("should support defaults inheritance", function() {
            var ThingOpts = Opts
                .extend()
                .support('samuel', {default: 'foo'});

            var SubthingOpts = ThingOpts
                .extend()
                .support('leroy', {default: 'bar'});

            var SubsubthingOpts = SubthingOpts
                .extend()
                .support('leroy', {default: 'spam'})
                .support('jackson', {default: 'baz'});

            var opts = new SubthingOpts();
            assert.equal(opts.samuel(), 'foo');
            assert.equal(opts.leroy(), 'bar');

            opts = new SubsubthingOpts();
            assert.equal(opts.samuel(), 'foo');
            assert.equal(opts.leroy(), 'spam');
            assert.equal(opts.jackson(), 'baz');
        });

        it("should allow options to be given as values", function() {
            var ThingOpts = Opts.extend().support('samuel');
            var opts = new ThingOpts().samuel('foo');
            assert.equal(opts.samuel(), 'foo');
        });

        it("should show allow options to be given as functions", function() {
            var ThingOpts = Opts.extend().support('samuel');
            var opts = new ThingOpts().samuel(function() {
                return 'foo';
            });

            assert.equal(opts.samuel(), 'foo');
        });

        describe(".do.update", function() {
            it("should set the given options", function() {
                var ThingOpts = Opts
                    .extend()
                    .support('samuel')
                    .support('leroy');

                var opts = new ThingOpts();
                opts.do.update({
                    'samuel': 'foo',
                    'leroy': 'bar'
                });
                assert.equal(opts.samuel(), 'foo');
                assert.equal(opts.leroy(), 'bar');
            });
        });

        describe(".do.set", function() {
            it("should set the given option", function() {
                var ThingOpts = Opts.extend().support('samuel');
                var opts = new ThingOpts();
                opts.do.set('samuel', 'foo');
                assert.equal(opts.samuel(), 'foo');
            });

            it("should throw an error if an unsupported option is given",
            function() {
                assert.throws(function() {
                    var opts = new Opts();
                    opts.do.set('samuel', 'foo');
                }, /Cannot set 'samuel', option not supported/);
            });
        });

        describe(".do.get", function() {
            it("should get the given option", function() {
                var ThingOpts = Opts.extend().support('samuel');
                var opts = new ThingOpts().samuel('foo');
                assert.equal(opts.do.get('samuel'), 'foo');
            });

            it("should pass on the given arguments", function() {
                var ThingOpts = Opts.extend().support('samuel');

                var opts = new ThingOpts().samuel(function() {
                    return Array.prototype.slice.call(arguments);
                });

                assert.deepEqual(
                    opts.do.get('samuel', 'foo', 'bar'),
                    ['foo', 'bar']);
            });

            it("should throw an error if an unsupported option is given",
            function() {
                assert.throws(function() {
                    var opts = new Opts();
                    opts.do.get('samuel');
                }, /Cannot get 'samuel', option not supported/);
            });
        });
    });
});
