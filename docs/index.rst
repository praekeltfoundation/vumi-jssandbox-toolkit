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

   state_machine.rst
   states.rst
   http_api.rst

See also `Vumi Go's documentation <http://vumi-go.readthedocs.org/>`_.


Example Applications
--------------------

To get you started, here are some example applications that may be
useful as an example or reference.


JSBox Skeleton
~~~~~~~~~~~~~~

A `bare bones application <https://github.com/smn/go-jsbox-skeleton>`_
that you can use as a starting point. It's ready for you to read, adapt,
unit-test, deploy and use on your phone within minutes.

Contacts Example
~~~~~~~~~~~~~~~~

You can create, update and remove contact information in Vumi Go's contact
database. Here is an `example application <https://github.com/smn/go-contacts>`_
that shows you how.

Groups Example
~~~~~~~~~~~~~~

Want to access `Vumi Go <https://go.vumi.org/>`_'s groups?
The `Go Groups <https://github.com/smn/go-groups>`_
application shows you how to do that. It's a simple application that
lets you create, list, and search for groups via USSD.

Key Value Store Example
~~~~~~~~~~~~~~~~~~~~~~~

Want to store some data for your application? Have a look at the
`Key Value store <https://github.com/smn/go-kv-store>`_ example application.
Useful for if you need to maintain counters across sessions or have
some session information you want to hold on to.

Booklets!
~~~~~~~~~

Sometimes you have little nuggest of information that's shareable via
USSD. Specifically for that we've created the
`Booklet State <states.html#BookletState>`_. It allows you to page
through information over USSD. Here is an
`example application <https://github.com/smn/go-booklet-state/>`_ that
uses it.

SMS keywords
~~~~~~~~~~~~

An often used pattern with SMS shortcodes is to assign different
behaviour to different keywords.
The `sms keyword <https://github.com/smn/go-js-sms-keyword-handling>`_
application shows you how that can be done.

Events & Metrics
~~~~~~~~~~~~~~~~

Want to track growth or changes in your application over time?
The `events firing <https://github.com/smn/go-events-firing>`_ example
application shows you how that can be done. In the background this
publishes events to `Graphite <http://graphite.wikidot.com/>`_.

Google Maps Mashup
~~~~~~~~~~~~~~~~~~

An `example mashup <https://github.com/smn/go-google-maps>`_
combining USSD, Google Map's APIs and SMS. See how all these fit together
to create a super useful application that does geolocation and
delivery of directions via USSD & SMS.

.. note::

    This application is available in South Africa on ``*120*8864*1105#``.

Ushahidi
~~~~~~~~

We're big fans of `Ushahidi <http://ushahidi.com/>`_, the crisis
mapping tool. This `Ushahidi USSD app <https://github.com/smn/go-ushahidi>`_
is another mashup of USSD and the Ushahidi API. Allows
reporting of geolocated events via USSD to hosted Ushahidi instances.

.. note::

    This application is available in South Africa on ``*120*8864*1087#``.


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

