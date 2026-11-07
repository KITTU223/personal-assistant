import { bindings, defineConfig } from 'cf/config'
import * as entrypoint from './src/app.ts' with { type: 'cf-worker' }

export default defineConfig({
  worker: {
    name: 'insist-clone',
    compatibilityDate: '2026-11-07',
    entrypoint,
    env: {
      TELEGRAM_BOT_TOKEN: bindings.secret(),
      TELEGRAM_WEBHOOK_SECRET: bindings.secret(),
      OPENAI_API_KEY: bindings.secret(),
    },
  },
})
