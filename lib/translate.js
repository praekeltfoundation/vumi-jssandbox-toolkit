var Jed = require('jed');
var utils = require('./utils');
var Extendable = utils.Extendable;


var LazyTranslator = Extendable.extend(function(self) {
    /**class:LazyTranslator()

    Constructs :class:`LazyText` instances holding information for translation
    at a later stage.

    Supports the following gettext methods:
        - gettext = fn(key)
        - dgettext = fn(domain, key)
        - ngettext = fn(singular_key, plural_key, value)
        - dngettext = fn(domain, singular_ley, plural_key, value)
        - pgettext = fn(context, key)
        - dpgettext = fn(domain, context, key)
        - npgettext = fn(context, singular_key, plural_key, value)
        - dnpgettext = fn(domain, context, singular_key, plural_key, value)

    For information on how these methods should be used, see:
    http://slexaxton.github.io/Jed/
    */
    self = function() {
        return self.gettext.apply(self, arguments);
    };

    self.methods = [
        'gettext',
        'dgettext',
        'ngettext',
        'dngettext',
        'pgettext',
        'dpgettext',
        'npgettext',
        'dnpgettext',
    ];

    self.support = function(method) {
        /**:support(method)

        Tells the the translator to support calls to ``method``.

        :param string method:
            The name of the method to support
        */
        self[method] = function() {
            return new LazyText(method, arguments);
        };
    };

    self.methods.forEach(self.support);
    return self;
});


var LazyText = Extendable.extend(function(self, method, args) {
    /**class:LazyText(method, args)
    Holds information about text to be translated at a later stage.

    :param string method:
        The gettext method to use for translation
    :type args:
        array or arguments
    :param array args:
        The args given to the gettext method to perform the translation
    **/
    self.method = method;
    self.args = Array.prototype.slice.call(args);
});


var Translator = Extendable.extend(function(self, jed) {
    /**class:Translator(jed)
    Constructs functions of the form ``f(text)``, where ``text`` is a string or
    a :class:`LazyText`. If a string is provided, the function acts as a
    no-op.  If a lazy translation is given, the function applies the translation
    using the translator's ``jed`` instance.

    :type jed:
        Jed or object
    :param Jed jed:
        A jed instance or options to initialise such a jed instance to
        translate with.
    */
    self = function(text) {
        return apply_translation(self.jed, text);
    };

    /**Translator.jed
    Direct access to the translator's :class:`Jed` instance.
    */
    self.jed = !(jed instanceof Jed)
        ? new Jed(jed || {})
        : jed;

    return self;
});


function apply_translation(jed, text) {
    /**function:apply_translation(jed, text)

    Accepts a jed instance and (possibly lazy translation) text and returns the
    translation result. If a string is provided, the function acts as a no-op.
    If a lazy translation is given, the function applies the translation using
    the ``jed`` given in the constructor.

    :param Jed jed:
        The jed instance to translate with
    :type text:
        string or :class:`LazyText`
    :param text:
        Either a string or an object constructed by one of
        :class:`LazyTranslator`'s translation methods.
    */
    return text instanceof LazyText
        ? jed[text.method].apply(jed, text.args)
        : text;
}


this.Translator = Translator;
this.LazyTranslator = LazyTranslator;
this.LazyText = LazyText;
this.apply_translation = apply_translation;
