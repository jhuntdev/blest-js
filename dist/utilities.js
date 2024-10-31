(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.filterObject = exports.validateRoute = exports.systemRouteRegex = exports.routeRegex = void 0;
    exports.routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;
    exports.systemRouteRegex = /^_[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;
    const validateRoute = (route, system = false) => {
        if (!route) {
            return 'Route is required';
        }
        else if (system) {
            if (!exports.systemRouteRegex.test(route)) {
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
        else if (!exports.routeRegex.test(route)) {
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
    exports.validateRoute = validateRoute;
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
                            const filteredNestedObj = (0, exports.filterObject)(nestedObj[j], nestedArr);
                            if (Object.keys(filteredNestedObj).length > 0) {
                                filteredArr.push(filteredNestedObj);
                            }
                        }
                        if (filteredArr.length > 0) {
                            filteredObj[key[0]] = filteredArr;
                        }
                    }
                    else if (typeof nestedObj === 'object' && nestedObj !== null) {
                        const filteredNestedObj = (0, exports.filterObject)(nestedObj, nestedArr);
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
    exports.filterObject = filterObject;
});
