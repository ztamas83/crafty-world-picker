#!/bin/sh
# Installs or updates Crafty World Picker on Debian (LXC, VM or bare metal) behind nginx.
#
# Run as root from the package directory produced by deploy/lxc/package.sh:
#   <dir>/install.sh  <dir>/default.conf.template  <dir>/www/
# Configuration is read from /etc/crafty-world-picker.env (see crafty-world-picker.env.example):
#   CRAFTY_URL, CRAFTY_SERVER_ID, CRAFTY_API_TOKEN (required), LISTEN_PORT (default 8081)
# Optional: ENV_FILE=<path> to use another config file, VERBOSE=1 for command output.
set -eu

APP=crafty-world-picker
SRC=$(cd "$(dirname "$0")" && pwd)
ENV_FILE=${ENV_FILE:-/etc/$APP.env}
WEB_ROOT=/var/www/$APP
SITE=/etc/nginx/sites-available/$APP
LOG_FILE=/var/log/$APP-install.log
VERBOSE=${VERBOSE:-0}
STEP=0
STEPS=7
CURRENT=""

# --- Output helpers ---------------------------------------------------------

if [ -t 1 ]; then
  C_BOLD=$(printf '\033[1m'); C_GREEN=$(printf '\033[32m'); C_YELLOW=$(printf '\033[33m')
  C_RED=$(printf '\033[31m'); C_DIM=$(printf '\033[2m'); C_RESET=$(printf '\033[0m')
else
  C_BOLD=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_DIM=""; C_RESET=""
fi

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { printf '%s %s\n' "$(ts)" "$*" >> "$LOG_FILE" 2>/dev/null || true; }

step() {
  STEP=$((STEP + 1))
  CURRENT=$1
  printf '%s[%d/%d]%s %s\n' "$C_BOLD" "$STEP" "$STEPS" "$C_RESET" "$1"
  log "STEP $STEP/$STEPS: $1"
}
info() { printf '      %s\n' "$*"; log "INFO: $*"; }
ok() { printf '      %s%s%s\n' "$C_GREEN" "$*" "$C_RESET"; log "OK: $*"; }
warn() { printf '      %sWarning:%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; log "WARN: $*"; }

# fail MESSAGE [HINT...]
fail() {
  printf '\n%sError:%s %s\n' "$C_RED" "$C_RESET" "$1" >&2
  log "ERROR: $1"
  shift
  for hint in "$@"; do printf '  %s- %s%s\n' "$C_DIM" "$hint" "$C_RESET" >&2; log "HINT: $hint"; done
  [ -w "$LOG_FILE" ] && printf '\nFull log: %s\n' "$LOG_FILE" >&2
  exit 1
}

# run DESCRIPTION CMD... : runs a command, output to the log (and screen with VERBOSE=1)
run() {
  desc=$1; shift
  log "RUN: $*"
  if [ "$VERBOSE" = 1 ]; then
    rc_file=$(mktemp)
    { "$@" 2>&1 && echo 0 > "$rc_file" || echo $? > "$rc_file"; } | tee -a "$LOG_FILE"
    status=$(cat "$rc_file"); rm -f "$rc_file"
  else
    out=$("$@" 2>&1) && status=0 || status=$?
    [ -n "$out" ] && printf '%s\n' "$out" >> "$LOG_FILE" 2>/dev/null
  fi
  if [ "$status" -ne 0 ]; then
    [ "$VERBOSE" = 1 ] || { [ -n "${out:-}" ] && printf '%s\n' "$out" | tail -n 15 | sed 's/^/      | /' >&2; }
    fail "$desc failed (exit code $status)." "Rerun with VERBOSE=1 for full output."
  fi
}

on_exit() {
  status=$?
  if [ "$status" -ne 0 ] && [ -n "$CURRENT" ]; then
    log "ABORTED during: $CURRENT (exit $status)"
    printf '\n%sInstallation aborted during step "%s".%s\n' "$C_RED" "$CURRENT" "$C_RESET" >&2
  fi
}
trap on_exit EXIT

mask() { # shows only the first and last 4 characters of a secret
  printf '%s' "$1" | sed -E 's/^(.{4}).*(.{4})$/\1...\2/'
}

# --- Preflight --------------------------------------------------------------

[ "$(id -u)" -eq 0 ] || fail "This installer must run as root." "Try: sudo $0"

touch "$LOG_FILE" 2>/dev/null && chmod 600 "$LOG_FILE"
log "===== $APP install started from $SRC ====="

printf '%sCrafty World Picker installer%s\n' "$C_BOLD" "$C_RESET"
printf '%sPackage: %s | Log: %s%s\n\n' "$C_DIM" "$SRC" "$LOG_FILE" "$C_RESET"

step "Checking the package"
[ -f "$SRC/www/index.html" ] || fail "The app files were not found in $SRC/www." \
  "Build the package on your dev machine with deploy/lxc/package.sh." \
  "Copy the whole dist/lxc/ directory, then run install.sh from inside it."
[ -f "$SRC/default.conf.template" ] || fail "nginx template $SRC/default.conf.template is missing." \
  "Rebuild the package with deploy/lxc/package.sh."
ok "Package complete ($(find "$SRC/www" -type f | wc -l) app files)"

step "Reading configuration from $ENV_FILE"
[ -f "$ENV_FILE" ] || fail "Configuration file $ENV_FILE does not exist." \
  "Create it from crafty-world-picker.env.example (in the repository under deploy/lxc/)." \
  "It needs CRAFTY_URL, CRAFTY_SERVER_ID and CRAFTY_API_TOKEN."
set -a; . "$ENV_FILE"; set +a
LISTEN_PORT=${LISTEN_PORT:-8081}
missing=""
for v in CRAFTY_URL CRAFTY_SERVER_ID CRAFTY_API_TOKEN; do
  eval "val=\${$v:-}"
  [ -n "$val" ] || missing="$missing $v"
done
[ -z "$missing" ] || fail "Missing value(s) in $ENV_FILE:$missing" \
  "CRAFTY_URL: Crafty base URL, e.g. https://127.0.0.1:8443" \
  "CRAFTY_SERVER_ID: UUID of the Crafty server that hosts the worlds" \
  "CRAFTY_API_TOKEN: API key with Commands + Files permissions (see deploy/README.md)"
case "$CRAFTY_URL" in
  http://*|https://*) ;;
  *) fail "CRAFTY_URL must start with http:// or https:// (got: $CRAFTY_URL)." ;;
