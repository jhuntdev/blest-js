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
exports.createHttpClient = exports.HTTPClient = exports.createHttpServer = exports.HTTPServer = exports.Router = void 0;
const router_1 = require("./router");
var router_2 = require("./router");
Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return router_2.Router; } });
var server_1 = require("./server");
Object.defineProperty(exports, "HTTPServer", { enumerable: true, get: function () { return server_1.HTTPServer; } });
Object.defineProperty(exports, "createHttpServer", { enumerable: true, get: function () { return server_1.createHttpServer; } });
var client_1 = require("./client");
Object.defineProperty(exports, "HTTPClient", { enumerable: true, get: function () { return client_1.HTTPClient; } });
Object.defineProperty(exports, "createHttpClient", { enumerable: true, get: function () { return client_1.createHttpClient; } });
// export { createRequestHandler } from './handler';
exports.default = (config) => {
    return new router_1.Router(config);
};
