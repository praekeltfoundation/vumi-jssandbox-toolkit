var Jed = require('jed');
var assert = require('assert');

var vumigo = require('../lib');
var fixtures = vumigo.fixtures;
var translate = vumigo.translate;
var Translator = translate.Translator;
var LazyTranslator = translate.LazyTranslator;
var LazyText = translate.LazyText;


describe(".translate", function() {
    describe("LazyTranslator", function() {
        describe(".support", function() {
            it("should add a method which generates lazy translations",
            function() {
                var $ = new LazyTranslator();
                assert(!('foo' in $));

                $.support('foo');

                var translation = $.foo('bar', 'baz');
                assert(translation instanceof LazyText);
                assert.equal(translation.method, 'foo');
                assert.deepEqual(translation.args, ['bar', 'baz']);
            });
        });

        it("should use gettext when used as a function", function() {
            var $ = new LazyTranslator();
            var translation = $('message');
            assert.equal(translation.method, 'gettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support gettext", function() {
            var $ = new LazyTranslator();
            var translation = $.gettext('message');
            assert.equal(translation.method, 'gettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support ngettext", function() {
            var $ = new LazyTranslator();
            var translation = $.ngettext('singular', 'plural', 'n');
            assert.equal(translation.method, 'ngettext');
            assert.deepEqual(translation.args, ['singular', 'plural', 'n']);
        });

        it("should support dgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.dgettext('domain', 'message');
            assert.equal(translation.method, 'dgettext');
            assert.deepEqual(translation.args, ['domain', 'message']);
        });

        it("should support dngettext", function() {
            var $ = new LazyTranslator();
            var translation = $.dgettext(
                'domain', 'singular', 'plural', 'n');

            assert.equal(translation.method, 'dgettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'singular', 'plural', 'n']);
        });

        it("should support lgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.lgettext('message');
            assert.equal(translation.method, 'lgettext');
            assert.deepEqual(translation.args, ['message']);
        });

        it("should support lngettext", function() {
            var $ = new LazyTranslator();
            var translation = $.lngettext('singular', 'plural', 'n');
            assert.equal(translation.method, 'lngettext');
            assert.deepEqual(translation.args, ['singular', 'plural', 'n']);
        });

        it("should support ldngettext", function() {
            var $ = new LazyTranslator();
            var translation = $.lngettext(
                'domain', 'singular', 'plural', 'n');

            assert.equal(translation.method, 'lngettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'singular', 'plural', 'n']);
        });
    });

    describe("Translator", function() {
        describe("if a lazy translation was given", function() {
            it("should apply the corresponding method and args",
            function() {
                var $ = new LazyTranslator();
                var i18n = new Translator(fixtures.lang('af'));
                assert.equal(i18n($.gettext('yes')), 'ja');
            });
        });

        describe("if a lazy translation was not given", function() {
            it("should simply return what it was given", function() {
                var i18n = new Translator();
                assert.equal(i18n(3), 3);
                assert.equal(i18n('foo'), 'foo');
            });
        });
    });

    describe("apply_translation", function() {
        describe("if a lazy translation was given", function() {
            it("should translate the text", function() {
                var jed = new Jed(fixtures.lang('af'));
                var translator = new LazyTranslator();
                var text = translator.gettext('yes');
                assert.equal(translate.apply_translation(jed, text), 'ja');
            });
        });

        describe("if a lazy translation was not given", function() {
            it("should simply return what it was given", function() {
                var jed = new Jed(fixtures.lang('af'));
                assert.equal(translate.apply_translation(jed, 3), 3);
                assert.equal(translate.apply_translation(jed, 'foo'), 'foo');
            });
        });
    });
});
