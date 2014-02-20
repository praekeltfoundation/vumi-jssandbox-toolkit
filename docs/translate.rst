Translation
===========


The toolkit supports internationalization using `gettext`_. Apps have an ``$``
attribute available that they can use when they would like to internationalize
their text. Here is a simple example:

.. _gettext: http://docs.python.org/2/library/gettext.html


.. code-block:: javascript

    var SomeApp = App.extend(function(self) {
        App.call(self);

        self.states.add('states:start', function(name) {
            return new EndState(name, {
                question: self.$("Hello! Say something!"),
                next: 'states:end'
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: self.$.dgettext('messages', "That's nice, bye!")
            });
        });
    });


Under the hood
--------------

.. autojs:: ../lib/translate.js
