const express = require('express');
const cors = require('cors');
const { createRequestHandler } = require('blest-js');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

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
            geeting: `Hi, ${context.user.name}!`
        }
    }
  ],
  fail: () => {
    throw new Error('Intentional failure')
  }
});

app.post('/', async (req, res, next) => {
  const [result, error] = await requestHandler(req.body);
  if (error) {
    return next(error);
  } else {
    res.json(result);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});