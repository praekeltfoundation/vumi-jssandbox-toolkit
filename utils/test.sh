#!/bin/bash -e
jshint `find lib test examples -name "*.js"`
mocha --require "test/setup.js" `find test examples/*/test -name "*.js"`
