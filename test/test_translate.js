var _ = require('underscore');
var assert = require('assert');

var translate = require('../lib/translate');
var LazyTranslator = translate.LazyTranslator;


describe("LazyTranslator", function() {
    describe(".support", function() {
        it("should add a method which generates lazy translations",
        function() {
            var translator = new LazyTranslator();
            assert(!('foo' in translator));

            translator.support('foo');

            assert.deepEqual(translator.foo('bar', 'baz'), {
                method: 'foo',
                args: ['bar', 'baz'],
                lazy_translation: true
            });
        });
    });

    it("should support gettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(translator.gettext('message'), {
            method: 'gettext',
            args: ['message'],
            lazy_translation: true
        });
    });

    it("should support ngettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(translator.ngettext('singular', 'plural', 'n'), {
            method: 'ngettext',
            args: ['singular', 'plural', 'n'],
            lazy_translation: true
        });
    });

    it("should support dgettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(translator.dgettext('domain', 'message'), {
            method: 'dgettext',
            args: ['domain', 'message'],
            lazy_translation: true
        });
    });

    it("should support dngettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(
            translator.dgettext('domain', 'singular', 'plural', 'n'),
            {
                method: 'dgettext',
                args: ['domain', 'singular', 'plural', 'n'],
                lazy_translation: true
            });
    });

    it("should support lgettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(
            translator.lgettext('message'),
            {
                method: 'lgettext',
                args: ['message'],
                lazy_translation: true
            });
    });

    it("should support lngettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(
            translator.lngettext('singular', 'plural', 'n'),
            {
                method: 'lngettext',
                args: ['singular', 'plural','n'],
                lazy_translation: true
            });
    });

    it("should support ldngettext", function() {
        var translator = new LazyTranslator();
        assert.deepEqual(
            translator.ldngettext('domain', 'singular', 'plural', 'n'),
            {
                method: 'ldngettext',
                args: ['domain', 'singular', 'plural','n'],
                lazy_translation: true
            });
    });
});

describe("translate", function() {
    describe("if a lazy translation was given", function() {
        it("should apply the corresponding method and args to the i18n instance",
        function() {
            var translator = new LazyTranslator();
            translator.support('foo');

            assert.equal(
                translate.translate(
                    {foo: _.identity},
                    translator.foo('bar')),
                'bar');
        });
    });

    describe("if a lazy translation was not given", function() {
        it("should simply return what it was given", function() {
            assert.equal(translate.translate({}, 3), 3);
            assert.equal(translate.translate({}, 'foo'), 'foo');
        });
    });
});
