const Hapi = require('@hapi/hapi');
const { createRequestHandler } = require('blest-js');

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

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: 'localhost',
    routes: {
      cors: true
    }
  });

  server.route({
    method: 'POST',
    path: '/',
    handler: async (request, h) => {
      const [result, error] = await requestHandler(request.payload, {
        headers: request.headers
      });
      if (error) {
        return h.response(error).code(500).type('application/json')
      } else {
        return h.response(result).code(200).type('application/json')
      }
    }
  });

  await server.start();
  console.log('Server listening on port %s', server.info.port);
};

init().catch(err => {
  console.error(err);
  process.exit(1);
});