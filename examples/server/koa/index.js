const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const app = new Koa();
const port = 8080;

app.use(cors());
app.use(bodyParser());

const router = require('./router');
app.use(async (ctx) => {
  const request = ctx.request;
  const [result, error] = await router(request.body);
  ctx.type = 'application/json';
  if (error) {
    ctx.status = 500;
    ctx.body = JSON.stringify(error);
  } else {
    ctx.status = 200;
    ctx.body = JSON.stringify(result);
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});