const express = require('express');
const cors = require('cors');
const { Router } = require('blest-js');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const router = new Router();

router.route('hello', () => {
  return {
    hello: 'world',
    bonjour: 'le monde',
    hola: 'mundo',
    hallo: 'welt'
  }
});

router.route('greet', ({ name }, context) => {
  context.user = {
    name: name || 'Tarzan'
  }
}, ({ name }, context) => {
  return {
    greeting: `Hi, ${context.user.name}!`
  }
});

router.route('fail', () => {
  throw new Error('Intentional failure')
});

app.post('/', async (req, res, next) => {
  const [result, error] = await router.handle(req.body, {
    headers: req.headers
  });
  if (error) {
    return next(error);
  } else {
    res.json(result);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});