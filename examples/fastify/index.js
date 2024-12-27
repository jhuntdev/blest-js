const fastify = require('fastify')();
const cors = require('@fastify/cors');
const { Router } = require('blest-js');

const port = 8080;

fastify.register(cors);

const router = new Router();

router.route('hello', () => {
  const languages = [
    { hello: 'world' },
    { bonjour: 'le monde' },
    { hola: 'mundo' },
    { hallo: 'welt' }
  ];
  const index = Math.floor(Math.random() * languages.length);
  return languages[index];
});

router.route('greet', (body) => {
  return {
    greeting: `Hi, ${body.name}!`
  }
});

router.route('fail', () => {
  throw new Error('Intentional failure')
});

fastify.post('/', async (request, reply) => {
  const [result, error] = await router.handle(request.body, {
    headers: request.headers
  });
  if (error) {
    return reply.code(500).type('application/json').send(error)
  } else {
    return reply.code(200).type('application/json').send(result)
  }
});

fastify.listen({
  port
}).then(() => {
  console.log(`Server listening on port ${port}`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});