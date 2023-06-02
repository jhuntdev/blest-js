# BLEST.js

The JavaScript reference implementation of BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching and selective returns, and provides a modern alternative to REST. It includes server-side support for NodeJS (see examples for different frameworks below) and client-side support for React and Vue (more to come!).

To more fully understand the goals of BLEST, please refer to the white paper [https://jhunt.dev/BLEST%20White%20Paper.pdf].

## Features

- JSON Payloads - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save more bandwidth
- Selective Returns - Save even more bandwidth
- Single Endpoint - Reduce complexity and improve data privacy
- Fully Encrypted - Improve data privacy

## Installation

Install BLEST from npm

With npm:
```bash
npm install --save blest
```
or using yarn:
```bash
yarn add blest
```

## Usage

### Server-side Request Handler

Use the `createRequestHandler` function to create a request handler suitable for use in a Node.js application. The following example uses Express, but examples are available for Express, Connect, Koa, Hapi, Fastify, and SocketIO.

```javascript
const express = require('express');
const { createRequestHandler } = require('blest');

const app = express();
const port = 3000;

// Your router implementation
const router = {
    greet: async ({ name }) => {
        return {
            greeting: `Hi, ${name}!`
        }
    }
}

// Create a request handler
const requestHandler = createRequestHandler(router);

// Parse the JSON body
app.use(express.json());

// Use the request handler
app.post('/', async (req, res, next) => {
  const [result, error] = await requestHandler(req.body);
  if (error) {
    return next(error);
  } else {
    res.json(result);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### Client-side Libraries

Client-side libraries assist in batching and processing requests and commands. Currently available for React with other frameworks coming soon.

#### React

```javascript
import React from 'react';
import { useBlestRequest, useBlestCommand } from 'blest/react';

// Use the useBlestRequest hook for fetching data
const MyComponent = () => {
  const { data, loading, error } = useBlestRequest('listItems', { limit: 24 });

  // Render your component
  // ...
};

// Use the useBlestCommand hook for sending data
const MyForm = () => {
  const [submitMyForm, { data, loading, error }] = useBlestCommand('submitForm');

  // Render your form
  // ...
};
```

## Contributing

We actively welcome pull requests. Learn how to [contribute](CONTRIBUTING.md) for more information.

## License

This project is licensed under the [MIT License](LICENSE).