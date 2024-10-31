(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./utilities", "./handler"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Router = void 0;
    const utilities_1 = require("./utilities");
    const handler_1 = require("./handler");
    class Router {
        constructor(options) {
            this.introspection = false;
            this.middleware = [];
            this.afterware = [];
            this.timeout = 0;
            this.routes = {};
            if (options === null || options === void 0 ? void 0 : options.introspection) {
                if (typeof options.introspection !== 'boolean') {
                    throw new Error('Introspection should be a boolean');
                }
                this.introspection = true;
            }
            if (options === null || options === void 0 ? void 0 : options.timeout) {
                if (typeof options.timeout !== 'number' || options.timeout <= 0 || Math.round(options.timeout) !== options.timeout) {
                    throw new Error('Timeout should be a positive integer');
                }
                this.timeout = options.timeout;
            }
        }
        use(...handlers) {
            for (let i = 0; i < handlers.length; i++) {
                if (typeof handlers[i] !== 'function') {
                    throw new Error('All arguments should be functions');
                }
                const argCount = handlers[i].length;
                if (argCount <= 2) {
                    this.middleware.push(handlers[i]);
                }
                else if (argCount === 3) {
                    this.afterware.push(handlers[i]);
                }
                else {
                    throw new Error('Middleware should have at most three arguments');
                }
            }
        }
        route(route, ...args) {
            const lastArg = args[args.length - 1];
            const options = typeof lastArg === 'function' ? null : lastArg;
            const handlers = args.slice(0, args.length - (options ? 1 : 0));
            const routeError = (0, utilities_1.validateRoute)(route);
            if (routeError) {
                throw new Error(routeError);
            }
            else if (this.routes[route]) {
                throw new Error('Route already exists');
            }
            else if (!handlers.length) {
                throw new Error('At least one handler is required');
            }
            else if (!!options && typeof options !== 'object') {
                throw new Error('Last argument must be an configuration object or a handler function');
            }
            else {
                for (let i = 0; i < handlers.length; i++) {
                    if (typeof handlers[i] !== 'function') {
                        throw new Error('Handlers must be functions: ' + i);
                    }
                    else if (handlers[i].length > 2) {
                        throw new Error('Handlers should have at most two arguments');
                    }
                }
            }
            this.routes[route] = {
                handler: [...this.middleware, ...handlers, ...this.afterware],
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
        describe(route, config) {
            if (!this.routes[route]) {
                throw new Error('Route does not exist');
            }
            else if (typeof config !== 'object') {
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
        merge(router) {
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
                }
                else {
                    this.routes[route] = Object.assign(Object.assign({}, router.routes[route]), { handler: [...this.middleware, ...router.routes[route].handler, ...this.afterware], timeout: router.routes[route].timeout || this.timeout });
                }
            }
        }
        namespace(prefix, router) {
            if (!router || !(router instanceof Router)) {
                throw new Error('Router is required');
            }
            const prefixError = (0, utilities_1.validateRoute)(prefix);
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
                }
                else {
                    this.routes[nsRoute] = Object.assign(Object.assign({}, router.routes[route]), { handler: [...this.middleware, ...router.routes[route].handler, ...this.afterware], timeout: router.routes[route].timeout || this.timeout });
                }
            }
        }
        handle(requests, context = {}) {
            return (0, handler_1.handleRequest)(this.routes, requests, context);
        }
    }
    exports.Router = Router;
});
