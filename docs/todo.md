# TODO

## Runtime configuration and Crafty API token

**Context:** the frontend will run locally as a Docker container or as a system service. Config (Crafty API token, server ID) should come from environment variables at runtime, not be baked into the build.

**Constraint:** the app runs in the browser, which cannot read server environment variables.

**Related production blockers** (verified in the Crafty 4.11.0 source):
- Crafty's CORS `Access-Control-Allow-Methods` does not include `PATCH`. Writing a file (`PATCH /api/v2/servers/{id}/files`) fails when called from another origin.
- Crafty serves HTTPS on port 8443 with a self-signed certificate by default, which browsers reject.
- Both mean the frontend must call Crafty through a same-origin reverse proxy in production.

### Options

1. **Build-time `--define`**
   - How: `ng build --define "CRAFTY_SERVER_ID='$CRAFTY_SERVER_ID'"`, with `declare const CRAFTY_SERVER_ID: string;` in the code.
   - Downsides: you must rebuild to change a value, and the values are visible in the JavaScript bundle.
2. **Runtime `config.json`**
   - How: the container or service writes `config.json` from environment variables at startup (e.g. with `envsubst`). The app loads it before starting, using `provideAppInitializer()`, into a `Config` service.
   - Upside: no rebuild needed to change values.
   - Downside: the token is still visible in the browser.
3. **Reverse proxy injects the token (recommended)**
   - How: the proxy reads `CRAFTY_API_TOKEN` from its own environment and adds `Authorization: Bearer ...` to every request it forwards to `/api`.
   - Upside: the token never reaches the browser.
   - Development: `proxy.conf.js` with `headers: { Authorization: \`Bearer ${process.env.CRAFTY_API_TOKEN}\` }`, and `proxyConfig` in `angular.json` pointed at it. Not yet tested.
   - Production: nginx or Caddy in the same container or service. The official nginx image fills environment variables into `/etc/nginx/templates/*.template` when it starts.
   - App changes: remove `craftyApiToken` from the environment files and the `headers` from the `Crafty` service. The server ID is not a secret, so it can stay in `environment.ts` or come from option 2.

### Open questions

- Docker container or system service? This decides whether the proxy is nginx in the same image or a separate reverse proxy.
- Should the server ID also be configurable at runtime (option 2), or fixed per build?
- Rotate the current Crafty API token. It was printed in a Claude session log on 2026-11-04.
