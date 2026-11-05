#!/bin/sh
# Builds the app and assembles the LXC install package in dist/lxc/.
set -eu
cd "$(dirname "$0")/../.."
bun install --frozen-lockfile
bun run build
rm -rf dist/lxc
mkdir -p dist/lxc
cp -r dist/crafty-world-picker/browser dist/lxc/www
cp deploy/nginx/default.conf.template deploy/lxc/install.sh dist/lxc/
echo "Package ready: dist/lxc/"
