import { configure, runs, tasks } from '@trigger.dev/sdk'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { testAiResponse } from './trigger/test-ai.js'

// Temporary test route, also served by the Worker. The prompt is fixed in the task so that
// callers can't choose what is sent to OpenAI.
const testAi = new Hono()

testAi.get('/ai', async (c) => {
  const { TRIGGER_SECRET_KEY: secretKey } = env<{ TRIGGER_SECRET_KEY?: string }>(c)
  if (!secretKey) {
    return c.json({ error: 'TRIGGER_SECRET_KEY is not set' }, 500)
  }
  configure({ secretKey })

  // ttl expires the run if no worker picks it up, so polling always finishes.
  const handle = await tasks.trigger<typeof testAiResponse>('test-ai-response', undefined, {
    ttl: '30s',
  })
  // A slow interval keeps this under the Workers subrequest limit.
  const run = await runs.poll(handle, { pollIntervalMs: 2000 })

  if (!run.isSuccess) {
    return c.json({ runId: run.id, status: run.status }, 502)
  }
  return c.json({ runId: run.id, text: run.output?.text })
})

export default testAi
