const { createRequestHandler, createHttpServer } = require('blest-js');

const port = 8080;

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

const server = createHttpServer(requestHandler)

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});