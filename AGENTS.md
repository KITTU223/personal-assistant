Run `npx hono --help` first, and use the CLI instead of a dev server.

## Cloudflare secrets

Never overwrite `TRIGGER_SECRET_KEY` on Cloudflare with the local value from `.env`. The local value is not for production, and the Worker holds its own production key.

When syncing environment variables or secrets to Cloudflare, always exclude `TRIGGER_SECRET_KEY`, and don't add it to `worker.secrets.env`. Only change it when the user explicitly asks to update that key on Cloudflare.