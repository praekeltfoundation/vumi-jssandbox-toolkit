#!/usr/bin/env python

import sys
import json

json_file = sys.argv[1]
json_data = json.loads(open(json_file).read())

print json.dumps(json_data, indent=2)
