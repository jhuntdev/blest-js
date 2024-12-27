import { filterObject, idGenerator } from "./utilities";
export const handleRequest = async (routes, requests, context = {}, options = {}) => {
    if (!routes || typeof routes !== 'object' || Array.isArray(routes)) {
        return handleError(500, 'A routes object is required');
    }
    else if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) {
        return handleError(400, 'Request body should be a JSON array');
    }
    else if (context.hasOwnProperty('batchId') ||
        context.hasOwnProperty('requestId') ||
        context.hasOwnProperty('route') ||
        context.hasOwnProperty('body') ||
        context.hasOwnProperty('headers')) {
        return handleError(500, 'Context should not have properties batchId, requestId, route, body, or headers');
    }
    const batchId = options?.idGenerator ? options.idGenerator() : idGenerator();
    const uniqueIds = [];
    const promises = [];
    for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        if (!Array.isArray(request)) {
            return handleError(400, 'Request item should be an array');
        }
        const requestId = request[0];
        const route = request[1];
        const body = request[2] || {};
        const headers = request[3] || {};
        if (!requestId || typeof requestId !== 'string') {
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
        if (uniqueIds.indexOf(requestId) > -1)
            return handleError(400, 'Request items should have unique IDs');
        uniqueIds.push(requestId);
        const thisRoute = routes.hasOwnProperty(route) ? routes[route] : null;
        const routeHandler = thisRoute?.handler || thisRoute || [routeNotFound];
        const requestContext = {
            ...context,
            batchId,
            requestId,
            route,
            body,
            headers
        };
        promises.push(routeReducer(routeHandler, requestContext, thisRoute?.timeout, options?.debug));
    }
    const results = await Promise.all(promises);
    return handleResult(results);
};
const handleResult = (result) => {
    return [result, null];
};
const handleError = (status, message) => {
    return [null, { status, message }];
};
const routeNotFound = () => {
    throw { message: 'Not Found', status: 404 };
};
const routeReducer = async (handlers, context, timeout, debug) => {
    return new Promise(async (resolve, reject) => {
        let timer;
        let timedOut = false;
        const { requestId, route, body } = context;
        try {
            if (timeout && timeout > 0) {
                timer = setTimeout(() => {
                    timedOut = true;
                    resolve([requestId, route, null, { message: 'Internal Server Error', status: 500 }]);
                }, timeout);
            }
            const safeContext = structuredClone(context);
            const safeBody = structuredClone(body);
            let result = null;
            if (!Array.isArray(handlers)) {
                throw new Error(`Handlers array should be an array: ${route}`);
            }
            const handlersLength = handlers.length;
            let index = 0;
            let nextCalled;
            const next = async () => {
                nextCalled = index - 1;
                if (index < handlersLength - 1) {
                    const middleware = handlers[index++];
                    await middleware(safeBody, safeContext, next);
                    if (nextCalled !== index - 1) {
                        await next();
                    }
                }
                else {
                    const controller = handlers[handlersLength - 1];
                    result = await controller(safeBody, safeContext, () => { });
                }
            };
            await next();
            if (timer) {
                clearTimeout(timer);
            }
            if (timedOut) {
                return reject();
            }
            if (!!result && (typeof result !== 'object' || Array.isArray(result))) {
                console.error(`The route "${route}" did not return a result object`);
                return resolve([requestId, route, null, { message: 'Internal Server Error', status: 500 }]);
            }
            if (safeContext.headers?._s && Array.isArray(safeContext.headers?._s)) {
                result = filterObject(result, safeContext.headers._s);
            }
            resolve([requestId, route, result, null]);
        }
        catch (error) {
            if (timer) {
                clearTimeout(timer);
            }
            const responseError = assembleError(error, debug);
            resolve([requestId, route, null, responseError]);
        }
    });
};
const assembleError = (error, debug) => {
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
    if (debug && error.stack) {
        responseError.stack = error.stack;
    }
    return responseError;
};
