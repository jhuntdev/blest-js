const Hapi = require('@hapi/hapi');

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: 'localhost',
    routes: {
      cors: true
    }
  });

  const router = require('./router');
  server.route({
    method: 'POST',
    path: '/',
    handler: async (request, h) => {
      const [result, error] = await router(request.payload);
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