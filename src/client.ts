import { v1 as uuid } from 'uuid';
import EventEmitter from './events';

export interface ClientOptions {
    httpHeaders?: any
    maxBatchSize?: number
    bufferDelay?: number
}

export class HttpClient {

    private url = '';
    private httpHeaders = {};
    private maxBatchSize = 25;
    private bufferDelay = 10;
    private queue: any[] = [];
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private emitter = new EventEmitter();

    constructor(url: string, options?: ClientOptions) {
        this.url = url;
        if (options) {
            const optionsError = validateClientOptions(options);
            if (optionsError) {
                throw new Error(optionsError);
            }
        }
    }

    private process() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
        if (!this.queue.length) {
            return
        }
        const copyQueue = this.queue.map((q) => [...q])
        this.queue = []
        const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize)
        for (let i = 0; i < batchCount; i++) {
            const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize)
            httpPostRequest(this.url, myQueue, this.httpHeaders)
            .then(async (data: any) => {
                data.forEach((r: any) => {
                    this.emitter.emit(r[0], r[2], r[3]);
                });
            })
            .catch((error: any) => {
                myQueue.forEach((q) => {
                    this.emitter.emit(q[0], null, error);
                });
            });
        }
    }

    public request(route: string, body: object | null, headers: object | null) {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            } else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            } else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = uuid();
            this.emitter.once(id, (result: any, error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
            this.queue.push([id, route, body || null, headers || null]);
            if (!this.timeout) {
                this.timeout = setTimeout(() => { this.process() }, this.bufferDelay);
            }
        });
    }
};

const httpPostRequest = async (url: string, data: any, httpHeaders: any = {}): Promise<any> => {
    const requestData = JSON.stringify(data);
    
    const options: RequestInit = {
        method: 'POST',
        body: requestData,
        mode: 'cors',
        headers: {
            ...httpHeaders,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    
    const response: Response = await fetch(url, options);

    if (!response.ok) throw new Error(`HTTP POST request failed with status code ${response.status}`);
    
    return await response.json();
};

const validateClientOptions = (options: ClientOptions) => {
    if (!options) {
        return false;
    } else if (typeof options !== 'object') {
        return 'Options should be an object';
    } else {
        if (options.httpHeaders) {
            if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
                return '"httpHeaders" option should be an object';
            }
        }
        if (options.maxBatchSize) {
            if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
                return '"maxBatchSize" option should be an integer';
            } else if (options.maxBatchSize < 1) {
                return '"maxBatchSize" option should be greater than or equal to one';
            }
        }
        if (options.bufferDelay) {
            if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
                return '"bufferDelay" option should be an integer';
            } else if (options.bufferDelay < 0) {
                return '"bufferDelay" option should be greater than or equal to zero';
            }
        }
    }
    return false;
};