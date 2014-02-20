var utils = require('./utils');
var Extendable = utils.Extendable;

var LazyTranslator = Extendable.extend(function(self) {
    /**class:LazyTranslator()

    Constructs :class:`LazyTranslation`s holding information for translation at
    a later stage.

    Supports the following gettext methods:
        - gettext
        - ngettext
        - dgettext
        - dngettext
        - lgettext
        - lngettext
        - ldngettex

    For information on how these methods should be used, see:
    http://docs.python.org/2/library/gettext.html.
    */
    self.methods = [
        'gettext',
        'ngettext',
        'dgettext',
        'dngettext',
        'lgettext',
        'lngettext',
        'ldngettext'
    ];

    self.support = function(method) {
        /**:support(method)

        Tells the the translator to support calls to ``method``.

        :param string method:
            The name of the method to support
        */
        self[method] = function() {
            return new LazyTranslation(method, arguments);
        };
    };

    self.methods.forEach(self.support);
});

var LazyTranslation = Extendable.extend(function(self, method, args) {
    /**class:LazyTranslation(method, args)
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

function apply_translation(i18n, text) {
    /**function:translate

    Accepts a jed instance and (possibly lazy translation) text and returns the
    translation result. If a string is provided, the function acts as a no-op.
    If a lazy translation is given, the function applies the translation using
    the ``i18n`` given in the constructor.

    :param Jed i18n:
        The jed instance to translate with
    :type text:
        string or :class:`LazyTranslation`
    :param text:
        Either a string or an object constructed by one of
        :class:`LazyTranslator`'s translation methods.
    */
    return text instanceof LazyTranslation
        ? i18n[text.method].apply(i18n, text.args)
        : text;
}


this.LazyTranslation = LazyTranslation;
this.LazyTranslator = LazyTranslator;
this.apply_translation = apply_translation;
