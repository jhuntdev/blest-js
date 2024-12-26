import { Hono, Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Router } from 'npm:blest-js'

const router = new Router()

router.route('hello', () => {
  const languages = [
    { hello: 'world' },
    { bonjour: 'le monde' },
    { hola: 'mundo' },
    { hallo: 'welt' }
  ]
  const index = Math.floor(Math.random() * languages.length)
  return languages[index]
})

const authMiddleware = (body: any, context: any) => {
  if (context.headers?.auth === 'myToken') {
    return
  } else {
    throw new Error('Unauthorized')
  }
}

router.route('greet', authMiddleware, (body: any, context: any) => {
  return {
    greeting: `Hi, ${body.name}!`
  }
})

router.route('fail', () => {
  throw new Error('Intentional failure')
})

const app = new Hono()

app.use(secureHeaders())
app.use(cors())
app.use(logger())

app.post('/', async (c: Context) => {
  const [result, error] = await router.handle(await c.req.json())
  if (error) {
    return c.json(error, 500)
  } else {
    return c.json(result, 200)
  }
})

export default app