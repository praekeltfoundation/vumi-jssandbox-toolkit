#!/bin/bash
PROJECT_DIR="$1"
if [ "x$PROJECT_DIR" = "x" ] ; then
    echo "Usage:" `basename "$0"` "<project_folder>"
    exit 1
fi

SCRIPT_DIR="`dirname $0`"
JS2PYTHONISH="$SCRIPT_DIR/js2pythonish.py"

PO_DIR="$PROJECT_DIR/po"
LIB_DIR="$PROJECT_DIR/lib"
DOMAIN="messages"

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
