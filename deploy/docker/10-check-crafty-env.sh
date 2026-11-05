#!/bin/sh
# Fails container start when the Crafty connection is not configured.
set -e
missing=""
for v in CRAFTY_URL CRAFTY_SERVER_ID CRAFTY_API_TOKEN; do
  eval "val=\${$v:-}"
  [ -n "$val" ] || missing="$missing $v"
done
if [ -n "$missing" ]; then
  echo "crafty-world-picker: missing environment variable(s):$missing" >&2
  exit 1
fi
