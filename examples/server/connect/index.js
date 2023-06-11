const connect = require('connect');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = connect();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

const router = require('./router');
app.use('/', async (req, res) => {
  const [result, error] = await router(req.body);
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