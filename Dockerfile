# syntax=docker/dockerfile:1

FROM oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:1.28-alpine
ENV LISTEN_PORT=8080 \
    WEB_ROOT=/usr/share/nginx/html \
    CRAFTY_URL= \
    CRAFTY_SERVER_ID= \
    CRAFTY_API_TOKEN= \
    NGINX_ENVSUBST_FILTER=^(LISTEN_PORT|WEB_ROOT|CRAFTY_URL|CRAFTY_SERVER_ID|CRAFTY_API_TOKEN)$
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
COPY deploy/docker/10-check-crafty-env.sh /docker-entrypoint.d/
COPY deploy/nginx/default.conf.template /etc/nginx/templates/
COPY --from=build /app/dist/crafty-world-picker/browser/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${LISTEN_PORT}/healthz" || exit 1
