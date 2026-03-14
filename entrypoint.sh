#!/bin/sh
mkdir -p /app/data/paperclip
chown -R node:node /app/data/paperclip
exec setpriv --reuid=1000 --regid=1000 --init-groups "$@"