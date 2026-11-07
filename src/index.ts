import { serve } from '@hono/node-server'
import app from './app.js'
import testAi from './test-ai.js'

// Local only: this file isn't the Worker entrypoint, so Cloudflare never gets this route.
app.route('/test', testAi)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
