import http from 'http';
import events from 'events';
import { v4 as uuidv4 } from 'uuid';

export const createHttpClient = (url: string, options?: any) => {
    if (options) {
        console.warn('The "options" argument is not yet used, but may be used in the future.');
    }

    const maxBatchSize = 100;
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
        }, 1);
        }
        
        httpPostRequest(url, newQueue)
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

    const request = (route: string, params: object | null, selector: any[] | null) => {
        return new Promise((resolve, reject) => {
        if (!route) {
            return reject(new Error('Route is required'));
        } else if (params && typeof params !== 'object') {
            return reject(new Error('Params should be an object'));
        } else if (selector && !Array.isArray(selector)) {
            return reject(new Error('Selector should be an array'));
        }
        const id = uuidv4();
        emitter.once(id, (result: any, error: any) => {
            if (error) {
            reject(error);
            } else {
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

function httpPostRequest(url: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify(data);
        
        const options: http.RequestOptions = {
            method: 'POST',
            headers: {
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
}