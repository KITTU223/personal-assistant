import { logger, task } from '@trigger.dev/sdk'

export const helloWorld = task({
  id: 'hello-world',
  run: async (payload: { name?: string }) => {
    const message = `Hello, ${payload.name ?? 'world'}!`
    logger.info(message)
    return { message }
  },
})
