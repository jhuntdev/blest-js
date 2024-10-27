import http from 'http';
import events from 'events';
import { v1 as uuid } from 'uuid';

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
    private timeout: NodeJS.Timeout | null = null;
    private emitter = new events.EventEmitter();

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



function httpPostRequest(url: string, data: any, httpHeaders: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify(data);
        
        const options: http.RequestOptions = {
            method: 'POST',
            headers: {
                ...httpHeaders,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };
        
        const request = http.request(url, options, (response: http.IncomingMessage) => {
            let responseBody = '';
            
            response.on('data', (chunk: string) => {
            responseBody += chunk;
            });
            
            response.on('end', () => {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                const responseData = JSON.parse(responseBody);
                resolve(responseData);
            } else {
                reject(new Error(`HTTP POST request failed with status code ${response.statusCode}`));
            }
            });
        });
        
        request.on('error', (error: Error) => {
            reject(error);
        });
        
        request.write(requestData);
        request.end();
    });
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



export const createHttpClient = (url: string, options?: ClientOptions) => {

    console.warn('createHttpClient is deprecated - use the HttpClient class instead')
    
    if (options) {
        const optionsError = validateClientOptions(options);
        if (optionsError) {
            throw new Error(optionsError);
        }
    }

    const httpHeaders = options?.httpHeaders || null;
    const maxBatchSize = options?.maxBatchSize || 100;
    const bufferDelay = options?.bufferDelay || 10;
    let queue: any[] = [];
    let timeout: NodeJS.Timeout | null = null;
    const emitter = new events.EventEmitter();

    const process = () => {
        const newQueue = queue.splice(0, maxBatchSize);
        clearTimeout(timeout!);
        if (!queue.length) {
            timeout = null;
        } else {
            timeout = setTimeout(() => {
                process();
            }, bufferDelay);
        }
        
        httpPostRequest(url, newQueue, httpHeaders)
        .then(async (data: any) => {
            data.forEach((r: any) => {
                emitter.emit(r[0], r[2], r[3]);
            });
        })
        .catch((error: any) => {
            newQueue.forEach((q) => {
                emitter.emit(q[0], null, error);
            });
        });
    };

    const request = (route: string, body: object | null, headers: object | null) => {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            } else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            } else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = uuid();
            emitter.once(id, (result: any, error: any) => {
                if (error) {
                    reject(error);
                } else {
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