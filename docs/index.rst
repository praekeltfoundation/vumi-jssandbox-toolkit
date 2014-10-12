.. Vumi Javascript Sandbox Toolkit documentation master file, created by
   sphinx-quickstart on Thu Nov 28 17:37:03 2013.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Vumi Javascript Sandbox Toolkit's documentation!
===========================================================

This is the sandbox toolkit for making writing Javascript applications for
Vumi Go's Javascript sandbox.

.. toctree::
   :maxdepth: 1

   interaction_machine.rst
   app.rst
   states/index.rst
   log.rst
   user.rst
   config.rst
   contacts.rst
   http_api.rst
   metrics.rst
   events.rst
   tester.rst
   dummy.rst
   translate.rst
   outbound.rst
   utils.rst
   test_utils.rst

See also `Vumi Go's documentation <http://vumi-go.readthedocs.org/>`_.


Example Applications
--------------------

To get you started, here are some example applications that may be useful as an example or reference.

`Basic example`_
~~~~~~~~~~~~~~~~

A simple app with a :class:`ChoiceState` and two :class:`EndState`\s. Take a look to find out how to ask a user if they would like tea or coffee.

.. _Basic example: https://github.com/praekelt/vumi-jssandbox-toolkit/tree/release/0.2.x/examples/simple

`Contacts example`_
~~~~~~~~~~~~~~~~~~~

Shows the basics for getting and saving contacts, and how to test contacts-based apps.

.. _Contacts example: https://github.com/praekelt/vumi-jssandbox-toolkit/tree/release/0.2.x/examples/contacts

`Http example`_
~~~~~~~~~~~~~~~

Shows the basics for making http requests and using the responses.

.. _Http example: https://github.com/praekelt/vumi-jssandbox-toolkit/tree/release/0.2.x/examples/http


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
