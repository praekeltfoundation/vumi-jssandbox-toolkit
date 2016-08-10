Javascript Sandbox Tutorial
===========================

This is a javascript sandbox tutorial for writing standalone Javascript sandbox applications (that connect to Junebug) too.


What is the sandbox?
--------------------

A sandbox is an isolated execution environment, but its used in production, not testing, and its role is to provide access to carefully selected external resources and capabilities (e.g. logging, web requests, a key-value store, sending messages).


Introduction to an example we’re going to use for this tutorial
---------------------------------------------------------------

In this tutorial we're going to write a sandbox application for `CTA train tracker <http://www.transitchicago.com/traintracker/default.aspx>`_ to shows a list of in-service trains and basic information and the locations for one or more specified `"L" <https://en.wikipedia.org/wiki/Chicago_%22L%22>`_ routes.


Outcomes of the tutorial
------------------------

By the end of this tutorial, you will be able to:

- Understand the structure of a sandbox application repository
- Write a sandbox application
- Write tests
- Know how to make an HTTP request from a sandbox application
- Translate your application into other languages
- Work with promises
- Deploy your application to Vumi Go


Other documentation
-------------------

.. toctree::
   :maxdepth: 1

   sandbox_skeleton.rst
   deploying_to_VumiGo_and_standalone.rst
   creating_states.rst
   updating_tests.rst
   add_an_http_request.rst
   adding_translations.rst
   selecting_a_language.rst
