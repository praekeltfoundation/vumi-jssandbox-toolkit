#!/bin/bash
mocha --require "test/setup.js" `find "$@" -name "*.js"`
