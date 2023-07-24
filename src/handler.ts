import { validateRoute, cloneDeep, filterObject } from './utilities';

export const createRequestHandler = (routes: { [key: string]: any }) => {

    if (!routes || typeof routes !== 'object') {
      throw new Error('A routes object is required');
    }
  
    const routeKeys = Object.keys(routes);
    const myRoutes:any = {};
  
    for (let i = 0; i < routeKeys.length; i++) {
      const key = routeKeys[i];
      const routeError = validateRoute(key);
      if (routeError) {
        throw new Error(routeError + ': ' + key);
      }
      const route = routes[key];
      if (Array.isArray(route)) {
        if (!route.length) {
          throw new Error('Route has no handlers: ' + key);
        }
        for (let j = 0; j < route.length; j++) {
          if (typeof route[j] !== 'function') {
            throw new Error('All route handlers must be functions: ' + key);
          }
        }
        myRoutes[key] = {
          handler: route
        };
      } else if (typeof route === 'object') {
        if (!route?.handler) {
          throw new Error('Route has no handlers: ' + key);
        } else if (!Array.isArray(route.handler)) {
          if (typeof route.handler !== 'function') {
            throw new Error('Route handler is not valid: ' + key);
          }
        } else {
          for (let j = 0; j < route.length; j++) {
            if (typeof route[j] !== 'function') {
              throw new Error('All route handlers must be functions: ' + key);
            }
          }
        }
        myRoutes[key] = { ...route };
      } else if (typeof route === 'function') {
        myRoutes[key] = {
          handler: [route]
        };
      } else {
        throw new Error('Route is missing handler: ' + key);
      }
    }

    const handler = async (requests: any[], context: { [key: string]: any } = {}) => {
      return handleRequest(myRoutes, requests, context)
    }

    return handler

}

export const handleRequest = async (routes: { [key: string]: any }, requests: any[], context: { [key: string]: any } = {}) => {

  if (!routes) {
    throw new Error('Routes are required');
  } else if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) {
    return handleError(400, 'Request body should be a JSON array');
  }

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
    const routeError = validateRoute(route);
    if (routeError) {
      return handleError(400, routeError);
    }
    if (parameters && typeof parameters !== 'object')
        return handleError(400, 'Request item parameters should be a JSON object');
    if (selector && !Array.isArray(selector))
        return handleError(400, 'Request item selector should be a JSON array');

    if (uniqueIds.indexOf(id) > -1) return handleError(400, 'Request items should have unique IDs');
    uniqueIds.push(id);

    const thisRoute = routes[route];
    const routeHandler = thisRoute?.handler || thisRoute || routeNotFound;

    const requestObject = {
        id,
        route,
        parameters,
        selector,
    };

    const myContext = {
      requestId: id,
      routeName: route,
      selector: requestObject.selector,
      requestTime: Date.now(),
      ...context
    };

    promises.push(routeReducer(routeHandler, requestObject, myContext, thisRoute?.timeout)); 
    
  }

  const results = await Promise.all(promises);

  return handleResult(results);
  
}

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

interface RequestObject {
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
    request: RequestObject,
    context?: RequestContext,
    timeout?: number
): Promise<[string, string, any | null, { message: string } | null]> => {
  return new Promise(async (resolve) => {
    let timer;
    const { id, route, parameters, selector } = request;
    try {
      if (timeout && timeout > 0) {
        timer = setTimeout(() => {
          resolve([id, route, null, { message: 'Request timed out' }]);
        }, timeout);
      }
      const safeContext = context ? cloneDeep(context) : {};
      let result: any;
      if (Array.isArray(handler)) {
        for (let i = 0; i < handler.length; i++) {
          const tempResult = await handler[i](parameters, safeContext);
          if (tempResult) {
            if (result) {
              throw new Error('Middleware should not return anything but may mutate context');
            } else {
              result = tempResult;
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
      if (timer) {
        clearTimeout(timer);
      }
      resolve([id, route, result, null]);
    } catch (error: any) {
      if (timer) {
        clearTimeout(timer);
      }
      const responseError:any = {
        message: error.message
      };
      if (error.code) {
        responseError.code = error.code;
      }
      if (process.env.NODE_ENV !== 'production') {
        responseError.stack = error.stack;
      }
      resolve([id, route, null, responseError]);
    }
  })
};