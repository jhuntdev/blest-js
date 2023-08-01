const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { Router } = require('blest-js');

const app = new Koa();
const port = 8080;

app.use(cors());
app.use(bodyParser());

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

app.use(async (ctx) => {
  const request = ctx.request;
  const [result, error] = await router.handle(request.body, {
    headers: ctx.request.headers
  });
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