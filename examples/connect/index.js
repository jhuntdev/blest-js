const connect = require('connect');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Router } = require('blest-js');

const app = connect();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

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

app.use('/', async (req, res) => {
  const [result, error] = await router.handle(req.body, {
    httpHeaders: req.headers
  });
  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(error));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});