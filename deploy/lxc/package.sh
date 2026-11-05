#!/bin/sh
# Builds the app and assembles the LXC install package in dist/lxc/.
# Usage: package.sh [version]   (default: output of `git describe`, else "dev")
set -eu
cd "$(dirname "$0")/../.."
VERSION=${1:-$(git describe --tags --always --dirty 2>/dev/null || echo dev)}
bun install --frozen-lockfile
bun run build
rm -rf dist/lxc
mkdir -p dist/lxc
cp -r dist/crafty-world-picker/browser dist/lxc/www
cp deploy/nginx/default.conf.template deploy/lxc/install.sh deploy/lxc/crafty-world-picker.env.example dist/lxc/
printf '%s\n' "$VERSION" > dist/lxc/VERSION
echo "Package $VERSION ready: dist/lxc/"
