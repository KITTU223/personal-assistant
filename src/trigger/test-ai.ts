import { openai } from '@ai-sdk/openai'
import { task } from '@trigger.dev/sdk'
import { generateText } from 'ai'

// Temporary: backs the local-only GET /test/ai route. Remove together with it.
export const testAiResponse = task({
  id: 'test-ai-response',
  maxDuration: 60,
  retry: { maxAttempts: 1 },
  run: async () => {
    const { text } = await generateText({
      model: openai('gpt-6-luna'),
      prompt: 'Write one short, friendly sentence confirming that this test worked.',
      reasoning: 'none',
      maxOutputTokens: 50,
    })
    return { text }
  },
})
