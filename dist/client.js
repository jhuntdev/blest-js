"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = exports.HttpClient = void 0;
const http_1 = __importDefault(require("http"));
const events_1 = __importDefault(require("events"));
const uuid_1 = require("uuid");
class HttpClient {
    constructor(url, options) {
        this.url = '';
        this.httpHeaders = {};
        this.maxBatchSize = 25;
        this.bufferDelay = 10;
        this.queue = [];
        this.timeout = null;
        this.emitter = new events_1.default.EventEmitter();
        this.url = url;
        if (options) {
            const optionsError = validateClientOptions(options);
            if (optionsError) {
                throw new Error(optionsError);
            }
        }
    }
    process() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (!this.queue.length) {
            return;
        }
        const copyQueue = this.queue.map((q) => [...q]);
        this.queue = [];
        const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize);
        for (let i = 0; i < batchCount; i++) {
            const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize);
            httpPostRequest(this.url, myQueue, this.httpHeaders)
                .then(async (data) => {
                data.forEach((r) => {
                    this.emitter.emit(r[0], r[2], r[3]);
                });
            })
                .catch((error) => {
                myQueue.forEach((q) => {
                    this.emitter.emit(q[0], null, error);
                });
            });
        }
    }
    request(route, body, headers) {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            }
            else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            }
            else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = (0, uuid_1.v1)();
            this.emitter.once(id, (result, error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            this.queue.push([id, route, body || null, headers || null]);
            if (!this.timeout) {
                this.timeout = setTimeout(() => { this.process(); }, this.bufferDelay);
            }
        });
    }
}
exports.HttpClient = HttpClient;
;
function httpPostRequest(url, data, httpHeaders = {}) {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                ...httpHeaders,
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
;
const validateClientOptions = (options) => {
    if (!options) {
        return false;
    }
    else if (typeof options !== 'object') {
        return 'Options should be an object';
    }
    else {
        if (options.httpHeaders) {
            if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
                return '"httpHeaders" option should be an object';
            }
        }
        if (options.maxBatchSize) {
            if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
                return '"maxBatchSize" option should be an integer';
            }
            else if (options.maxBatchSize < 1) {
                return '"maxBatchSize" option should be greater than or equal to one';
            }
        }
        if (options.bufferDelay) {
            if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
                return '"bufferDelay" option should be an integer';
            }
            else if (options.bufferDelay < 0) {
                return '"bufferDelay" option should be greater than or equal to zero';
            }
        }
    }
    return false;
};
const createHttpClient = (url, options) => {
    console.warn('createHttpClient is deprecated - use the HttpClient class instead');
    if (options) {
        const optionsError = validateClientOptions(options);
        if (optionsError) {
            throw new Error(optionsError);
        }
    }
    const httpHeaders = (options === null || options === void 0 ? void 0 : options.httpHeaders) || null;
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
        httpPostRequest(url, newQueue, httpHeaders)
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
    const request = (route, body, headers) => {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            }
            else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            }
            else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = (0, uuid_1.v1)();
            emitter.once(id, (result, error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            queue.push([id, route, body || null, headers || null]);
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
