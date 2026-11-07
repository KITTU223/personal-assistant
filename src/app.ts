import { Hono } from 'hono'
import telegram from './telegram.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/marco', (c) => {
  return c.text('polo')
})

app.route('/telegram', telegram)

export default app
