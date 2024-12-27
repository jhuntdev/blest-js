# BLEST.js

The NodeJS reference implementation of BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching by default, and provides a modern alternative to REST. It includes examples for Connect, Express, Fastify, Hapi, and Koa.

To learn more about BLEST, please visit the website: https://blest.jhunt.dev

For a front-end implementation in React, please visit https://github.com/jhuntdev/blest-react

## Features

- Built on JSON - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save even more bandwidth
- Single Endpoint - Reduce complexity and facilitate introspection
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

### Router

This example uses Express, but you can find examples with other frameworks [here](examples).

```javascript
const express = require('express');
const { Router } = require('blest-js');

const app = express();
const port = 8080;

// Create some middleware (optional)
const loggingMiddleware = async (params, context, next) => {
  const startTime = Date.now()
  await next()
  const endTime = Date.now()
  console.log(context.route, endTime - startTime)
};

// Create a route controller
const greetController = (params, context) => {
  return {
    greeting: `Hi, ${params.name}!`
  };
};

// Create a BLEST router
const router = new Router({ timeout: 1000 });
router.route('greet', loggingMiddleware, greetController);

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
client.request('greet', { name: 'Steve' })
.then((result) => {
  // Do something with the result
})
.catch((error) => {
  // Do something in case of error
});
```

## License

This project is licensed under the [MIT License](LICENSE).