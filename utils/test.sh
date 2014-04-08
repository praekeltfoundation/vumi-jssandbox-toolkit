#!/bin/bash -e
jshint `find lib test examples -name "*.js"`
mocha `find test examples/*/test -name "*.js"`
