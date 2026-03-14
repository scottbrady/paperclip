#!/bin/sh
mkdir -p /data/paperclip
chown -R node:node /data/paperclip
exec gosu node "$@"