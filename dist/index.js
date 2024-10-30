"use strict";
/*
  -------------------------------------------------------------------------------------------------
  BLEST (Batch-able, Lightweight, Encrypted State Transfer) - A modern alternative to REST
  (c) 2023-2024 JHunt <hello@jhunt.dev>
  License: MIT
  -------------------------------------------------------------------------------------------------
  Sample Request [id, endpoint, body (optional), headers (optional)]
  [
    [
      "abc123",
      "math",
      {
        "operation": "divide",
        "dividend": 22,
        "divisor": 7
      },
      {
        "auth": "myToken"
      }
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
exports.HttpClient = exports.Router = void 0;
const router_1 = require("./router");
const client_1 = require("./client");
var router_2 = require("./router");
Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return router_2.Router; } });
var client_2 = require("./client");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return client_2.HttpClient; } });
const defaultExport = {
    Router: router_1.Router,
    HttpClient: client_1.HttpClient
};
module.exports = defaultExport;
exports.default = defaultExport;
