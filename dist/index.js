"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = exports.createHttpClient = exports.createHttpServer = exports.Router = void 0;
const router_1 = require("./router");
const handler_1 = require("./handler");
const server_1 = require("./server");
const client_1 = require("./client");
var router_2 = require("./router");
Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return router_2.Router; } });
var server_2 = require("./server");
Object.defineProperty(exports, "createHttpServer", { enumerable: true, get: function () { return server_2.createHttpServer; } });
var client_2 = require("./client");
Object.defineProperty(exports, "createHttpClient", { enumerable: true, get: function () { return client_2.createHttpClient; } });
var handler_2 = require("./handler");
Object.defineProperty(exports, "createRequestHandler", { enumerable: true, get: function () { return handler_2.createRequestHandler; } });
class BlestApp extends router_1.Router {
    constructor(routerOptions, serverOptions) {
        super(routerOptions);
        this.options = serverOptions;
    }
    listen(...args) {
        const routes = this.routes;
        const options = this.options;
        const server = (0, server_1.createHttpServer)(handler_1.handleRequest.bind(null, routes), options);
        server.listen(...args);
    }
}
const defaultExport = (routerOptions, serverOptions) => {
    return new BlestApp(routerOptions, serverOptions);
};
defaultExport.Router = router_1.Router;
defaultExport.createHttpServer = server_1.createHttpServer;
defaultExport.createHttpClient = client_1.createHttpClient;
defaultExport.createRequestHandler = handler_1.createRequestHandler;
module.exports = defaultExport;
exports.default = defaultExport;
