# BLEST.js

The JavaScript reference implementation of BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching and selective returns, and provides a modern alternative to REST. It includes examples for Connect, Express, Fastify, Hapi, and Koa.

To learn more about BLEST, please refer to the white paper: https://jhunt.dev/BLEST%20White%20Paper.pdf

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

### Server-side

Use the `createServer` function to create a standalone HTTP server, or use the `createRequestHandler` function to create a request handler suitable for use in an existing NodeJS application. Both functions allow you to define middleware in your router.

### createServer

```javascript
const { createServer } = require('blest-js')

const port = 3000

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

// Define your router
const router = {
    greet: [authMiddleware, greetController]
}

// Create a server
const server = createServer(router)

// Listen for requests
server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
```

#### createRequestHandler

This example uses Express, but you can find examples with other frameworks [here](examples).

```javascript
const express = require('express')
const { createRequestHandler } = require('blest-js')

const app = express()
const port = 3000

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

// Define your router
const router = {
    greet: [authMiddleware, greetController]
}

// Create a request handler
const requestHandler = createRequestHandler(router)

// Parse the JSON body
app.use(express.json())

// Use the request handler
app.post('/', async (req, res, next) => {
  const [result, error] = await requestHandler(req.body)
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

### Client-side

Client-side libraries assist in batching and processing requests and commands. Currently available for React with other frameworks coming soon.

#### React

```javascript
import React from 'react'
import { useBlestRequest, useBlestCommand } from 'blest-react'

// Use the useBlestRequest hook for fetching data
const MyComponent = () => {
  const { data, loading, error } = useBlestRequest('listItems', { limit: 24 })

  return (
    // Render your component
  )
}

// Use the useBlestCommand hook for sending data
const MyForm = () => {
  const [submitMyForm, { data, loading, error }] = useBlestCommand('submitForm')
  
  const handleSubmit = (values) => {
    return submitMyForm(values)
  }

  return (
    // Render your form
  )
}
```

## Contributing

We actively welcome pull requests. Learn how to [contribute](CONTRIBUTING.md) for more information.

## License

This project is licensed under the [MIT License](LICENSE).