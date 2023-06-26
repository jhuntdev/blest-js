const fastify = require('fastify')();
const cors = require('@fastify/cors');
const { createRequestHandler } = require('blest-js');

const port = 8080;

fastify.register(cors);

const requestHandler = createRequestHandler({
  hello: () => {
    return {
      hello: 'world',
      bonjour: 'le monde',
      hola: 'mundo',
      hallo: 'welt'
    }
  },
  greet: [
    ({ name }, context) => {
        context.user = {
            name: name || 'Tarzan'
        }
    },
    ({ name }, context) => {
        return {
            greeting: `Hi, ${context.user.name}!`
        }
    }
  ],
  fail: () => {
    throw new Error('Intentional failure')
  }
});

fastify.post('/', async (request, reply) => {
  const [result, error] = await requestHandler(request.body, {
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