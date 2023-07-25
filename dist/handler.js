"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = exports.createRequestHandler = void 0;
const utilities_1 = require("./utilities");
const createRequestHandler = (routes) => {
    if (!routes || typeof routes !== 'object') {
        throw new Error('A routes object is required');
    }
    const routeKeys = Object.keys(routes);
    const myRoutes = {};
    for (let i = 0; i < routeKeys.length; i++) {
        const key = routeKeys[i];
        const routeError = (0, utilities_1.validateRoute)(key);
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
        }
        else if (typeof route === 'object') {
            if (!(route === null || route === void 0 ? void 0 : route.handler)) {
                throw new Error('Route has no handlers: ' + key);
            }
            else if (!Array.isArray(route.handler)) {
                if (typeof route.handler !== 'function') {
                    throw new Error('Route handler is not valid: ' + key);
                }
                myRoutes[key] = {
                    ...route,
                    handler: [route.handler]
                };
            }
            else {
                for (let j = 0; j < route.length; j++) {
                    if (typeof route[j] !== 'function') {
                        throw new Error('All route handlers must be functions: ' + key);
                    }
                }
                myRoutes[key] = { ...route };
            }
        }
        else if (typeof route === 'function') {
            myRoutes[key] = {
                handler: [route]
            };
        }
        else {
            throw new Error('Route is missing handler: ' + key);
        }
    }
    const handler = async (requests, context = {}) => {
        return (0, exports.handleRequest)(myRoutes, requests, context);
    };
    return handler;
};
exports.createRequestHandler = createRequestHandler;
const handleRequest = async (routes, requests, context = {}) => {
    if (!routes) {
        throw new Error('Routes are required');
    }
    else if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) {
        return handleError(400, 'Request body should be a JSON array');
    }
    const uniqueIds = [];
    const promises = [];
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
        if (parameters && typeof parameters !== 'object')
            return handleError(400, 'Request item parameters should be a JSON object');
        if (selector && !Array.isArray(selector))
            return handleError(400, 'Request item selector should be a JSON array');
        if (uniqueIds.indexOf(id) > -1)
            return handleError(400, 'Request items should have unique IDs');
        uniqueIds.push(id);
        const thisRoute = routes.hasOwnProperty(route) ? routes[route] : null;
        const routeHandler = (thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.handler) || thisRoute || [routeNotFound];
        const requestObject = {
            id,
            route,
            parameters,
            selector,
        };
        const myContext = {
            requestId: id,
            routeName: route,
            selector: selector,
            requestTime: Date.now(),
            ...context
        };
        promises.push(routeReducer(routeHandler, requestObject, myContext, thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.timeout));
    }
    const results = await Promise.all(promises);
    return handleResult(results);
};
exports.handleRequest = handleRequest;
const handleResult = (result) => {
    return [result, null];
};
const handleError = (status, message) => {
    return [null, { status, message }];
};
const routeNotFound = () => {
    throw { message: 'Not Found', status: 404 };
};
const routeReducer = async (handler, request, context, timeout) => {
    return new Promise(async (resolve, reject) => {
        let timer;
        let timedOut = false;
        const { id, route, parameters, selector } = request;
        try {
            if (timeout && timeout > 0) {
                timer = setTimeout(() => {
                    timedOut = true;
                    console.error(`The route "${route}" timed out after ${timeout} milliseconds`);
                    resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
                }, timeout);
            }
            const safeContext = context ? (0, utilities_1.cloneDeep)(context) : {};
            let result = null;
            let error = null;
            if (Array.isArray(handler)) {
                for (let i = 0; i < handler.length; i++) {
                    if ((timedOut || error) && handler[i].length <= 2)
                        continue;
                    if (!error && handler[i].length > 2)
                        continue;
                    let tempResult;
                    try {
                        if (error) {
                            tempResult = await handler[i](parameters, safeContext, error);
                        }
                        else {
                            tempResult = await handler[i](parameters, safeContext);
                        }
                    }
                    catch (tempErr) {
                        if (!error) {
                            error = tempErr;
                        }
                    }
                    if (!error && tempResult) {
                        if (result) {
                            console.error(`Multiple handlers on the route "${route}" returned results`);
                            return resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
                        }
                        else {
                            result = tempResult;
                        }
                    }
                }
            }
            else {
                console.warn(`Non-array route handlers are deprecated: ${route}`);
                result = await handler(parameters, safeContext);
            }
            if (timedOut) {
                return reject();
            }
            if (error) {
                const responseError = assembleError(error);
                return resolve([id, route, null, responseError]);
            }
            if (result && (typeof result !== 'object' || Array.isArray(result))) {
                console.error(`The route "${route}" did not return a result object`);
                return resolve([id, route, null, { message: 'Internal Server Error', status: 500 }]);
            }
            if (result && selector) {
                result = (0, utilities_1.filterObject)(result, selector);
            }
            if (timer) {
                clearTimeout(timer);
            }
            resolve([id, route, result, null]);
        }
        catch (error) {
            if (timer) {
                clearTimeout(timer);
            }
            const responseError = assembleError(error);
            resolve([id, route, null, responseError]);
        }
    });
};
const assembleError = (error) => {
    const responseError = {
        message: error.message || 'Internal Server Error',
        status: error.status || 500
    };
    if (error.code) {
        responseError.code = error.code;
    }
    if (error.data) {
        responseError.data = error.data;
    }
    if (process.env.NODE_ENV !== 'production' && error.stack) {
        responseError.stack = error.stack;
    }
    return responseError;
};
