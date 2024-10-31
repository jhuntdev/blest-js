var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "uuid", "./events"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpClient = void 0;
    const uuid_1 = require("uuid");
    const events_1 = __importDefault(require("./events"));
    class HttpClient {
        constructor(url, options) {
            this.url = '';
            this.httpHeaders = {};
            this.maxBatchSize = 25;
            this.bufferDelay = 10;
            this.queue = [];
            this.timeout = null;
            this.emitter = new events_1.default();
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
                    .then((data) => __awaiter(this, void 0, void 0, function* () {
                    data.forEach((r) => {
                        this.emitter.emit(r[0], r[2], r[3]);
                    });
                }))
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
    const httpPostRequest = (url_1, data_1, ...args_1) => __awaiter(void 0, [url_1, data_1, ...args_1], void 0, function* (url, data, httpHeaders = {}) {
        const requestData = JSON.stringify(data);
        const options = {
            method: 'POST',
            body: requestData,
            mode: 'cors',
            headers: Object.assign(Object.assign({}, httpHeaders), { 'Accept': 'application/json', 'Content-Type': 'application/json' })
        };
        const response = yield fetch(url, options);
        if (!response.ok)
            throw new Error(`HTTP POST request failed with status code ${response.status}`);
        return yield response.json();
    });
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
});
