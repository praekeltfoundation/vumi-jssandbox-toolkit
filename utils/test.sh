#!/bin/bash -e
files=`find "$@" -name "*.js"`
./node_modules/.bin/jshint $files
./node_modules/.bin/mocha --require "test/setup.js" $files
