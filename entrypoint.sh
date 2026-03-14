#!/bin/sh
mkdir -p /app/data/paperclip/instances/default/logs
chown -R node:node /app/data/paperclip
ln -s /app/data/paperclip /paperclip
exec runuser -u node -- "$@"