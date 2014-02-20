var utils = require('./utils');
var Extendable = utils.Extendable;

var LazyTranslator = Extendable.extend(function(self) {
    /**class:LazyTranslator()

    Constructs objects holding information for translation at a later stage.

    Supports the following gettext methods:
        - gettext
        - ngettext
        - dgettext
        - dngettext
        - lgettext
        - lngettext
        - ldngettex

    For information on how these methods should be used, see:
    http://docs.python.org/2/library/gettext.html
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
            return {
                method: method,
                args: Array.prototype.slice.call(arguments),
                lazy_translation: true
            };
        };
    };

    self.methods.forEach(self.support);
});


function apply_translation(i18n, text) {
    /**function:translate

    Accepts a jed instance and (possibly lazy translation) text and
    returns the translation result

    :param Jed i18n:
        The jed instance to translate with
    :type text:
        string or lazy translation
    :param text:
        Either a string or an object constructed by one of
        :class:`LazyTranslator`'s translation methods.
    */
    return text && text.lazy_translation
        ? i18n[text.method].apply(i18n, text.args)
        : text;
}


this.apply_translation = apply_translation;
this.LazyTranslator = LazyTranslator;
