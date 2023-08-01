/*
  -------------------------------------------------------------------------------------------------
  BLEST (Batch-able, Lightweight, Encrypted State Transfer) - A modern alternative to REST
  (c) 2023 JHunt <blest@jhunt.dev>
  License: MIT
  -------------------------------------------------------------------------------------------------
  Sample Request [id, endpoint, parameters (optional), selector (optional)]
  [
    [
      "abc123",
      "math",
      {
        "operation": "divide",
        "dividend": 22,
        "divisor": 7
      },
      ["status",["result",["quotient"]]]
    ]
  ]
  -------------------------------------------------------------------------------------------------
  Sample Response [id, endpoint, result, error (optional)]
  [
    [
      "abc123",
      "math",
      {
        "status": "Successfully divided 22 by 7",
        "result": {
          "quotient": 3.1415926535
        }
      },
      {
        "message": "If there was an error you would see it here"
      }
    ]
  ]
  -------------------------------------------------------------------------------------------------
*/

import { Router, RouterOptions } from './router';
import { createRequestHandler, handleRequest } from './handler';
import { createHttpServer, ServerOptions } from './server';
import { HttpClient, createHttpClient } from './client'

export { Router, RouterOptions } from './router';
export { createHttpServer, ServerOptions } from './server';
export { HttpClient, createHttpClient, ClientOptions } from './client';
export { createRequestHandler } from './handler';

interface BlestAppOptions extends RouterOptions, ServerOptions {}

class BlestApp extends Router {

  options: BlestAppOptions;

  constructor(options?: BlestAppOptions) {
    super(options);
    this.options = options || {};
  }

  public listen(...args: any[]) {
    const routes = this.routes;
    const options = this.options;
    const server = createHttpServer(handleRequest.bind(null, routes), options);
    server.listen(...args);
  }

}

const defaultExport = (options?: BlestAppOptions) => {
  return new BlestApp(options);
};

defaultExport.Router = Router;
defaultExport.createHttpServer = createHttpServer;
defaultExport.HttpClient = HttpClient;
defaultExport.createHttpClient = createHttpClient;
defaultExport.createRequestHandler = createRequestHandler;

module.exports = defaultExport;

export default defaultExport;
