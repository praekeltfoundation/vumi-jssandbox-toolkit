#!/bin/bash
LANGS="en sw"
DOMAIN="messages"
PROJECT_DIR="`dirname $0`/.."
PO_DIR="$PROJECT_DIR/po"
LIB_DIR="$PROJECT_DIR/lib"
JS2PYTHONISH="$PROJECT_DIR/utils/js2pythonish.py"

POT_FILE="$PO_DIR/$DOMAIN.pot"

# re-create empty .pot file
rm -rf "$POT_FILE"
echo "" | xgettext -L python --force-po -o "$POT_FILE" -

# add each js file to the .pot file in turn
for jsfile in "$LIB_DIR"/*.js ; do
  echo $jsfile
  "$JS2PYTHONISH" < "$jsfile" \
  | xgettext -L python -j -o "$POT_FILE" -
done
