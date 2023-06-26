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

import * as http from 'http';
import events from 'events';
import { v4 as uuidv4 } from 'uuid';

export const createHttpServer = (requestHandler: (data: any, context: any) => Promise<[any?, Error?]>, options?: any): http.Server => {
  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future.');
  }

  const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === '/') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          let jsonData;
          try {
            jsonData = JSON.parse(body);
          } catch (error: any) {
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
            } else if (result) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } else {
              res.statusCode = 204;
              res.end();
            }
          } catch (error: any) {
            console.error(error);
            res.statusCode = 500;
            res.end(error.message);
          }
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  });

  return server;
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

export const createRequestHandler = (routes: { [key: string]: any }, options?: any) => {
  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future');
  }

  const routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9_\-]$/;

  const handler = async (requests: any[], context: { [key: string]: any } = {}) => {
    if (!requests || typeof requests !== 'object' || !Array.isArray(requests))
      return handleError(400, 'Request body should be a JSON array');

    const uniqueIds: string[] = [];
    const promises: Promise<any>[] = [];

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
        } else if (route.charAt(routeLength - 1) === '/') {
          return handleError(400, 'Request item route should not end in a forward slash');
        } else if (!/[a-zA-Z]/.test(route.charAt(0))) {
          return handleError(400, 'Request item route should start with a letter');
        } else {
          return handleError(
            400,
            'Request item route should contain only letters, numbers, dashes, underscores, and forward slashes'
          );
        }
      }
      if (parameters && typeof parameters !== 'object')
        return handleError(400, 'Request item parameters should be a JSON object');
      if (selector && !Array.isArray(selector))
        return handleError(400, 'Request item selector should be a JSON array');

      if (uniqueIds.indexOf(id) > -1) return handleError(400, 'Request items should have unique IDs');
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

type RequestResult = [any, any];

const handleResult = (result: any): RequestResult => {
  return [result, null];
};

const handleError = (code: number, message: string): RequestResult => {
  return [null, { code, message }];
};

const routeNotFound = (): never => {
  throw new Error('Route not found');
};

interface RouteReducerParams {
  id: string;
  route: string;
  parameters: any;
  selector: any;
}

interface RequestContext {
  [key: string]: any;
}

const routeReducer = async (
  handler: ((parameters: any, context: RequestContext) => Promise<any>) | ((parameters: any, context: RequestContext) => any)[],
  { id, route, parameters, selector }: RouteReducerParams,
  context?: RequestContext
): Promise<[string, string, any | null, { message: string } | null]> => {
  try {
    const safeContext = context ? cloneDeep(context) : {};
    let result: any;
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        const tempResult = await handler[i](parameters, safeContext);
        if (i === handler.length - 1) {
          result = tempResult;
        } else {
          if (tempResult) {
            throw new Error('Middleware should not return anything but may mutate context');
          }
        }
      }
    } else {
      result = await handler(parameters, safeContext);
    }
    if (result && (typeof result !== 'object' || Array.isArray(result))) {
      throw new Error('The result, if any, should be a JSON object');
    }
    if (result && selector) {
      result = filterObject(result, selector);
    }
    return [id, route, result, null];
  } catch (error: any) {
    console.error(error);
    return [id, route, null, { message: error.message }];
  }
};

const filterObject = (obj: any, arr: any[]): any => {
  if (Array.isArray(arr)) {
    const filteredObj: any = {};
    for (let i = 0; i < arr.length; i++) {
      const key = arr[i];
      if (typeof key === 'string') {
        if (obj.hasOwnProperty(key)) {
          filteredObj[key] = obj[key];
        }
      } else if (Array.isArray(key)) {
        const nestedObj = obj[key[0]];
        const nestedArr = key[1];
        if (Array.isArray(nestedObj)) {
          const filteredArr: any[] = [];
          for (let j = 0; j < nestedObj.length; j++) {
            const filteredNestedObj = filterObject(nestedObj[j], nestedArr);
            if (Object.keys(filteredNestedObj).length > 0) {
              filteredArr.push(filteredNestedObj);
            }
          }
          if (filteredArr.length > 0) {
            filteredObj[key[0]] = filteredArr;
          }
        } else if (typeof nestedObj === 'object' && nestedObj !== null) {
          const filteredNestedObj = filterObject(nestedObj, nestedArr);
          if (Object.keys(filteredNestedObj).length > 0) {
            filteredObj[key[0]] = filteredNestedObj;
          }
        }
      }
    }
    return filteredObj;
  }
  return obj;
};

function cloneDeep(value: any): any {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  
  let clonedValue: any;
  
  if (Array.isArray(value)) {
    clonedValue = [];
    for (let i = 0; i < value.length; i++) {
      clonedValue[i] = cloneDeep(value[i]);
    }
  } else {
    clonedValue = {};
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        clonedValue[key] = cloneDeep(value[key]);
      }
    }
  }
  
  return clonedValue;
}
