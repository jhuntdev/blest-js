const { createRequestHandler } = require('blest-js');
const router = createRequestHandler({
  hello: () => {
    return {
      hello: 'world',
      bonjour: 'le monde',
      hola: 'mundo',
      hallo: 'welt'
    }
  },
  greet: ({ name }, context) => {
    return {
      geeting: `Hi, ${name}!`
    }
  },
  fail: () => {
    throw new Error('Intentional failure')
  }
});
module.exports = router;