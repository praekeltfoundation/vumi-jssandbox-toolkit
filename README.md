Vumi Javascript Sandbox Toolkit
===============================

Javascript toolkit and examples for use with the Vumi Javascript
sandbox.

Documentation available online at
http://vumi-jssandbox-toolkit.readthedocs.org/ and in the `docs`
directory of the repository.

[![Travis CI][vjst-ci-image]][vjst-ci]

  [vjst-ci-image]: https://travis-ci.org/praekelt/vumi-jssandbox-toolkit.png?branch=develop
  [vjst-ci]: https://travis-ci.org/praekelt/vumi-jssandbox-toolkit

To run tests locally:

    $ npm install
    $ npm test

To build the docs locally:

    $ virtualenv --no-site-packages ve/
    $ source ve/bin/activate
    (ve)$ pip install Sphinx
    (ve)$ cd docs
    (ve)$ make html

You'll find the docs in `docs/_build/html/index.html`.

You can contact the Vumi development team in the following ways:

* via *email* by joining the the [vumi-dev@googlegroups.com][vumi-email]
  mailing list
* on *irc* in *#vumi* on the [Freenode IRC network][vumi-irc]

Issues can be filed in the GitHub issue tracker. Please don't use the
issue tracker for general support queries.

  [vumi-email]: https://groups.google.com/forum/?fromgroups#!forum/vumi-dev
  [vumi-irc]: https://webchat.freenode.net/?channels=#vumi
