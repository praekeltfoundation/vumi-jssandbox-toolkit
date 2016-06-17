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

        it("should support dgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.dgettext('domain', 'message');
            assert.equal(translation.method, 'dgettext');
            assert.deepEqual(translation.args, ['domain', 'message']);
        });

        it("should support ngettext", function() {
            var $ = new LazyTranslator();
            var translation = $.ngettext('singular', 'plural', 'n');
            assert.equal(translation.method, 'ngettext');
            assert.deepEqual(translation.args, ['singular', 'plural', 'n']);
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

        it("should support pgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.pgettext('context', 'message');
            assert.equal(translation.method, 'pgettext');
            assert.deepEqual(translation.args, ['context', 'message']);
        });

        it("should support dpgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.dpgettext('domain', 'context', 'message');

            assert.equal(translation.method, 'dpgettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'context', 'message']);
        });

        it("should support npgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.npgettext(
                'context', 'singular', 'plural', 'n');
            assert.equal(translation.method, 'npgettext');
            assert.deepEqual(
                translation.args,
                ['context', 'singular', 'plural', 'n']);
        });

        it("should support dnpgettext", function() {
            var $ = new LazyTranslator();
            var translation = $.dnpgettext(
                'domain', 'context', 'singular', 'plural', 'n');

            assert.equal(translation.method, 'dnpgettext');
            assert.deepEqual(
                translation.args,
                ['domain', 'context', 'singular', 'plural', 'n']);
        });
    });

    describe("LazyText", function() {
        describe(".apply_translation", function() {
            it("should apply the given translation", function() {
                var $ = new LazyTranslator();
                var jed = new Jed(fixtures.lang('af'));
                assert.equal($('yes').apply_translation(jed), 'ja');
            });

            it("should apply its context", function() {
                var $ = new LazyTranslator();
                var lang = fixtures.lang('af');

                lang.locale_data.messages["there is an alien"] = [
                    "there are {{ n }} aliens",
                    "daar is 'n ruimeteweser",
                    "daar is {{ n }} ruimetewesers"
                ];

                var result = $
                    .ngettext(
                        'there is an alien',
                        'there are {{ n }} aliens',
                        3)
                    .context({n: 3})
                    .apply_translation(new Jed(lang));

                assert.equal(result, 'daar is 3 ruimetewesers');
            });

            it("should support nested lazy text", function() {
                var $ = new LazyTranslator();
                var lang = fixtures.lang('af');

                lang.locale_data.messages["foo {{a}}"] = ["", "oof {{a}}", ""];
                lang.locale_data.messages["bar {{b}}"] = ["", "rab {{b}}", ""];
                lang.locale_data.messages.baz = ["", "zab", ""];

                var result = $('foo {{a}}')
                    .context({a: $('bar {{b}}').context({b: $('baz')})})
                    .apply_translation(new Jed(lang));

                assert.equal(result, 'oof rab zab');
            });
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
