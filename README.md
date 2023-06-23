# BLEST.js

The NodeJS reference implementation of BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching and selective returns, and provides a modern alternative to REST. It includes examples for Connect, Express, Fastify, Hapi, and Koa.

To learn more about BLEST, please refer to the white paper: https://jhunt.dev/BLEST%20White%20Paper.pdf

For a front-end implementation in React, please visit https://github.com/jhunt/blest-react

## Features

- Built on JSON - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save more bandwidth
- Selective Returns - Save even more bandwidth
- Single Endpoint - Reduce complexity and improve data privacy
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

Use the `createRequestHandler` function to create a request handler suitable for use in an existing NodeJS application. Use the `createHttpServer` function to create a standalone HTTP server for your request handler. Use the `createHttpClient` function to create a BLEST HTTP client.

### createRequestHandler

This example uses Express, but you can find examples with other frameworks [here](examples).

```javascript
const express = require('express')
const { createRequestHandler } = require('blest-js')

const app = express()
const port = 8080

// Create some middleware (optional)
const authMiddleware = (params, context) => {
  if (params?.name) {
    context.user = {
      name: params.name
    }
  } else {
    throw new Error('Unauthorized')
  }
}

// Create a route controller
const greetController = (params, context) => {
  return {
    greeting: `Hi, ${context.user?.name}!`
  }
}

// Create a request handler
const requestHandler = createRequestHandler({
    greet: [authMiddleware, greetController]
})

// Parse the JSON body
app.use(express.json())

// Use the request handler
app.post('/', async (req, res, next) => {
  const [result, error] = await requestHandler(req.body, {
    headers: req.headers
  })
  if (error) {
    return next(error)
  } else {
    res.json(result)
  }
});

// Listen for requests
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
```

### createHttpServer

```javascript
const { createHttpServer } = require('blest-js')

const port = 8080

// Create some middleware (optional)
const authMiddleware = (params, context) => {
  if (params?.name) {
    context.user = {
      name: params.name
    }
  } else {
    throw new Error('Unauthorized')
  }
}

// Create a route controller
const greetController = (params, context) => {
  return {
    greeting: `Hi, ${context.user?.name}!`
  }
}

// Create a request handler
const requestHandler = createRequestHandler({
    greet: [authMiddleware, greetController]
})

// Create a server
const server = createHttpServer(requestHandler)

// Listen for requests
server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
```

### createHttpClient

```javascript
const { createHttpClient } = require('blest-js')

// Create a client
const request = createHttpClient('http://localhost:8080', {
  headers: {
    'Authorization': 'Bearer token'
  }
})

// Send a request
request('greet', { name: 'Steve' }, ['greeting'])
.then((result) => {
  // Do something with the result
})
.catch((error) => {
  // Do something in case of error
})
```

## License

This project is licensed under the [MIT License](LICENSE).