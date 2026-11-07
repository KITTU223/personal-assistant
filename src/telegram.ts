import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { timingSafeEqual } from 'hono/utils/buffer'

type TelegramEnv = {
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_WEBHOOK_SECRET?: string
}

type Update = {
  update_id: number
  message?: {
    message_id: number
    chat: { id: number }
  }
}

const telegram = new Hono()

telegram.post('/webhook', async (c) => {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret } = env<TelegramEnv>(c)
  if (!token || !secret) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set')
    return c.text('Server misconfigured', 500)
  }

  const received = c.req.header('X-Telegram-Bot-Api-Secret-Token') ?? ''
  if (!(await timingSafeEqual(received, secret))) {
    return c.text('Unauthorized', 401)
  }

  const update = await c.req.json<Update>().catch(() => null)
  if (!update) {
    return c.text('Bad Request', 400)
  }

  if (update.message) {
    // Always acknowledge below: Telegram redelivers on any non-2xx response and
    // holds that chat's later updates back, so a message that can never be
    // copied (e.g. a service message) must not fail the webhook.
    try {
      await echo(token, update.message)
    } catch (err) {
      console.error(`Failed to echo update ${update.update_id}:`, err)
    }
  }

  return c.body(null, 200)
})

// copyMessage rather than sendMessage, so photos, stickers, voice notes and
// other non-text messages are echoed as well.
async function echo(token: string, message: NonNullable<Update['message']>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/copyMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: message.chat.id,
      from_chat_id: message.chat.id,
      message_id: message.message_id,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    throw new Error(`copyMessage returned ${res.status}: ${await res.text()}`)
  }
}

export default telegram
