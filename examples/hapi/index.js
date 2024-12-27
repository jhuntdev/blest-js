const Hapi = require('@hapi/hapi');
const { Router } = require('blest-js');

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
      const [result, error] = await router.handle(request.payload, {
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