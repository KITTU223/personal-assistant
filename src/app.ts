import { Hono } from 'hono'
import telegram from './telegram.js'
import testAi from './test-ai.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/marco', (c) => {
  return c.text('polo')
})

app.route('/telegram', telegram)
app.route('/test', testAi)

export default app
