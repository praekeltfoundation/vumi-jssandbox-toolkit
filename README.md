Vumi Javascript Sandbox Toolkit
===============================

Javascript toolkit and examples for use with the Vumi Javascript
sandbox.

Documentation available online at
http://vumi-jssandbox-toolkit.readthedocs.org/ and in the `docs`
directory of the repository.

|vjst-ci|_

.. |vjst-ci| image:: https://travis-ci.org/praekelt/vumi-jssandbox-toolkit.png?branch=develop
.. _vjst-ci: https://travis-ci.org/praekelt/vumi-jssandbox-toolkit

To run tests locally::

    $ npm install
    $ npm test

To build the docs locally::

    $ virtualenv --no-site-packages ve/
    $ source ve/bin/activate
    (ve)$ pip install Sphinx
    (ve)$ cd docs
    (ve)$ make html

You'll find the docs in ``docs/_build/html/index.html``.

You can contact the Vumi development team in the following ways:

* via *email* by joining the the `vumi-dev@googlegroups.com`_ mailing
  list
* on *irc* in *#vumi* on the `Freenode IRC network`_

.. _vumi-dev@googlegroups.com: https://groups.google.com/forum/?fromgroups#!forum/vumi-dev
.. _Freenode IRC network: https://webchat.freenode.net/?channels=#vumi

Issues can be filed in the GitHub issue tracker. Please don't use the
issue tracker for general support queries.
