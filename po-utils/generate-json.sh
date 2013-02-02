#!/bin/sh
PROJECT_DIR="$1"
LANGS="$2"
if [ "x$PROJECT_DIR" = "x" -o "x$LANGS" = "x" ] ; then
    echo "Usage:" `basename "$0"` "<project_folder> <langs>"
    echo "  e.g." `basename "$0"` ". 'en sw'"
    exit 1
fi

SCRIPT_DIR="`dirname $0`"

DOMAIN="messages"
PO_DIR="$PROJECT_DIR/po"
for lang in $LANGS ; do
   LANG_DIR="$PO_DIR/$lang/LC_MESSAGES"
   echo "$lang ($LANG_DIR)"
   "$SCRIPT_DIR/po2json.py" --lang "$lang" --indent 2 "$DOMAIN" "$PO_DIR" > "$LANG_DIR/$DOMAIN.json"
done
