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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = exports.createHttpClient = exports.createHttpServer = void 0;
const http = __importStar(require("http"));
const events_1 = __importDefault(require("events"));
const uuid_1 = require("uuid");
const createHttpServer = (requestHandler, options) => {
    if (options) {
        console.warn('The "options" argument is not yet used, but may be used in the future.');
    }
    const server = http.createServer((req, res) => {
        if (req.url === '/') {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', async () => {
                    let jsonData;
                    try {
                        jsonData = JSON.parse(body);
                    }
                    catch (error) {
                        console.error(error);
                        res.statusCode = 400;
                        res.end(error.message);
                        return;
                    }
                    try {
                        const context = {
                            headers: req.headers,
                        };
                        const [result, error] = await requestHandler(jsonData, context);
                        if (error) {
                            res.statusCode = 500;
                            res.end(error.message);
                        }
                        else if (result) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result));
                        }
                        else {
                            res.statusCode = 204;
                            res.end();
                        }
                    }
                    catch (error) {
                        console.error(error);
                        res.statusCode = 500;
                        res.end(error.message);
                    }
                });
            }
            else {
                res.statusCode = 405;
                res.end();
            }
        }
        else {
            res.statusCode = 404;
            res.end();
        }
    });
    return server;
};
exports.createHttpServer = createHttpServer;
function httpPostRequest(url, data) {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };
        const request = http.request(url, options, (response) => {
            let responseBody = '';
            response.on('data', (chunk) => {
                responseBody += chunk;
            });
            response.on('end', () => {
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    const responseData = JSON.parse(responseBody);
                    resolve(responseData);
                }
                else {
                    reject(new Error(`HTTP POST request failed with status code ${response.statusCode}`));
                }
            });
        });
        request.on('error', (error) => {
            reject(error);
        });
        request.write(requestData);
        request.end();
    });
}
const createHttpClient = (url, options) => {
    if (options) {
        console.warn('The "options" argument is not yet used, but may be used in the future.');
    }
    const maxBatchSize = 100;
    let queue = [];
    let timeout = null;
    const emitter = new events_1.default.EventEmitter();
    const process = () => {
        const newQueue = queue.splice(0, maxBatchSize);
        clearTimeout(timeout);
        if (!queue.length) {
            timeout = null;
        }
        else {
            timeout = setTimeout(() => {
                process();
            }, 1);
        }
        httpPostRequest(url, newQueue)
            .then(async (data) => {
            data.forEach((r) => {
                emitter.emit(r[0], r[2], r[3]);
            });
        })
            .catch((error) => {
            newQueue.forEach((q) => {
                emitter.emit(q[0], null, error);
            });
        });
    };
    const request = (route, params, selector) => {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            }
            else if (params && typeof params !== 'object') {
                return reject(new Error('Params should be an object'));
            }
            else if (selector && !Array.isArray(selector)) {
                return reject(new Error('Selector should be an array'));
            }
            const id = (0, uuid_1.v4)();
            emitter.once(id, (result, error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            queue.push([id, route, params || null, selector || null]);
            if (!timeout) {
                timeout = setTimeout(() => {
                    process();
                }, 1);
            }
        });
    };
    return request;
};
exports.createHttpClient = createHttpClient;
const createRequestHandler = (routes, options) => {
    if (options) {
        console.warn('The "options" argument is not yet used, but may be used in the future');
    }
    const routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9_\-]$/;
    const handler = async (requests, context = {}) => {
        if (!requests || typeof requests !== 'object' || !Array.isArray(requests))
            return handleError(400, 'Request body should be a JSON array');
        const uniqueIds = [];
        const promises = [];
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            if (!Array.isArray(request)) {
                return handleError(400, 'Request item should be an array');
            }
            const id = request[0];
            const route = request[1];
            const parameters = request[2] || null;
            const selector = request[3] || null;
            if (!id || typeof id !== 'string') {
                return handleError(400, 'Request item should have an ID');
            }
            if (!route || typeof route !== 'string') {
                return handleError(400, 'Request item should have a route');
            }
            if (!routeRegex.test(route)) {
                const routeLength = route.length;
                if (routeLength < 2) {
                    return handleError(400, 'Request item route should be at least two characters long');
                }
                else if (route.charAt(routeLength - 1) === '/') {
                    return handleError(400, 'Request item route should not end in a forward slash');
                }
                else if (!/[a-zA-Z]/.test(route.charAt(0))) {
                    return handleError(400, 'Request item route should start with a letter');
                }
                else {
                    return handleError(400, 'Request item route should contain only letters, numbers, dashes, underscores, and forward slashes');
                }
            }
            if (parameters && typeof parameters !== 'object')
                return handleError(400, 'Request item parameters should be a JSON object');
            if (selector && !Array.isArray(selector))
                return handleError(400, 'Request item selector should be a JSON array');
            if (uniqueIds.indexOf(id) > -1)
                return handleError(400, 'Request items should have unique IDs');
            uniqueIds.push(id);
            const routeHandler = routes[route] || routeNotFound;
            const requestObject = {
                id,
                route,
                parameters,
                selector,
            };
            promises.push(routeReducer(routeHandler, requestObject, context));
        }
        const results = await Promise.all(promises);
        return handleResult(results);
    };
    return handler;
};
exports.createRequestHandler = createRequestHandler;
const handleResult = (result) => {
    return [result, null];
};
const handleError = (code, message) => {
    return [null, { code, message }];
};
const routeNotFound = () => {
    throw new Error('Route not found');
};
const routeReducer = async (handler, { id, route, parameters, selector }, context) => {
    try {
        const safeContext = context ? cloneDeep(context) : {};
        let result;
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                const tempResult = await handler[i](parameters, safeContext);
                if (i === handler.length - 1) {
                    result = tempResult;
                }
                else {
                    if (tempResult) {
                        throw new Error('Middleware should not return anything but may mutate context');
                    }
                }
            }
        }
        else {
            result = await handler(parameters, safeContext);
        }
        if (result && (typeof result !== 'object' || Array.isArray(result))) {
            throw new Error('The result, if any, should be a JSON object');
        }
        if (result && selector) {
            result = filterObject(result, selector);
        }
        return [id, route, result, null];
    }
    catch (error) {
        console.error(error);
        return [id, route, null, { message: error.message }];
    }
};
function filterObject(obj, arr) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (arr !== null && arr !== undefined) {
        const filteredObj = {};
        for (const key of arr) {
            if (typeof key === "string" && obj.hasOwnProperty(key)) {
                filteredObj[key] = obj[key];
            }
            else if (Array.isArray(key) && key.length === 2) {
                const nestedObj = obj.hasOwnProperty((_b = (_a = key[0]) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "") ? obj[(_d = (_c = key[0]) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""] : null;
                const nestedArr = key[1];
                if (Array.isArray(nestedObj)) {
                    const filteredArr = [];
                    for (const nested of nestedObj) {
                        if (typeof nested === "object" && nested !== null) {
                            const filteredNestedObj = filterObject(nested, nestedArr);
                            if (Object.keys(filteredNestedObj).length > 0) {
                                filteredArr.push(filteredNestedObj);
                            }
                        }
                    }
                    if (filteredArr.length > 0) {
                        filteredObj[(_f = (_e = key[0]) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : ""] = filteredArr;
                    }
                }
                else if (typeof nestedObj === "object" && nestedObj !== null) {
                    const filteredNestedObj = filterObject(nestedObj, nestedArr);
                    if (Object.keys(filteredNestedObj).length > 0) {
                        filteredObj[(_h = (_g = key[0]) === null || _g === void 0 ? void 0 : _g.toString()) !== null && _h !== void 0 ? _h : ""] = filteredNestedObj;
                    }
                }
            }
        }
        return filteredObj;
    }
    return {};
}
function cloneDeep(value) {
    if (typeof value !== 'object' || value === null) {
        return value;
    }
    let clonedValue;
    if (Array.isArray(value)) {
        clonedValue = [];
        for (let i = 0; i < value.length; i++) {
            clonedValue[i] = cloneDeep(value[i]);
        }
    }
    else {
        clonedValue = {};
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                clonedValue[key] = cloneDeep(value[key]);
            }
        }
    }
    return clonedValue;
}
