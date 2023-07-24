import { validateRoute } from './utilities';
import { handleRequest } from './handler';
import { createHttpServer } from './server';

export class Router {

  private introspection: boolean = false;
  private middleware: any[] = [];
  private timeout: number = 0;

  public routes: any = {};

  constructor(options: any) {
    if (options?.introspection) {
      if (typeof options.introspection !== 'boolean') {
        throw new Error('Introspection should be a boolean');
      }
      this.introspection = true;
    }
    if (options?.timeout) {
      if (typeof options.timeout !== 'number' || options.timeout <= 0 || Math.round(options.timeout) !== options.timeout) {
        throw new Error('Timeout should be a positive integer');
      }
      this.timeout = options.timeout;
    }
  }

  public use(...handlers: any[]) {

    for (let i = 0; i < handlers.length; i++) {
      if (typeof handlers[i] !== 'function') {
        throw new Error('All arguments should be functions');
      }
      this.middleware.push(handlers[i]);
      const routeNames = Object.keys(this.routes)
      for (let j = 0; j < routeNames.length; j++) {
        this.routes[routeNames[j]].handler.push(handlers[i])
      }
    }

  }

  public route(route: string, ...args: any[]) {

    const lastArg = args[args.length - 1];
    const options = typeof lastArg === 'function' ? null : lastArg;
    const handlers = args.slice(0, args.length - (options ? 1 : 0));

    const routeError = validateRoute(route);
    if (routeError) {
      throw new Error(routeError);
    } else if (this.routes[route]) {
      throw new Error('Route already exists');
    } else if (!handlers.length) {
      throw new Error('At least one handler is required');
    } else if (!!options && typeof options !== 'object') {
      throw new Error('Last argument must be an configuration object or a handler function');
    } else {
      for (let i = 0; i < handlers.length; i++) {
        if (typeof handlers[i] !== 'function') {
          throw new Error('All handlers must be functions: ' + i);
        }
      }
    }

    this.routes[route] = {
      handler: [...this.middleware, ...handlers],
      description: null,
      parameters: null,
      result: null,
      visible: this.introspection,
      validate: false,
      timeout: this.timeout
    };

    if (typeof lastArg !== 'function') {
      this.describe(route, lastArg);
    }

  }

  public describe(route: string, config: any) {

    if (!this.routes[route]) {
      throw new Error('Route does not exist');
    } else if (typeof config !== 'object') {
      throw new Error('Configuration should be an object');
    }

    if (config.description) {
      if (typeof config.description !== 'string') {
        throw new Error('Description should be a string');
      }
      this.routes[route].description = config.description;
    }

    if (config.parameters) {
      if (typeof config.parameters !== 'object') {
        throw new Error('Parameters should be a JSON schema');
      }
      this.routes[route].parameters = config.parameters;
    }

    if (config.result) {
      if (typeof config.result !== 'object') {
        throw new Error('Result should be a JSON schema');
      }
      this.routes[route].result = config.result;
    }

    if (config.visible !== undefined) {
      if ([true, false].indexOf(config.visible) > -1) {
        throw new Error('Visible should be true or false');
      }
      this.routes[route].visible = config.visible;
    }

    if (config.validate !== undefined) {
      if ([true, false].indexOf(config.validate) > -1) {
        throw new Error('Visible should be true or false');
      }
      this.routes[route].validate = config.validate;
    }

    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number') {
        throw new Error('Timeout should be a number');
      } else if (config.timeout < 0) {
        throw new Error('Timeout should be greater than or equal to zero');
      }
      this.routes[route].timeout = config.timeout;
    }

  }

  public merge(router: Router) {

    if (!router || !(router instanceof Router)) {
      throw new Error('Router is required');
    }

    const newRoutes = Object.keys(router.routes);
    const existingRoutes = Object.keys(this.routes);
    
    if (!newRoutes.length) {
      throw new Error('No routes to merge');
    }

    for (let i = 0; i < newRoutes.length; i++) {
      const route = newRoutes[i];
      if (existingRoutes.indexOf(route) > -1) {
        throw new Error('Cannot merge duplicate routes: ' + route);
      } else {
        this.routes[route] = {
          ...router.routes[route],
          handler: [...this.middleware, ...router.routes[route].handler],
          timeout: router.routes[route].timeout || this.timeout
        };
      }
    }

  }

  public namespace(prefix: string, router: Router) {

    if (!router || !(router instanceof Router)) {
      throw new Error('Router is required');
    }

    const prefixError = validateRoute(prefix);
    if (prefixError) {
      throw new Error(prefixError);
    }

    const newRoutes = Object.keys(router.routes);
    const existingRoutes = Object.keys(this.routes);
    
    if (!newRoutes.length) {
      throw new Error('No routes to namespace');
    }

    for (let i = 0; i < newRoutes.length; i++) {
      const route = newRoutes[i];
      const nsRoute = `${prefix}/${newRoutes[i]}`;
      if (existingRoutes.indexOf(route) > -1) {
        throw new Error('Cannot merge duplicate routes: ' + nsRoute);
      } else {
        this.routes[nsRoute] = {
          ...router.routes[route],
          handler: [...this.middleware, ...router.routes[route].handler],
          timeout: router.routes[route].timeout || this.timeout
        };
      }
    }

  }

  public handle(requests: any[], context: { [key: string]: any } = {}) {
    return handleRequest(this.routes, requests, context);
  }

  public listen(...args: any[]) {
    const routes = this.routes;
    const server = createHttpServer(handleRequest.bind(null, routes));
    server.listen(...args);
  }

}