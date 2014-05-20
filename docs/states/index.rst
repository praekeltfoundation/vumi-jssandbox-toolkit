States
======

States are the building blocks of sandbox applications.

.. toctree::
   :hidden:
   :maxdepth: 1

   overview.rst
   reference.rst


What are states?
----------------

A state corresponds to a small piece of an application. It might
represent a single question in a survey, a menu, a greeting to send or
a small booklet of text for someone to page through on their phone.

Each state has a name and a function to construct it, called its
creator. The creator takes the name of a state and options and should
return an instance of :class:`State`.

Each state should transfer control to the next state once it is done.

States often have text to be displayed (to a person on their phone)
and validation functions to parse input received.


How are applications built from states?
---------------------------------------

An application is a set of state creators collected into an
:class:`App`. An :class:`App` is controlled by an
:class:`InteractionMachine` which manages states and links an
application to the low-level sandbox API.

An :class:`InteractionMachine` received messages from people (via the
sandbox API) and directs those messages to the current state. It also
tracks what state a person is interacting with and manages transitions
to new states.

Last but not least, an :class:`InteractionMachine` provides a set of
high-level interfaces to the sandbox API's resources. These allow an
application to perform actions such as looking up or modifying a
contact, logging errors or warnings, making HTTP requests or storing
persistent data in a key-value store.


Delegation and virtual states
-----------------------------

Some state creators represent virtual states. Instead of returning a
state with the name associated with them, they return a state with a
different name. Virtual creators are said to `delegate` to another
state.

Delegators usually select between one of a set of other states and
help structure applications cleanly and avoid repetition of logic for
selecting which state to go to next.


What kinds of states are available?
-----------------------------------

An overview of the states available in the toolkit can be found in the
:doc:`overview`.


Reference
---------

A complete reference guide to the available states can be found in
the :doc:`reference`.
