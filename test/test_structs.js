var assert = require('assert');

var vumigo = require('../lib');
var structs = vumigo.structs;
var Model = structs.Model;


describe("models", function() {
    describe("Model", function() {
        describe(".reset", function() {
            it("should validate the model", function() {
                var model = new Model();

                var validated = false;
                model.validate = function() {
                    validated = true;
                };

                model.reset();
                assert(validated);
            });

            it("should reset the model's attributes", function() {
                var model = new Model({
                    foo: 'bar',
                    baz: 'qux'
                });

                assert.deepEqual(model.attrs, {
                    foo: 'bar',
                    baz: 'qux'
                });

                model.reset({
                    foo: 'lorem',
                    lerp: 'larp'
                });

                assert.deepEqual(model.attrs, {
                    foo: 'lorem',
                    lerp: 'larp'
                });
            });
        });

        describe(".serialize", function() {
            it("should validate the model", function() {
                var model = new Model();

                var validated = false;
                model.validate = function() {
                    validated = true;
                };

                model.serialize();
                assert(validated);
            });

            it("should return a deep copy of its attributes", function() {
                var model = new Model({
                    foo: 'bar',
                    baz: 'qux'
                });

                assert.deepEqual(model.serialize(), {
                    foo: 'bar',
                    baz: 'qux'
                });
            });
        });
    });
});
