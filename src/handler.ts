import { v1 as uuid } from 'uuid';

export interface RequestHandlerOptions {
  debug?: boolean
}

export const handleRequest = async (routes: { [key: string]: any }, requests: any[], context: { [key: string]: any } = {}, options: RequestHandlerOptions = {}): Promise<RequestResult> => {

  if (!routes) {
    throw new Error('Routes are required');
  } else if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) {
    return handleError(400, 'Request body should be a JSON array');
  }

  const batchId = uuid();
  const uniqueIds: string[] = [];
  const promises: Promise<any>[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];

    if (!Array.isArray(request)) {
        return handleError(400, 'Request item should be an array');
    }

    const id = request[0];
    const route = request[1];
    const body = request[2] || null;
    const headers = request[3] || null;

    if (!id || typeof id !== 'string') {
        return handleError(400, 'Request item should have an ID');
    }
    if (!route || typeof route !== 'string') {
        return handleError(400, 'Request item should have a route');
    }
    if (body && typeof body !== 'object') {
        return handleError(400, 'Request item body should be a JSON object');
    }
    if (headers && typeof headers !== 'object') {
        return handleError(400, 'Request item headers should be a JSON object');
    }

    if (uniqueIds.indexOf(id) > -1) return handleError(400, 'Request items should have unique IDs');
    uniqueIds.push(id);

    const thisRoute = routes.hasOwnProperty(route) ? routes[route] : null;
    const routeHandler = thisRoute?.handler || thisRoute || [routeNotFound];

    const requestObject = {
        id,
        route,
        body,
        headers
    };

    const requestContext = {
      ...context,
      batchId,
      requestId: id,
      route,
      headers
    };

    promises.push(routeReducer(routeHandler, requestObject, requestContext, thisRoute?.timeout, options?.debug)); 
    
  }

  const results = await Promise.all(promises);

  return handleResult(results);
  
}

type RequestResult = [any, any];

const handleResult = (result: any): RequestResult => {
  return [result, null];
};

const handleError = (status: number, message: string): RequestResult => {
  return [null, { status, message }];
};

const routeNotFound = (): never => {
  throw { message: 'Not Found', status: 404 };
};

interface RequestObject {
  id: string;
  route: string;
  body: any;
  headers: any;
}

interface RequestContext {
  [key: string]: any;
}

const routeReducer = async (
  handler: ((body: any, context: RequestContext, error?: any) => any) | ((body: any, context: RequestContext, error?: any, debug?: boolean) => any)[],
  request: RequestObject,
  context?: RequestContext,
  timeout?: number,
  debug?: boolean
): Promise<[string, string, any | null, { message: string, status?: number, code?: string, stack?: string } | null]> => {
  return new Promise(async (resolve, reject) => {
    let timer;
    let timedOut = false;
    const { id, route, body } = request;
    try {
      if (timeout && timeout > 0) {
        timer = setTimeout(() => {
          timedOut = true;
          console.error(`The route "${route}" timed out after ${timeout} milliseconds`);
          resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
        }, timeout);
      }
      const safeContext = context ? structuredClone(context) : {};
      const safeBody = body || {}
      let result: any = null;
      let error: any = null;
      if (Array.isArray(handler)) {
        for (let i = 0; i < handler.length; i++) {
          if ((timedOut || error) && handler[i].length <= 2) continue;
          if (!error && handler[i].length > 2) continue;
          let tempResult;
          try {
            if (error) {
              tempResult = await handler[i](safeBody, safeContext, error);
            } else {
              tempResult = await handler[i](safeBody, safeContext);
            }
          } catch (tempErr) {
            if (!error) {
              error = tempErr;
            }
          }
          if (!error && tempResult) {
            if (result) {
              console.error(`Multiple handlers on the route "${route}" returned results`);
              return resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
            } else {
              result = tempResult;
            }
          }
        }
      } else {
        console.warn(`Non-array route handlers are deprecated: ${route}`);
        result = await handler(safeBody, safeContext);
      }
      if (timer) {
        clearTimeout(timer);
      }
      if (timedOut) {
        return reject();
      }
      if (error) {
        const responseError = assembleError(error, debug);
        return resolve([id, route, null, responseError]);
      }
      if (result && (typeof result !== 'object' || Array.isArray(result))) {
        console.error(`The route "${route}" did not return a result object`);
        return resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
      }
      // if (result && selector) {
      //   result = filterObject(result, selector);
      // }
      resolve([id, route, result, null]);
    } catch (error: any) {
      if (timer) {
        clearTimeout(timer);
      }
      const responseError:any = assembleError(error);
      resolve([id, route, null, responseError]);
    }
  })
};

const assembleError = (error:any, debug?:boolean) => {
  const responseError:any = {
    message: error.message || 'Internal Server Error',
    status: error.status || 500
  };
  if (error.code) {
    responseError.code = error.code;
  }
  if (error.data) {
    responseError.data = error.data;
  }
  if (debug && error.stack) {
    responseError.stack = error.stack;
  }
  return responseError;
};