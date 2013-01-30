#!/usr/bin/env python

"""Tiny script for pre-process Javascript so that it can be understood
   by the xgettext Python parser.

   Preprocesses stdin and writes the result to stdout.
   """

import sys
import re


def replace_str_continuations(js):
    """Replace + string continuations with Pythonic ones xgettext
       can interpret.
       """
    regex = re.compile(r"([\"'])\s*\+\s*\1", flags=re.DOTALL | re.MULTILINE)
    return regex.sub("", js)


def replace_javascript_oneline_comments(js):
    """Replace // comments with # comments."""
    regex = re.compile(r"^(\s*)//", flags=re.DOTALL | re.MULTILINE)
    return regex.sub(r"\1#", js)


DEFAULT_CONVERTERS = [
    replace_str_continuations,
    replace_javascript_oneline_comments,
]


def run_converters(js, converters=None):
    if converters is None:
        converters = DEFAULT_CONVERTERS
    for converter in converters:
        js = converter(js)
    return js


if __name__ == "__main__":
    sys.stdout.write(run_converters(sys.stdin.read()))
