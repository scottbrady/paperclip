#!/bin/sh
mkdir -p /paperclip
chown -R node:node /paperclip
exec su-exec node "$@"