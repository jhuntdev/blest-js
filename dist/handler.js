var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "uuid"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleRequest = void 0;
    const uuid_1 = require("uuid");
    const handleRequest = (routes_1, requests_1, ...args_1) => __awaiter(void 0, [routes_1, requests_1, ...args_1], void 0, function* (routes, requests, context = {}, options = {}) {
        if (!routes) {
            throw new Error('Routes are required');
        }
        else if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) {
            return handleError(400, 'Request body should be a JSON array');
        }
        const batchId = (0, uuid_1.v1)();
        const uniqueIds = [];
        const promises = [];
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
            if (uniqueIds.indexOf(id) > -1)
                return handleError(400, 'Request items should have unique IDs');
            uniqueIds.push(id);
            const thisRoute = routes.hasOwnProperty(route) ? routes[route] : null;
            const routeHandler = (thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.handler) || thisRoute || [routeNotFound];
            const requestObject = {
                id,
                route,
                body,
                headers
            };
            const requestContext = Object.assign(Object.assign({}, context), { batchId, requestId: id, route,
                headers });
            promises.push(routeReducer(routeHandler, requestObject, requestContext, thisRoute === null || thisRoute === void 0 ? void 0 : thisRoute.timeout, options === null || options === void 0 ? void 0 : options.debug));
        }
        const results = yield Promise.all(promises);
        return handleResult(results);
    });
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
    const routeReducer = (handler, request, context, timeout, debug) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
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
                const safeBody = body || {};
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
                                tempResult = yield handler[i](safeBody, safeContext, error);
                            }
                            else {
                                tempResult = yield handler[i](safeBody, safeContext);
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
                    result = yield handler(safeBody, safeContext);
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
                resolve([id, route, result, null]);
            }
            catch (error) {
                if (timer) {
                    clearTimeout(timer);
                }
                const responseError = assembleError(error);
                resolve([id, route, null, responseError]);
            }
        }));
    });
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
});