esac
CRAFTY_URL=${CRAFTY_URL%/}
case "$LISTEN_PORT" in
  ''|*[!0-9]*) fail "LISTEN_PORT must be a number (got: $LISTEN_PORT)." ;;
esac
echo "$CRAFTY_SERVER_ID" | grep -Eq '^[0-9a-f-]{36}$' \
  || warn "CRAFTY_SERVER_ID does not look like a UUID: $CRAFTY_SERVER_ID"
export LISTEN_PORT WEB_ROOT CRAFTY_URL CRAFTY_SERVER_ID CRAFTY_API_TOKEN
chmod 600 "$ENV_FILE"
info "Crafty URL:  $CRAFTY_URL"
info "Server ID:   $CRAFTY_SERVER_ID"
info "API token:   $(mask "$CRAFTY_API_TOKEN")"
info "Listen port: $LISTEN_PORT"

step "Installing nginx and tools"
if command -v nginx >/dev/null && command -v envsubst >/dev/null && command -v curl >/dev/null; then
  ok "nginx, envsubst and curl already installed ($(nginx -v 2>&1 | sed 's/.*: //'))"
else
  command -v apt-get >/dev/null || fail "apt-get not found; this installer supports Debian/Ubuntu only."
  info "Updating package lists..."
  run "apt-get update" apt-get update -q
  info "Installing nginx, gettext-base and curl..."
  run "Package installation" env DEBIAN_FRONTEND=noninteractive apt-get install -y -q nginx gettext-base curl
  ok "Installed $(nginx -v 2>&1 | sed 's/.*: //')"
fi

step "Checking the Crafty connection"
if command -v curl >/dev/null; then
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
    -H "Authorization: Bearer $CRAFTY_API_TOKEN" \
    "$CRAFTY_URL/api/v2/servers/$CRAFTY_SERVER_ID/stats") || code=000
  case "$code" in
    200) ok "Crafty answered and the API key can read the server" ;;
    000) warn "Could not reach $CRAFTY_URL. Is Crafty running? Installing anyway." ;;
    400|401|403) warn "Crafty rejected the request (HTTP $code). Check the API key permissions and CRAFTY_SERVER_ID. Installing anyway." ;;
    *) warn "Unexpected answer from Crafty (HTTP $code). Installing anyway." ;;
  esac
