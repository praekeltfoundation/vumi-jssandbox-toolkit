#!/bin/bash
VER="$1"

if [[ "x${VER}" = "x" ]]
then
    echo "Usage: $0 <version number>"
    echo " e.g. $0 0.1.0"
    exit 1
fi

SHORT_VER=`echo "${VER}" | sed -e "s/\.[^.]*$//"`

sed -i -e "s/\([\"']version[\"'][ ]*:[ ]*[\"']\)\(.*\)\([\"'].*\)/\1${VER}\3/" package.json
sed -i -e "s/^\(release[ ]*=[ ]*[\"']\)\(.*\)\([\"'].*\)/\1${VER}\3/" docs/conf.py
sed -i -e "s/^\(version[ ]*=[ ]*[\"']\)\(.*\)\([\"'].*\)/\1${SHORT_VER}\3/" docs/conf.py
