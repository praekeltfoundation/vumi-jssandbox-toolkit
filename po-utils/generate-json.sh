#!/bin/sh
LANGS="en sw"
DOMAIN="messages"
PROJECT_DIR="`dirname $0`/.."
PO_DIR="$PROJECT_DIR/po"
for lang in $LANGS ; do
   LANG_DIR="$PO_DIR/$lang/LC_MESSAGES"
   echo "$lang ($LANG_DIR)"
   "$PROJECT_DIR/utils/po2json.py" --lang "$lang" --indent 2 "$DOMAIN" "$PO_DIR" > "$LANG_DIR/$DOMAIN.json"
done
