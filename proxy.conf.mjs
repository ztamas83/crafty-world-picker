// Dev-server proxy: mirrors the production nginx config (deploy/nginx/default.conf.template).
// Reads CRAFTY_URL, CRAFTY_API_TOKEN and CRAFTY_SERVER_ID from the environment or from `.env`.
try {
  process.loadEnvFile();
} catch {
  // No .env file; rely on the process environment.
}

const { CRAFTY_URL, CRAFTY_API_TOKEN, CRAFTY_SERVER_ID } = process.env;

if (!CRAFTY_URL || !CRAFTY_API_TOKEN || !CRAFTY_SERVER_ID) {
  console.warn(
    '[proxy] CRAFTY_URL, CRAFTY_API_TOKEN or CRAFTY_SERVER_ID is not set (see .env.example). Crafty calls will fail.',
  );
}

export default {
  '/api/server': {
    target: CRAFTY_URL,
    secure: false, // Crafty uses a self-signed certificate by default
    changeOrigin: true,
    pathRewrite: { '^/api/server': `/api/v2/servers/${CRAFTY_SERVER_ID}` },
    headers: { Authorization: `Bearer ${CRAFTY_API_TOKEN}` },
  },
};
