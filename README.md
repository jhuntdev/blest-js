# BLEST.js

The NodeJS reference implementation of BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching by default, and provides a modern alternative to REST. It includes examples for Connect, Express, Fastify, Hapi, and Koa.

To learn more about BLEST, please visit the website: https://blest.jhunt.dev

For a front-end implementation in React, please visit https://github.com/jhuntdev/blest-react

## Features

- Built on JSON - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save even more bandwidth
- Single Endpoint - Reduce complexity
- Fully Encrypted - Improve data privacy

## Installation

Install BLEST.js from npm

With npm:
```bash
npm install --save blest-js
```
or using yarn:
```bash
yarn add blest-js
```

## Usage

The default export of this library has an interface similar to Express or Connect. It also provides a `Router` class with a `handle` method for use in an existing NodeJS application and an `HttpClient` class with a `request` method for making BLEST HTTP requests.

```javascript
const express = require('express');
const blest = require('blest-js');

const app = blest({
  timeout: 1000,
  url: '/',
  cors: 'http://localhost:3000'
});
const port = 8080;

const authMiddleware = (params, context) => {
  if (params?.name) {
    context.user = {
      name: params.name
    };
  } else {
    throw new Error('Unauthorized');
  }
};

const greetController = (params, context) => {
  return {
    greeting: `Hi, ${context.user?.name}!`
  };
};

const errorHandler = (params, context, error) => {
  console.log(error);
};

app.use(errorHandler);

app.use(authMiddleware);

app.route('greet', greetController);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### Router

This example uses Express, but you can find examples with other frameworks [here](examples).

```javascript
const express = require('express');
const { Router } = require('blest-js');

const app = express();
const port = 8080;

// Create some middleware (optional)
const authMiddleware = (params, context) => {
  if (context.headers?.auth === 'myToken') {
    return;
  } else {
    throw new Error('Unauthorized');
  }
};

// Create a route controller
const greetController = (params, context) => {
  return {
    greeting: `Hi, ${params.name}!`
  };
};

// Create a BLEST router
const router = new Router({ timeout: 1000 });
router.route('greet', authMiddleware, greetController);

// Parse the JSON body
app.use(express.json());

// Use the request handler
app.post('/', async (req, res, next) => {
  const [result, error] = await router.handle(req.body);
  if (error) {
    return next(error);
  } else {
    res.json(result);
  }
});

// Listen for requests
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### HttpClient

```javascript
const { HttpClient } = require('blest-js');

// Create a client
const client = new HttpClient('http://localhost:8080', {
  maxBatchSize: 25,
  bufferDelay: 10,
  httpHeaders: {
    // ...
  }
});

// Send a request
client.request('greet', { name: 'Steve' }, { "auth": "myToken" })
.then((result) => {
  // Do something with the result
})
.catch((error) => {
  // Do something in case of error
});
```

## License

This project is licensed under the [MIT License](LICENSE).