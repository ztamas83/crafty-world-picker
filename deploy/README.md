# Deployment

All options serve the built SPA from nginx and proxy `/api/server/` to
`$CRAFTY_URL/api/v2/servers/$CRAFTY_SERVER_ID/`, adding `Authorization: Bearer $CRAFTY_API_TOKEN`.
The token and server ID never reach the browser, and only that one Crafty server's API is
reachable through the proxy. The shared nginx config is [nginx/default.conf.template](nginx/default.conf.template).

| Variable           | Required | Meaning                                                                                                     |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `CRAFTY_URL`       | yes      | Crafty base URL, e.g. `https://crafty.lan:8443`. TLS is not verified (Crafty's certificate is self-signed). |
| `CRAFTY_SERVER_ID` | yes      | UUID of the Crafty server that hosts the worlds.                                                            |
| `CRAFTY_API_TOKEN` | yes      | Crafty API key with server permissions Commands + Files.                                                    |
| `LISTEN_PORT`      | no       | Port nginx listens on. Docker: `8080`, LXC: `8081`.                                                         |

The app has no authentication. Anyone who can reach it can start and stop the server, so keep
it on the LAN.

## API key

The key needs server permissions **Commands** and **Files**. A key without full access only
reaches servers that its user gets through a Crafty role, so a limited key on a superuser
without roles sees no servers. Use a dedicated non-superuser:

1. Role `world-picker`: the server, permissions Commands + Files.
2. User `world_picker`: not a superuser, role `world-picker`.
3. API key for that user (as a superuser: `/panel/edit_user_apikeys?id=<user id>`), Commands + Files, no full access.

[compose/bootstrap.sh](compose/bootstrap.sh) does these steps through the Crafty API.

## 1. Standalone Docker container

```bash
docker build -t crafty-world-picker .
docker run -d --name crafty-world-picker --restart unless-stopped -p 8080:8080 \
  -e CRAFTY_URL=https://crafty.lan:8443 \
  -e CRAFTY_SERVER_ID=<uuid> \
  -e CRAFTY_API_TOKEN=<token> \
  crafty-world-picker
```

Or `--env-file .env` (format: [../.env.example](../.env.example)). The container refuses to
start when a required variable is missing. Health check: `GET /healthz`.

## 2. Docker Compose with Crafty

Crafty publishes an official image (`registry.gitlab.com/crafty-controller/crafty-4`).
[compose/compose.yaml](compose/compose.yaml) runs Crafty 4.11.0 and the picker. The picker
service is behind the `picker` profile, so it only starts once a token exists.

```bash
cd deploy/compose
cp .env.example .env          # optional: TZ, ports
docker compose up -d          # starts Crafty only
```

1. Open `https://<host>:8443` and log in as `admin`. The generated password is in
   `docker compose exec crafty cat /crafty/app/config/default-creds.txt`.
2. Create the Bedrock server in the Crafty UI (this step is manual, it needs the EULA).
3. Run `./bootstrap.sh` (needs `curl`, `jq`, `openssl`). It logs in as admin, creates the role,
   user and API key from the section above, writes `CRAFTY_SERVER_ID`, `CRAFTY_API_TOKEN` and
   `COMPOSE_PROFILES=picker` to `.env`, and runs `docker compose up -d --build`.

Set `CRAFTY_ADMIN_PASSWORD` if the admin password was changed, and `CRAFTY_SERVER_ID` if
Crafty has more than one server. Each run creates a new API key. The role and user are reused.

Ports: Bedrock is published on 19132 UDP and TCP (current Bedrock servers use TCP signalling
on the game port, see the crafty-portal spec section 6.3). If clients cannot connect, try
`network_mode: host` for the `crafty` service and `CRAFTY_URL=https://host.docker.internal:8443`
with `extra_hosts: ["host.docker.internal:host-gateway"]` for the picker.

## 3. Standalone SPA on an LXC container (nginx)

### One-line install

On the target (Debian/Ubuntu), this downloads the latest release, verifies its checksum, asks for
the Crafty settings on the first run, and runs the installer described below:

```bash
curl -fsSL https://raw.githubusercontent.com/ztamas83/crafty-world-picker/master/install.sh | sudo bash
```

- Pin a version: `... | sudo bash -s -- v0.1`
- No questions (automation): `... | sudo CRAFTY_URL=https://127.0.0.1:8443 CRAFTY_SERVER_ID=<uuid> CRAFTY_API_TOKEN=<token> LISTEN_PORT=8081 bash`
- Update: rerun the same command. The existing `/etc/crafty-world-picker.env` is kept.
- Releases are unpacked to `/opt/crafty-world-picker/<version>` (`current` points to the
  active one, the three newest are kept).

### Manual install

Each `v*` tag builds a release package (see [Releases](#releases)). On the target (Debian 13, as root):

```bash
apt-get install -y unzip curl   # not in Debian's minimal image
VERSION=v1.0.0
curl -fLO https://github.com/ztamas83/crafty-world-picker/releases/download/$VERSION/crafty-world-picker-$VERSION.zip
unzip crafty-world-picker-$VERSION.zip
cp crafty-world-picker-$VERSION/crafty-world-picker.env.example /etc/crafty-world-picker.env
nano /etc/crafty-world-picker.env   # first install only: fill in the Crafty settings
crafty-world-picker-$VERSION/install.sh
```

To build the package yourself instead: `deploy/lxc/package.sh [version]` creates `dist/lxc/`
with the same content as the zip.

The installer installs `nginx`, `gettext-base` and `curl` if missing, copies the app to
`/var/www/crafty-world-picker`, renders `/etc/nginx/sites-available/crafty-world-picker` (mode 600,
it holds the token), disables Debian's default site, and reloads nginx. It logs to
`/var/log/crafty-world-picker-install.log` (`VERBOSE=1` for full command output). Rerun it with a
newer package to update. No Node.js is needed on the target.

### Terraform

A self-contained example that deploys the package to an existing host over SSH (any Debian
machine or container reachable as root). It copies `dist/lxc/` and the config file, then runs
`install.sh`. It reruns whenever the package or the config changes.
Run `deploy/lxc/package.sh` before `terraform apply`.

```hcl
variable "world_picker_host" {
  description = "IP or hostname of the target machine"
  type        = string
}

variable "world_picker_ssh_key" {
  description = "Path to the private key for root SSH access"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

variable "world_picker_package_dir" {
  description = "Path to the package built by deploy/lxc/package.sh"
  type        = string
  default     = "../crafty-world-picker/dist/lxc"
}

variable "crafty_url" {
  description = "Crafty base URL as seen from the target machine"
  type        = string
  default     = "https://127.0.0.1:8443"
}

variable "crafty_server_id" {
  description = "UUID of the Crafty server that hosts the worlds"
  type        = string
}

variable "crafty_api_token" {
  description = "Crafty API key with Commands + Files permissions"
  type        = string
  sensitive   = true
}

variable "world_picker_port" {
  description = "Port nginx listens on"
  type        = number
  default     = 8081
}

locals {
  world_picker_pkg = abspath(var.world_picker_package_dir)

  world_picker_env = <<-EOT
    CRAFTY_URL=${var.crafty_url}
    CRAFTY_SERVER_ID=${var.crafty_server_id}
    CRAFTY_API_TOKEN=${var.crafty_api_token}
    LISTEN_PORT=${var.world_picker_port}
  EOT

  world_picker_files_hash = sha256(join("", [
    for f in sort(fileset(local.world_picker_pkg, "**")) : filesha256("${local.world_picker_pkg}/${f}")
  ]))
}

resource "terraform_data" "crafty_world_picker" {
  triggers_replace = [
    var.world_picker_host,
    sha256(local.world_picker_env),
    local.world_picker_files_hash,
  ]

  connection {
    type        = "ssh"
    host        = var.world_picker_host
    user        = "root"
    private_key = file(pathexpand(var.world_picker_ssh_key))
  }

  provisioner "remote-exec" {
    inline = ["rm -rf /opt/crafty-world-picker", "mkdir -p /opt/crafty-world-picker"]
  }

  provisioner "file" {
    source      = "${local.world_picker_pkg}/"
    destination = "/opt/crafty-world-picker"
  }

  provisioner "file" {
    content     = local.world_picker_env
    destination = "/etc/crafty-world-picker.env"
  }

  provisioner "remote-exec" {
    inline = ["sh /opt/crafty-world-picker/install.sh"]
  }
}
```

## Releases

[../.github/workflows/release.yml](../.github/workflows/release.yml) runs on every pushed `v*` tag:
lint, unit tests, `deploy/lxc/package.sh`, then a GitHub release with
`crafty-world-picker-<tag>.zip` and its `.sha256`, with generated release notes.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Development

`bun run start` (`ng serve`) uses [../proxy.conf.mjs](../proxy.conf.mjs), which does the same mapping as nginx and
reads the three variables from `.env` (template: [../.env.example](../.env.example)).
