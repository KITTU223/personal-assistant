import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { timingSafeEqual } from 'hono/utils/buffer'

type TelegramEnv = {
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_WEBHOOK_SECRET?: string
  OPENAI_API_KEY?: string
}

type Update = {
  update_id: number
  message?: {
    chat: { id: number }
    text?: string
  }
}

const FALLBACK_REPLY = "Sorry, I couldn't generate a reply. Please try again."

const telegram = new Hono()

telegram.post('/webhook', async (c) => {
  const {
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_WEBHOOK_SECRET: secret,
    OPENAI_API_KEY: openaiKey,
  } = env<TelegramEnv>(c)
  if (!token || !secret || !openaiKey) {
    console.error('TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and OPENAI_API_KEY must be set')
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

  if (update.message?.text) {
    // Always acknowledge below: Telegram redelivers on any non-2xx response and
    // holds that chat's later updates back, so a failed reply must not fail the
    // webhook.
    try {
      const reply = await generateReply(openaiKey, update.message.text).catch((err) => {
        // Log the message only: the error object also carries the user's text.
        console.error(`Failed to generate a reply for update ${update.update_id}: ${err}`)
        return FALLBACK_REPLY
      })
      await sendMessage(token, update.message.chat.id, reply || FALLBACK_REPLY)
    } catch (err) {
      console.error(`Failed to reply to update ${update.update_id}:`, err)
    }
  }

  return c.body(null, 200)
})

async function generateReply(apiKey: string, prompt: string) {
  const openai = createOpenAI({ apiKey })
  const { text } = await generateText({
    model: openai('gpt-6-luna'),
    instructions: 'You are a helpful assistant in a Telegram chat. Reply briefly, in plain text.',
    prompt,
    reasoning: 'none',
    maxOutputTokens: 500,
    // Stay well inside Telegram's webhook window, or it redelivers the update.
    timeout: 20_000,
  })
  return text
}

async function sendMessage(token: string, chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    throw new Error(`sendMessage returned ${res.status}: ${await res.text()}`)
  }
}

export default telegram
