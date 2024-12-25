import { EventEmitter } from './events';
import { idGenerator } from './utilities';
export class HttpClient {
    url = '';
    httpHeaders = {};
    maxBatchSize = 25;
    bufferDelay = 10;
    queue = [];
    timeout = null;
    emitter = new EventEmitter();
    idGenerator = idGenerator;
    constructor(url, options) {
        this.url = url;
        if (options) {
            const optionsError = validateClientOptions(options);
            if (optionsError) {
                throw new Error(optionsError);
            }
            if (options.idGenerator) {
                this.idGenerator = options.idGenerator;
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
            const id = this.idGenerator();
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
;
const httpPostRequest = async (url, data, httpHeaders = {}) => {
    const requestData = JSON.stringify(data);
    const options = {
        method: 'POST',
        body: requestData,
        mode: 'cors',
        headers: {
            ...httpHeaders,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const response = await fetch(url, options);
    if (!response.ok)
        throw new Error(`HTTP POST request failed with status code ${response.status}`);
    return await response.json();
};
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
