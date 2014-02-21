Translation
===========

The toolkit supports internationalization using `gettext`_. Apps have an ``$``
attribute available that they can use when they would like to internationalize
their text. Here is a simple example:

.. _gettext: http://www.gnu.org/software/gettext/


.. code-block:: javascript

    var SomeApp = App.extend(function(self) {
        App.call(self);
        var $ = self.$;

        self.states.add('states:start', function(name) {
            return new FreeText(name, {
                question: $("Hello! Say something!"),
                next: 'states:end'
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: $.dgettext('messages', "That's nice, bye!")
            });
        });
    });

The gettext methods are well documented in the `python docs`_.

.. _python docs: http://docs.python.org/2/library/gettext.html


Under the hood
--------------

.. autojs:: ../lib/translate.js
