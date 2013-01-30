#!/usr/bin/env python
import json
import gettext
import optparse
import sys
from collections import OrderedDict


def parse_header(value):
    """Parse a .mo file header blob."""
    header = OrderedDict()
    for line in value.splitlines():
        key, entry = line.split(':', 1)
        key = key.replace('-', '_').lower()
        entry = entry.lstrip()
        header[key] = entry
    return header


def gettext_json(domain, path, lang=(), indent=None):
    tr = gettext.translation(domain, path, lang)
    # key -> translated_string map
    # keys can be either strings or (string, plural_form_no) tuples
    catalog = tr._catalog
    keys = sorted(catalog.keys())  # ensure plurl forms are sorted
    translations = OrderedDict()
    for key in keys:
        value = catalog[key]
        if not key:
            # header entry
            translations[key] = parse_header(value)
        elif isinstance(key, tuple):
            if key[0] not in translations:
                translations[key[0]] = [key[1]]
            translations[key[0]].append(value)
        else:
            translations[key] = [None, value]
    return json.dumps(translations, ensure_ascii=False, indent=indent)


def parse_options():
    parser = optparse.OptionParser(
            usage="%prog [<options>] <domain> <path>")
    parser.add_option("--lang", "-l", action="append",
                      help="Languages to include (e.g. -l en).")
    parser.add_option("--indent", "-i", type="int", default=None,
                      help="Number of spaces to indent by.")
    opt, args = parser.parse_args()
    try:
        domain, path = args
    except ValueError:
        parser.print_help()
        sys.exit(1)
    return domain, path, opt


if __name__ == "__main__":
    domain, path, opt = parse_options()
    print gettext_json(domain, path, lang=opt.lang, indent=opt.indent)
