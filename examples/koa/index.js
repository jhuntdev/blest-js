const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { createRequestHandler } = require('blest-js');

const app = new Koa();
const port = 8080;

app.use(cors());
app.use(bodyParser());

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

app.use(async (ctx) => {
  const request = ctx.request;
  const [result, error] = await requestHandler(request.body);
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