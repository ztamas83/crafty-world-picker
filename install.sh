#!/usr/bin/env bash
# Crafty World Picker one-line installer for Debian/Ubuntu (LXC, VM or bare metal).
#
#   curl -fsSL https://raw.githubusercontent.com/ztamas83/crafty-world-picker/master/install.sh | sudo bash
#
# Installs the latest release by default. Pin a version:
#   curl -fsSL .../install.sh | sudo bash -s -- v1.0.0
#
# On the first install it asks for the Crafty settings. To run without questions, pass them:
#   curl -fsSL .../install.sh | sudo CRAFTY_URL=https://127.0.0.1:8443 \
#     CRAFTY_SERVER_ID=<uuid> CRAFTY_API_TOKEN=<token> LISTEN_PORT=8081 bash
#
# Other settings (environment):
#   INSTALL_DIR   where releases are kept (default /opt/crafty-world-picker)
#   PACKAGE_URL   install this zip instead of a GitHub release (its .sha256 is used when present)
set -euo pipefail

REPO=ztamas83/crafty-world-picker
APP=crafty-world-picker
ENV_FILE=/etc/$APP.env
INSTALL_DIR=${INSTALL_DIR:-/opt/$APP}

if [ -t 1 ]; then
  B=$'\033[1m' G=$'\033[32m' R=$'\033[31m' D=$'\033[2m' N=$'\033[0m'
else
  B="" G="" R="" D="" N=""
fi
say() { printf '%s==>%s %s\n' "$B" "$N" "$*"; }
die() { printf '%sError:%s %s\n' "$R" "$N" "$*" >&2; exit 1; }

# Reads a value from the terminal (stdin is the piped script). ask VAR "Question" [default] [secret]
ask() {
  local var=$1 question=$2 default=${3:-} secret=${4:-} answer=""
  local prompt="  $question"
  [ -n "$default" ] && prompt="$prompt ${D}[$default]${N}"
  while [ -z "$answer" ]; do
    if [ -n "$secret" ]; then
      read -r -s -p "$prompt: " answer < /dev/tty; echo > /dev/tty
    else
      read -r -p "$prompt: " answer < /dev/tty
    fi
    answer=${answer:-$default}
  done
  printf -v "$var" '%s' "$answer"
}

write_config() {
  if [ -f "$ENV_FILE" ] && [ -z "${CRAFTY_API_TOKEN:-}" ]; then
    say "Using existing configuration $ENV_FILE"
    return
  fi
  if [ -z "${CRAFTY_SERVER_ID:-}" ] || [ -z "${CRAFTY_API_TOKEN:-}" ]; then
    { : < /dev/tty; } 2>/dev/null || die "No terminal to ask for settings. Pass CRAFTY_SERVER_ID and CRAFTY_API_TOKEN (see the top of this script)."
    say "Crafty settings ${D}(stored in $ENV_FILE, readable by root only)${N}"
    printf '  %sThe API key needs server permissions Commands + Files.%s\n' "$D" "$N"
    [ -n "${CRAFTY_URL:-}" ] || ask CRAFTY_URL "Crafty URL" "https://127.0.0.1:8443"
    [ -n "${CRAFTY_SERVER_ID:-}" ] || ask CRAFTY_SERVER_ID "Crafty server ID (UUID)"
    [ -n "${CRAFTY_API_TOKEN:-}" ] || ask CRAFTY_API_TOKEN "Crafty API key" "" secret
    [ -n "${LISTEN_PORT:-}" ] || ask LISTEN_PORT "Port for the world picker" "8081"
  fi
  (
    umask 077
    printf 'CRAFTY_URL=%s\nCRAFTY_SERVER_ID=%s\nCRAFTY_API_TOKEN=%s\nLISTEN_PORT=%s\n' \
      "${CRAFTY_URL:-https://127.0.0.1:8443}" "$CRAFTY_SERVER_ID" "$CRAFTY_API_TOKEN" "${LISTEN_PORT:-8081}" > "$ENV_FILE"
  )
  say "Configuration written to $ENV_FILE"
}

main() {
  [ "$(id -u)" -eq 0 ] || die "Run as root, e.g. curl -fsSL <url> | sudo bash"
  command -v apt-get >/dev/null || die "Only Debian/Ubuntu (apt) is supported."

  local need=()
  command -v curl >/dev/null || need+=(curl)
  command -v unzip >/dev/null || need+=(unzip)
  if [ ${#need[@]} -gt 0 ]; then
    say "Installing ${need[*]}"
    apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${need[@]}" > /dev/null
  fi

  local version=${1:-${VERSION:-}} url
  if [ -n "${PACKAGE_URL:-}" ]; then
    url=$PACKAGE_URL
    version=$(basename "$url" .zip); version=${version#"$APP-"}
  else
    if [ -z "$version" ]; then
      say "Looking up the latest release"
      version=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest") \
        || die "Could not reach GitHub."
      version=${version##*/}
      [[ $version == v* ]] || die "No release found at https://github.com/$REPO/releases"
    fi
    url="https://github.com/$REPO/releases/download/$version/$APP-$version.zip"
  fi

  TMP_DIR=$(mktemp -d); trap 'rm -rf "$TMP_DIR"' EXIT
  local tmp=$TMP_DIR
  say "Downloading $APP $version"
  curl -fsSL -o "$tmp/pkg.zip" "$url" || die "Download failed: $url"
  if curl -fsSL -o "$tmp/pkg.zip.sha256" "$url.sha256" 2>/dev/null; then
    (cd "$tmp" && echo "$(cut -d' ' -f1 pkg.zip.sha256)  pkg.zip" | sha256sum -c --quiet -) \
      || die "Checksum mismatch for $url"
    say "Checksum verified"
  else
    printf '  %sNo checksum file found, skipping verification%s\n' "$D" "$N"
  fi

  mkdir -p "$INSTALL_DIR"
  unzip -q -o "$tmp/pkg.zip" -d "$tmp/x"
  local dir; dir=$(find "$tmp/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)
  [ -x "$dir/install.sh" ] || die "The package does not contain install.sh"
  rm -rf "${INSTALL_DIR:?}/$version"
  mv "$dir" "$INSTALL_DIR/$version"
  ln -sfn "$INSTALL_DIR/$version" "$INSTALL_DIR/current"
  say "Unpacked to $INSTALL_DIR/$version"

  write_config

  echo
  "$INSTALL_DIR/current/install.sh"

  # Keep the three newest releases
  find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | tail -n +4 \
    | cut -d' ' -f2- | while read -r old; do rm -rf "$old"; done

  printf '\n%sTo update later, rerun the same command.%s\n' "$G" "$N"
}

main "$@"
