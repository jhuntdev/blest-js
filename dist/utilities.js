"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterObject = exports.validateRoute = exports.routeRegex = void 0;
exports.routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;
const validateRoute = (route) => {
    if (!route) {
        return 'Route is required';
    }
    else if (!exports.routeRegex.test(route)) {
        const routeLength = route.length;
        if (routeLength < 2) {
            return 'Route should be at least two characters long';
        }
        else if (route.charAt(routeLength - 1) === '/') {
            return 'Route should not end in a forward slash';
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
