Overview of States
==================

The currently available states are:

* :ref:`FreeText <free-text>`
* :ref:`ChoiceState <choice-state>`
* :ref:`MenuState <menu-state>`
* :ref:`LanguageChoice <language-choice>`
* :ref:`PaginatedChoiceState <paginated-choice-state>`
* :ref:`BookletState <booklet-state>`
* :ref:`EndState <end-state>`


.. _free-text:

FreeText
--------

A free text state displays a message and allows a person to respond
with any text. It may optionally include a function to validate text
input and present an error message. It is the swiss army knife of
simple question and answer states.

See :class:`FreeText`.


.. _choice-state:

ChoiceState
-----------

A state which displays a list of numbered choices and allows a person
to respond by selecting one of the choices. Each choice has a value
(what is stored as the person's answer) and a label (the text that is
displayed). Choice states may optionally accept choice labels as input
(in addition to the number of the choice in the list).

See :class:`ChoiceState`.


.. _menu-state:

MenuState
---------

An extension of :ref:`ChoiceState <choice-state>` for selecting one of
a list of states to go to next.

See :class:`MenuState`.


.. _language-choice:

LanguageChoice
--------------

An extension of :ref:`ChoiceState <choice-state>` that allows a person
to select from a list of languages. The language choice is stored and
translations applied to future interactions (if translations are
provided).

See :class:`LanguageChoice`.


.. _paginated-choice-state:

PaginatedChoiceState
--------------------

An extension of :ref:`ChoiceState <choice-state>` for displaying long lists of
choices by spanning choices across multiple pages. Allows both automatically
dividing up the choices displayed on each page and fixing the number of choices
displayed on each page, optionally shortening the length of labels to ensure
that a specified character limit is not exceeded. Extremely useful for display
dynamic sets of options over USSD or SMS.

See :class:`PaginatedChoiceState`.


.. _booklet-state:

BookletState
------------

A state for displaying paginated text. Useful when presenting medium
length pieces of text or pages of related information that need to be
split across multiple USSD messages.

See :class:`BookletState`.


.. _end-state:

EndState
--------

This displays text and then terminates a session. Vital for ending
USSD sessions but also useful to mark the end of a set of interactions
with an application.

See :class:`EndState`.


Writing your own states
-----------------------

You can also write your own states!

Start by extending one of the existing states, or the base
:class:`State` class as needed.
