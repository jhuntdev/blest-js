"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = exports.createRequestHandler = void 0;
const uuid_1 = require("uuid");
const utilities_1 = require("./utilities");
const createRequestHandler = (routes) => {
    if (!routes || typeof routes !== 'object') {
        throw new Error('A routes object is required');
    }
    const routeKeys = Object.keys(routes);
    for (let i = 0; i < routeKeys.length; i++) {
        const key = routeKeys[i];
        if (!(0, utilities_1.validateRoute)(key)) {
            throw new Error('Route is not valid: ' + key);
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
        }
        else if (typeof route === 'object') {
            if (!(route === null || route === void 0 ? void 0 : route.handler)) {
                throw new Error('Route has no handlers: ' + key);
            }
            else if (!Array.isArray(route.handler)) {
                if (typeof route.handler !== 'function') {
                    throw new Error('Route handler is not valid: ' + key);
                }
            }
            else {
                for (let j = 0; j < route.length; j++) {
                    if (typeof route[j] !== 'function') {
                        throw new Error('All route handlers must be functions: ' + key);
                    }
                }
            }
        }
        else {
            throw new Error('Route is missing handler: ' + key);
        }
    }
    const handler = async (requests, context = {}) => {
        return (0, exports.handleRequest)(routes, requests, context);
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
    const batchId = (0, uuid_1.v4)();
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
        const routeError = (0, utilities_1.validateRoute)(route);
        if (routeError) {
            return handleError(400, routeError);
        }
        if (parameters && typeof parameters !== 'object')
            return handleError(400, 'Request item parameters should be a JSON object');
        if (selector && !Array.isArray(selector))
            return handleError(400, 'Request item selector should be a JSON array');
        if (uniqueIds.indexOf(id) > -1)
            return handleError(400, 'Request items should have unique IDs');
        uniqueIds.push(id);
        const thisRoute = routes[route];
        const routeLogger = thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.logger;
        const routeHandler = (thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.handler) || thisRoute || routeNotFound;
        const requestObject = {
            id,
            route,
            parameters,
            selector,
        };
        const myContext = {
            requestId: id,
            routeName: route,
            ...context
        };
        if (routeLogger) {
            promises.push(applyLogger(routeReducer(routeHandler, requestObject, myContext, thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.timeout), routeLogger, requestObject, requests.length, batchId));
        }
        else {
            promises.push(routeReducer(routeHandler, requestObject, myContext, thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.timeout));
        }
    }
    const results = await Promise.all(promises);
    return handleResult(results);
};
exports.handleRequest = handleRequest;
const handleResult = (result) => {
    return [result, null];
};
const handleError = (code, message) => {
    return [null, { code, message }];
};
const routeNotFound = () => {
    throw new Error('Route not found');
};
const applyLogger = async (responsePromise, logger, requestObject, batchSize, batchId) => {
    const startTime = Date.now();
    const response = await responsePromise;
    const endTime = Date.now();
    if (typeof logger !== 'function') {
        throw new Error('Logger should be a function');
    }
    logger({
        requestId: requestObject.id,
        routeName: requestObject.route,
        parameters: requestObject.parameters,
        selector: requestObject.selector,
        result: response[2],
        error: response[3],
        startTime,
        endTime,
        batchSize,
        batchId
    });
    return response;
};
const routeReducer = async (handler, request, context, timeout) => {
    return new Promise(async (resolve) => {
        let timer;
        const { id, route, parameters, selector } = request;
        try {
            if (timeout && timeout > 0) {
                timer = setTimeout(() => {
                    resolve([id, route, null, { message: 'Request timed out' }]);
                }, timeout);
            }
            const safeContext = context ? (0, utilities_1.cloneDeep)(context) : {};
            let result;
            if (Array.isArray(handler)) {
                for (let i = 0; i < handler.length; i++) {
                    const tempResult = await handler[i](parameters, safeContext);
                    if (tempResult) {
                        if (result) {
                            throw new Error('Middleware should not return anything but may mutate context');
                        }
                        else {
                            result = tempResult;
                        }
                    }
                }
            }
            else {
                result = await handler(parameters, safeContext);
            }
            if (result && (typeof result !== 'object' || Array.isArray(result))) {
                throw new Error('The result, if any, should be a JSON object');
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
            resolve([id, route, null, error]);
        }
    });
};
