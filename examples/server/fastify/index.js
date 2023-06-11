const fastify = require('fastify')();
const cors = require('@fastify/cors');
const port = 8080;

fastify.register(cors);

const router = require('./router');
fastify.post('/', async (request, reply) => {
  const [result, error] = await router(request.body);
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