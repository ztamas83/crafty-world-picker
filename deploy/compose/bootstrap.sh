#!/usr/bin/env bash
# Creates a least-privilege Crafty API key for the world picker and starts it.
#
# Creates (or reuses) in Crafty:
#   role  "world-picker"  with the chosen server and permissions Commands + Files
#   user  "world_picker"  (not a superuser) with that role
#   an API key for that user (Commands + Files, no Crafty permissions)
# then writes CRAFTY_SERVER_ID, CRAFTY_API_TOKEN and COMPOSE_PROFILES=picker to .env
# and runs `docker compose up -d`.
#
# Prerequisites: Crafty is running (`docker compose up -d`) and a server exists in it.
# Optional environment:
#   CRAFTY_ADMIN_USER      default: admin
#   CRAFTY_ADMIN_PASSWORD  default: read from Crafty's default-creds.txt
#   CRAFTY_SERVER_ID       required when Crafty has more than one server
#   CRAFTY_HTTPS_PORT      default: 8443
# Requires: docker (with compose), curl, jq, openssl.
set -euo pipefail
cd "$(dirname "$0")"

# Server permission mask, bit order from Crafty's EnumPermissionsServer:
# COMMANDS TERMINAL LOGS SCHEDULE BACKUP FILES CONFIG PLAYERS
SERVER_PERMS="10000100"
ROLE_NAME="world-picker"
USER_NAME="world_picker"
KEY_NAME="world-picker"

die() { echo "bootstrap: $*" >&2; exit 1; }
for cmd in docker curl jq openssl; do command -v "$cmd" >/dev/null || die "$cmd is required"; done

touch .env
set -a; . ./.env; set +a
API="https://localhost:${CRAFTY_HTTPS_PORT:-8443}/api/v2"
TOKEN=""

# api METHOD PATH [JSON] -> prints .data, fails on HTTP or envelope error
api() {
  local body
  body=$(curl -sk -X "$1" "$API$2" \
    ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
    ${3:+-H "Content-Type: application/json" --data "$3"}) || die "$1 $2: request failed"
  [ "$(jq -r '.status' <<<"$body")" = "ok" ] || die "$1 $2: $(jq -c '{error, error_data}' <<<"$body")"
  jq -c '.data' <<<"$body"
}

set_env() { # set_env KEY VALUE (replaces or appends the line in .env)
  local tmp; tmp=$(mktemp)
  grep -v "^$1=" .env > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  mv "$tmp" .env
}

echo "Waiting for Crafty on $API ..."
for _ in $(seq 1 60); do
  curl -sk -o /dev/null "$API/crafty/check" && break
  sleep 3
done

ADMIN_USER="${CRAFTY_ADMIN_USER:-admin}"
if [ -z "${CRAFTY_ADMIN_PASSWORD:-}" ]; then
  CRAFTY_ADMIN_PASSWORD=$(docker compose exec -T crafty cat /crafty/app/config/default-creds.txt | jq -r '.password') \
    || die "could not read default-creds.txt; set CRAFTY_ADMIN_PASSWORD"
fi
TOKEN=$(api POST /auth/login "$(jq -nc --arg u "$ADMIN_USER" --arg p "$CRAFTY_ADMIN_PASSWORD" '{username: $u, password: $p}')" | jq -r '.token')

if [ -z "${CRAFTY_SERVER_ID:-}" ]; then
  servers=$(api GET /servers)
  case "$(jq 'length' <<<"$servers")" in
    0) die "Crafty has no servers yet. Create one in the Crafty UI (https://localhost:${CRAFTY_HTTPS_PORT:-8443}), then rerun." ;;
    1) CRAFTY_SERVER_ID=$(jq -r '.[0].server_id' <<<"$servers") ;;
    *) jq -r '.[] | "  \(.server_id)  \(.server_name)"' <<<"$servers"
       die "Crafty has several servers; rerun with CRAFTY_SERVER_ID=<id>" ;;
  esac
fi
echo "Server: $CRAFTY_SERVER_ID"

role_id=$(api GET /roles | jq -r --arg n "$ROLE_NAME" '.[] | select(.role_name == $n) | .role_id')
if [ -z "$role_id" ]; then
  role_id=$(api POST /roles "$(jq -nc --arg n "$ROLE_NAME" --arg s "$CRAFTY_SERVER_ID" --arg p "$SERVER_PERMS" \
    '{name: $n, servers: [{server_id: $s, permissions: $p}]}')" | jq -r '.role_id')
  echo "Created role $ROLE_NAME ($role_id)"
else
  echo "Reusing role $ROLE_NAME ($role_id); check its server and permissions in the Crafty UI"
fi

user_id=$(api GET /users | jq -r --arg n "$USER_NAME" '.[] | select(.username == $n) | .user_id')
if [ -z "$user_id" ]; then
  user_id=$(api POST /users "$(jq -nc --arg u "$USER_NAME" --arg p "$(openssl rand -hex 24)" --argjson r "$role_id" \
    '{username: $u, password: $p, superuser: false, roles: [$r]}')" | jq -r '.user_id')
  echo "Created user $USER_NAME ($user_id)"
else
  echo "Reusing user $USER_NAME ($user_id)"
fi

key_id=$(api PATCH "/users/$user_id/key" "$(jq -nc --arg n "$KEY_NAME" --arg p "$SERVER_PERMS" \
  '{name: $n, full_access: false, server_permissions_mask: $p, crafty_permissions_mask: "000"}')" | jq -r '.id')
api_token=$(api GET "/users/$user_id/key/$key_id" | jq -r '.')

# Sanity check with the new key
TOKEN="$api_token" api GET "/servers/$CRAFTY_SERVER_ID/stats" >/dev/null
echo "API key $key_id works for the server"

set_env CRAFTY_SERVER_ID "$CRAFTY_SERVER_ID"
set_env CRAFTY_API_TOKEN "$api_token"
set_env COMPOSE_PROFILES picker
chmod 600 .env

docker compose up -d --build
echo "World picker: http://localhost:${PICKER_PORT:-8080}"
