'use strict';

const routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;
const systemRouteRegex = /^_[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;
const idGenerator = (length = 8) => {
    const max = Math.pow(16, length) - 1;
    const randomNumber = Math.floor(Math.random() * (max + 1));
    const id = randomNumber.toString(16).padStart(length, '0');
    return id;
};
const validateRoute = (route, system = false) => {
    if (!route) {
        return 'Route is required';
    }
    else if (system) {
        if (!systemRouteRegex.test(route)) {
            const routeLength = route.length;
            if (routeLength < 3) {
                return 'System route should be at least three characters long';
            }
            else if (route.charAt(0) !== '_') {
                return 'System route should start with an underscore';
            }
            else if (!/[a-zA-Z0-9]/.test(route.charAt(-1))) {
                return 'System route should end with a letter or a number';
            }
            else {
                return 'System route should contain only letters, numbers, dashes, underscores, and forward slashes';
            }
        }
    }
    else if (!routeRegex.test(route)) {
        const routeLength = route.length;
        if (routeLength < 2) {
            return 'Route should be at least two characters long';
        }
        else if (!/[a-zA-Z]/.test(route.charAt(0))) {
            return 'Route should start with a letter';
        }
        else if (!/[a-zA-Z0-9]/.test(route.charAt(-1))) {
            return 'Route should end with a letter or a number';
        }
        else {
            return 'Route should contain only letters, numbers, dashes, underscores, and forward slashes';
        }
    }
    else if (/\/[^a-zA-Z]/.test(route)) {
        return 'Sub-routes should start with a letter';
    }
    else if (/[^a-zA-Z0-9]\//.test(route)) {
        return 'Sub-routes should end with a letter or a number';
    }
    else if (/\/[a-zA-Z0-9_\-]{0,1}\//.test(route)) {
        return 'Sub-routes should be at least two characters long';
    }
    else if (/\/[a-zA-Z0-9_\-]$/.test(route)) {
        return 'Sub-routes should be at least two characters long';
    }
    else if (/^[a-zA-Z0-9_\-]\//.test(route)) {
        return 'Sub-routes should be at least two characters long';
    }
    return false;
};
const filterObject = (obj, arr) => {
    if (Array.isArray(arr)) {
        const filteredObj = {};
        for (let i = 0; i < arr.length; i++) {
            const key = arr[i];
            if (typeof key === 'string') {
                if (obj.hasOwnProperty(key)) {
                    filteredObj[key] = obj[key];
                }
            }
            else if (Array.isArray(key)) {
                const nestedObj = obj[key[0]];
                const nestedArr = key[1];
                if (Array.isArray(nestedObj)) {
                    const filteredArr = [];
                    for (let j = 0; j < nestedObj.length; j++) {
                        const filteredNestedObj = filterObject(nestedObj[j], nestedArr);
                        if (Object.keys(filteredNestedObj).length > 0) {
                            filteredArr.push(filteredNestedObj);
                        }
                    }
                    if (filteredArr.length > 0) {
                        filteredObj[key[0]] = filteredArr;
                    }
                }
                else if (typeof nestedObj === 'object' && nestedObj !== null) {
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

const handleRequest = async (routes, requests, context = {}, options = {}) => {
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
        if (typeof body !== 'object') {
            return handleError(400, 'Request item body should be a JSON object');
        }
        if (typeof headers !== 'object') {
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

class Router {
    introspection = false;
    middleware = [];
    timeout = 0;
    routes = {};
    constructor(options) {
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
    use(...handlers) {
        for (let i = 0; i < handlers.length; i++) {
            if (typeof handlers[i] !== 'function') {
                throw new Error('All arguments should be functions');
            }
            this.middleware.push(handlers[i]);
        }
    }
    route(route, ...args) {
        const lastArg = args[args.length - 1];
        const options = typeof lastArg === 'function' ? null : lastArg;
        const handlers = args.slice(0, args.length - (options ? 1 : 0));
        const routeError = validateRoute(route);
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
            }
        }
        this.routes[route] = {
            handler: [...this.middleware, ...handlers],
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
                this.routes[route] = {
                    ...router.routes[route],
                    handler: [...this.middleware, ...router.routes[route].handler],
                    timeout: router.routes[route].timeout || this.timeout
                };
            }
        }
    }
    namespace(prefix, router) {
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
            }
            else {
                this.routes[nsRoute] = {
                    ...router.routes[route],
                    handler: [...this.middleware, ...router.routes[route].handler],
                    timeout: router.routes[route].timeout || this.timeout
                };
            }
        }
    }
    handle(requests, context = {}, options) {
        return handleRequest(this.routes, requests, context, options);
    }
}

class EventEmitter {
    runByEvent = {};
    add(event, cb, once = false) {
        if (!this.runByEvent[event])
            this.runByEvent[event] = [];
        const node = {
            id: idGenerator(),
            event,
            cb,
            once
        };
        this.runByEvent[event].push(node);
    }
    remove(node) {
        this.runByEvent[node.event] = this.runByEvent[node.event].filter((n) => n.id !== node.id);
    }
    on(event, cb, once = false) {
        if (typeof cb != 'function')
            throw TypeError("Callback parameter has to be a function.");
        let node = this.add(event, cb, once);
        return () => this.remove(node);
    }
    once(event, cb) {
        return this.on(event, cb, true);
    }
    emit(event, ...data) {
        let nodes = this.runByEvent[event];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.cb(...data);
            if (node.once) {
                this.remove(node);
            }
        }
    }
}

class HttpClient {
    url = '';
    httpHeaders = {};
    maxBatchSize = 25;
    bufferDelay = 10;
    queue = [];
    timeout = null;
    emitter = new EventEmitter();
    idGenerator = idGenerator;
    setOptions(options) {
        if (!options) {
            return false;
        }
        else if (typeof options !== 'object') {
            throw new Error('Options should be an object');
        }
        else {
            if (options.httpHeaders) {
                if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
                    throw new Error('"httpHeaders" option should be an object');
                }
                this.httpHeaders = options.httpHeaders;
            }
            if (options.maxBatchSize) {
                if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
                    throw new Error('"maxBatchSize" option should be an integer');
                }
                else if (options.maxBatchSize < 1) {
                    throw new Error('"maxBatchSize" option should be greater than or equal to one');
                }
                this.maxBatchSize = options.maxBatchSize;
            }
            if (options.bufferDelay) {
                if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
                    throw new Error('"bufferDelay" option should be an integer');
                }
                else if (options.bufferDelay < 0) {
                    throw new Error('"bufferDelay" option should be greater than or equal to zero');
                }
                this.bufferDelay = options.bufferDelay;
            }
        }
        return false;
    }
    setUrl(url) {
        if (url && typeof url === 'string') {
            this.url = url;
        }
    }
    constructor(url, options) {
        this.url = url;
        this.setOptions(options);
    }
    process() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (!this.queue.length) {
            return;
        }
        const copyQueue = this.queue.map((q) => [...q]);
        this.queue = [];
        const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize);
        for (let i = 0; i < batchCount; i++) {
            const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize);
            httpPostRequest(this.url, myQueue, this.httpHeaders)
                .then(async (data) => {
                data.forEach((r) => {
                    this.emitter.emit(r[0], r[2], r[3]);
                });
            })
                .catch((error) => {
                myQueue.forEach((q) => {
                    this.emitter.emit(q[0], null, error);
                });
            });
        }
    }
    set(option, value) {
        if (typeof option !== 'string')
            throw new Error('Option name must be a string');
        this.setOptions({ [option]: value });
    }
    request(route, body, headers) {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            }
            else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            }
            else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = this.idGenerator();
            this.emitter.once(id, (result, error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            this.queue.push([id, route, body || null, headers || null]);
            if (!this.timeout) {
                this.timeout = setTimeout(() => { this.process(); }, this.bufferDelay);
            }
        });
    }
}
const httpPostRequest = async (url, data, httpHeaders = {}) => {
    const requestData = JSON.stringify(data);
    const options = {
        method: 'POST',
        body: requestData,
        mode: 'cors',
        headers: {
            ...httpHeaders,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const response = await fetch(url, options);
    if (!response.ok)
        throw new Error(`HTTP POST request failed with status code ${response.status}`);
    return await response.json();
};

const defaultExport = {
    Router,
    HttpClient,
    EventEmitter
};
module.exports = defaultExport;

exports.EventEmitter = EventEmitter;
exports.HttpClient = HttpClient;
exports.Router = Router;
