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
import { createHttpClient } from './client';

export { Router, RouterOptions } from './router';
export { createHttpServer, ServerOptions } from './server';
export { createHttpClient } from './client';
export { createRequestHandler } from './handler';

class BlestApp extends Router {

  options: any;

  constructor(routerOptions?: RouterOptions, serverOptions?: ServerOptions) {
    super(routerOptions);
    this.options = serverOptions;
  }

  public listen(...args: any[]) {
    const routes = this.routes;
    const options = this.options;
    const server = createHttpServer(handleRequest.bind(null, routes), options);
    server.listen(...args);
  }

}

const defaultExport = (routerOptions?: RouterOptions, serverOptions?: ServerOptions) => {
  return new BlestApp(routerOptions, serverOptions);
};

defaultExport.Router = Router;
defaultExport.createHttpServer = createHttpServer;
defaultExport.createHttpClient = createHttpClient;
defaultExport.createRequestHandler = createRequestHandler;

module.exports = defaultExport

export default defaultExport