else
  info "curl not installed, skipping the connection check"
fi

step "Installing the app to $WEB_ROOT"
[ -d "$WEB_ROOT" ] && info "Replacing the existing installation"
rm -rf "$WEB_ROOT.new"
mkdir -p "$WEB_ROOT.new"
cp -r "$SRC/www/." "$WEB_ROOT.new/"
rm -rf "$WEB_ROOT.old"
[ -d "$WEB_ROOT" ] && mv "$WEB_ROOT" "$WEB_ROOT.old"
mv "$WEB_ROOT.new" "$WEB_ROOT"
rm -rf "$WEB_ROOT.old"
ok "App files installed"

step "Configuring nginx"
if command -v ss >/dev/null; then
  holder=$(ss -Hltnp "sport = :$LISTEN_PORT" 2>/dev/null | grep -v '"nginx"' | sed -n 's/.*users:((\("[^"]*"\).*/\1/p' | head -n 1)
  [ -z "$holder" ] || fail "Port $LISTEN_PORT is already used by $holder." \
    "Choose a free port with LISTEN_PORT in $ENV_FILE and rerun."
fi
# The rendered site contains the API token: root-only
[ -f "$SITE" ] && cp -p "$SITE" "$SITE.bak"
(umask 077 && envsubst '${LISTEN_PORT} ${WEB_ROOT} ${CRAFTY_URL} ${CRAFTY_SERVER_ID} ${CRAFTY_API_TOKEN}' \
  < "$SRC/default.conf.template" > "$SITE")
ln -sf "$SITE" /etc/nginx/sites-enabled/$APP
info "Site written to $SITE (mode 600, contains the API token)"
# Debian's stock site would also claim port 80; remove it only if it is the untouched symlink
if [ -L /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
  info "Disabled Debian's default nginx site"
fi
if ! test_out=$(nginx -t 2>&1); then
  printf '%s\n' "$test_out" >> "$LOG_FILE"
  printf '%s\n' "$test_out" | sed 's/^/      | /' >&2
  if [ -f "$SITE.bak" ]; then
    mv "$SITE.bak" "$SITE"
    warn "Restored the previous site configuration"
  fi
  fail "nginx rejected the configuration." \
    "The nginx output above names the file and line with the problem." \
    "If it is another site or file, fix or remove it and rerun this installer."
fi
rm -f "$SITE.bak"
ok "nginx configuration is valid"

step "Starting nginx"
if [ -d /run/systemd/system ]; then
  run "Enabling nginx" systemctl enable -q nginx
  run "Restarting nginx" systemctl reload-or-restart nginx
  systemctl is-active -q nginx || fail "nginx is not running after the restart." \
    "Check: journalctl -u nginx -n 50"
elif [ -f /run/nginx.pid ] && kill -0 "$(cat /run/nginx.pid)" 2>/dev/null; then
  run "Reloading nginx" nginx -s reload
else
  run "Starting nginx" nginx
fi
ok "nginx is running"

if command -v curl >/dev/null; then
  sleep 1
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$LISTEN_PORT/healthz") || code=000
  [ "$code" = 200 ] || fail "nginx is running, but the app does not answer on port $LISTEN_PORT (HTTP $code)." \
    "Another program may be using port $LISTEN_PORT. Check with: ss -ltnp 'sport = :$LISTEN_PORT'" \
    "nginx errors: tail /var/log/nginx/error.log"
  ok "Health check passed"
fi

CURRENT=""
host_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
log "===== install finished ====="
printf '\n%sDone.%s Crafty World Picker is available at %shttp://%s:%s/%s\n' \
  "$C_GREEN" "$C_RESET" "$C_BOLD" "${host_ip:-<this-host>}" "$LISTEN_PORT" "$C_RESET"
printf '%sTo update: rerun this script from a new package. To change settings: edit %s and rerun.%s\n' \
  "$C_DIM" "$ENV_FILE" "$C_RESET"
