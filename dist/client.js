"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = void 0;
const http_1 = __importDefault(require("http"));
const events_1 = __importDefault(require("events"));
const uuid_1 = require("uuid");
const createHttpClient = (url, options) => {
    if (options) {
        const optionsError = validateClientOptions(options);
        if (optionsError) {
            throw new Error(optionsError);
        }
    }
    const headers = (options === null || options === void 0 ? void 0 : options.headers) || null;
    const maxBatchSize = (options === null || options === void 0 ? void 0 : options.maxBatchSize) || 100;
    const bufferDelay = (options === null || options === void 0 ? void 0 : options.bufferDelay) || 10;
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
            }, bufferDelay);
        }
        httpPostRequest(url, newQueue, headers)
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
function httpPostRequest(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };
        const request = http_1.default.request(url, options, (response) => {
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
const validateClientOptions = (options) => {
    if (!options) {
        return false;
    }
    else if (typeof options !== 'object') {
        return 'Options should be an object';
    }
    else {
        if (options.headers) {
            if (typeof options.headers !== 'object') {
                return '"headers" option should be an object';
            }
        }
        if (options.maxBatchSize) {
            if (typeof options.maxBatchSize !== 'number') {
                return '"maxBatchSize" option should be a number';
            }
            else if (options.maxBatchSize < 1) {
                return '"maxBatchSize" option should be greater than or equal to one';
            }
            else if (options.maxBatchSize > 20) {
                !options.disableWarnings && console.warn('"Batching more than 20 requests is not recommended');
            }
        }
        if (options.bufferDelay) {
            if (typeof options.bufferDelay !== 'number') {
                return '"bufferDelay" option should be a number';
            }
            else if (options.bufferDelay < 0) {
                return '"bufferDelay" option should be greater than or equal to zero';
            }
            else if (options.bufferDelay > 1000) {
                !options.disableWarnings && console.warn('"Buffering for longer than 1000 milliseconds is not recommended');
            }
        }
    }
    return false;
};
