#!/bin/sh
for lang in lang/*.json; do npm run compile -- $lang --ast --out-file compiled-lang/`basename $lang`; done
