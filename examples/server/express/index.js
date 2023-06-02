const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const router = require('../router');
app.post('/', async (req, res, next) => {
  const [result, error] = await router(req.body);
  if (error) {
    return next(error);
  } else {
    res.json(result);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});