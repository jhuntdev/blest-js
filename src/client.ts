import { EventEmitter } from './events';
import { idGenerator } from './utilities';

export interface ClientOptions {
    httpHeaders?: any
    maxBatchSize?: number
    bufferDelay?: number
    idGenerator?: () => string
}

export class HttpClient {

    private url = '';
    private httpHeaders = {};
    private maxBatchSize = 25;
    private bufferDelay = 10;
    private queue: any[] = [];
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private emitter = new EventEmitter();
    private idGenerator: () => string = idGenerator;

    public setOptions(options?: ClientOptions) {
        if (!options) {
          return false;
        } else if (typeof options !== 'object') {
          throw new Error('Options should be an object');
        } else {
          if (options.httpHeaders) {
            if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
              throw new Error('"httpHeaders" option should be an object');
            }
            this.httpHeaders = options.httpHeaders
          }
          if (options.maxBatchSize) {
            if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
              throw new Error('"maxBatchSize" option should be an integer');
            } else if (options.maxBatchSize < 1) {
              throw new Error('"maxBatchSize" option should be greater than or equal to one');
            }
            this.maxBatchSize = options.maxBatchSize
          }
          if (options.bufferDelay) {
            if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
              throw new Error('"bufferDelay" option should be an integer');
            } else if (options.bufferDelay < 0) {
              throw new Error('"bufferDelay" option should be greater than or equal to zero');
            }
            this.bufferDelay = options.bufferDelay
          }
        }
        return false;
    }

    public setUrl(url?:string) {
      if (url && typeof url === 'string') {
        this.url = url
      }
    }

    constructor(url: string, options?: ClientOptions) {
        this.url = url;
        this.setOptions(options);
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

    public set(option: string, value: any) {
      if (typeof option !== 'string') throw new Error('Option name must be a string')
      this.setOptions({ [option]: value })
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
            const id = this.idGenerator();
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
}