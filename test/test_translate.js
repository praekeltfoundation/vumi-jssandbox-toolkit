var _ = require('underscore');
var assert = require('assert');

var translate = require('../lib/translate');
var Translator = translate.Translator;
var LazyTranslator = translate.LazyTranslator;
var LazyTranslation = translate.LazyTranslation;


describe(".translate", function() {
    describe("LazyTranslator", function() {
        describe(".support", function() {
            it("should add a method which generates lazy translations",
            function() {
                var translator = new LazyTranslator();
                assert(!('foo' in translator));

                translator.support('foo');

                var translation = translator.foo('bar', 'baz');
                assert(translation instanceof LazyTranslation);
                assert.equal(translation.method, 'foo');
                assert.deepEqual(translation.args, ['bar', 'baz']);
            });
        });

        it("should use gettext when used as a function", function() {
            var translator = new LazyTranslator();
            var translation = translator('message');
            assert.equal(translation.method, 'gettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support gettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.gettext('message');
            assert.equal(translation.method, 'gettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support ngettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.ngettext('singular', 'plural', 'n');
            assert.equal(translation.method, 'ngettext');
            assert.deepEqual(translation.args, ['singular', 'plural', 'n']);
        });

        it("should support dgettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.dgettext('domain', 'message');
            assert.equal(translation.method, 'dgettext');
            assert.deepEqual(translation.args, ['domain', 'message']);
        });

        it("should support dngettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.dgettext(
                'domain', 'singular', 'plural', 'n');

            assert.equal(translation.method, 'dgettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'singular', 'plural', 'n']);
        });

        it("should support lgettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.lgettext('message');
            assert.equal(translation.method, 'lgettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support lngettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.lngettext('singular', 'plural', 'n');
            assert.equal(translation.method, 'lngettext');
            assert.deepEqual(translation.args, ['singular', 'plural', 'n']);
        });

        it("should support ldngettext", function() {
            var translator = new LazyTranslator();
            var translation = translator.lngettext(
                'domain', 'singular', 'plural', 'n');

            assert.equal(translation.method, 'lngettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'singular', 'plural', 'n']);
        });
    });

    describe("Translator", function() {
        describe("if a lazy translation was given", function() {
            it("should apply the corresponding method and args to the i18n instance",
            function() {
                var lazy_translator = new LazyTranslator();
                lazy_translator.support('foo');

                var translator = new Translator({foo: _.identity});
                assert.equal(translator(lazy_translator.foo('bar')), 'bar');
            });
        });

        describe("if a lazy translation was not given", function() {
            it("should simply return what it was given", function() {
                assert.equal(translate.apply_translation({}, 3), 3);
                assert.equal(translate.apply_translation({}, 'foo'), 'foo');
            });
        });
    });

    describe("apply_translation", function() {
        describe("if a lazy translation was given", function() {
            it("should apply the corresponding method and args to the i18n instance",
            function() {
                var translator = new LazyTranslator();
                translator.support('foo');

                assert.equal(
                    translate.apply_translation(
                        {foo: _.identity},
                        translator.foo('bar')),
                    'bar');
            });
        });

        describe("if a lazy translation was not given", function() {
            it("should simply return what it was given", function() {
                assert.equal(translate.apply_translation({}, 3), 3);
                assert.equal(translate.apply_translation({}, 'foo'), 'foo');
            });
        });
    });
});
