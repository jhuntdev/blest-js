import { validateRoute } from './utilities';
import { handleRequest, RequestHandlerOptions } from './handler';

export interface RouterOptions {
  introspection?: boolean
  timeout?: number
}

export class Router {

  private introspection: boolean = false;
  private middleware: any[] = [];
  // private afterware: any[] = [];
  private timeout: number = 0;
  public routes: any = {};

  constructor(options?: RouterOptions) {
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
      // const argCount = handlers[i].length;
      // if (argCount <= 2) {
        this.middleware.push(handlers[i]);
      // } else if (argCount === 3) {
        // this.afterware.push(handlers[i]);
      // } else {
        // throw new Error('Middleware should have at most three arguments');
      // }
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
          throw new Error('Handlers must be functions: ' + i);
        }
        // else if (handlers[i].length > 3) {
        //   throw new Error('Handlers should have at most two arguments');
        // }
      }
    }

    this.routes[route] = {
      handler: [...this.middleware, ...handlers], // , ...this.afterware],
      description: null,
      schema: null,
      visible: this.introspection,
      validate: false,
      timeout: this.timeout
    };

    if (options) {
      this.describe(route, options);
    }

  }

  public describe(route: string, config: any) {

    if (!this.routes[route]) {
      throw new Error('Route does not exist');
    } else if (typeof config !== 'object') {
      throw new Error('Configuration should be an object');
    }

    if (config.description !== undefined) {
      if (config.description && typeof config.description !== 'string') {
        throw new Error('Description should be a string');
      }
      this.routes[route].description = config.description;
    }

    if (config.schema !== undefined) {
      if (config.schema && typeof config.schema !== 'object') {
        throw new Error('Schema should be a JSON schema');
      }
      this.routes[route].schema = config.schema;
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
      if (typeof config.timeout !== 'number' || !Number.isInteger(config.timeout) || config.timeout <= 0) {
        throw new Error('Timeout should be a positive integer');
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
          handler: [...this.middleware, ...router.routes[route].handler], // ...this.afterware],
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
          handler: [...this.middleware, ...router.routes[route].handler], // ...this.afterware],
          timeout: router.routes[route].timeout || this.timeout
        };
      }
    }

  }

  public handle(requests: any[], context: { [key: string]: any } = {}, options?: RequestHandlerOptions) {
    return handleRequest(this.routes, requests, context, options);
  }

}