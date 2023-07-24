export const routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9]$/;

export const validateRoute = (route: string) => {
  if (!route) {
    return 'Route is required';
  } else if (!routeRegex.test(route)) {
    const routeLength = route.length;
    if (routeLength < 2) {
      return 'Route should be at least two characters long';
    } else if (route.charAt(routeLength - 1) === '/') {
      return 'Route should not end in a forward slash';
    } else if (!/[a-zA-Z]/.test(route.charAt(0))) {
      return 'Route should start with a letter';
    } else if (!/[a-zA-Z0-9]/.test(route.charAt(-1))) {
      return 'Route should end with a letter or a number';
    } else {
      return 'Route should contain only letters, numbers, dashes, underscores, and forward slashes';
    }
  } else if (/\/[^a-zA-Z]/.test(route)) {
    return 'Sub-routes should start with a letter';
  } else if (/[^a-zA-Z0-9]\//.test(route)) {
    return 'Sub-routes should end with a letter or a number';
  } else if (/\/[a-zA-Z0-9_\-]{0,1}\//.test(route)) {
    return 'Sub-routes should be at least two characters long';
  } else if (/\/[a-zA-Z0-9_\-]$/.test(route)) {
    return 'Sub-routes should be at least two characters long';
  } else if (/^[a-zA-Z0-9_\-]\//.test(route)) {
    return 'Sub-routes should be at least two characters long';
  }
  return false;
}

export const filterObject = (obj: any, arr: any[]): any => {
  if (Array.isArray(arr)) {
    const filteredObj: any = {};
    for (let i = 0; i < arr.length; i++) {
      const key = arr[i];
      if (typeof key === 'string') {
        if (obj.hasOwnProperty(key)) {
          filteredObj[key] = obj[key];
        }
      } else if (Array.isArray(key)) {
        const nestedObj = obj[key[0]];
        const nestedArr = key[1];
        if (Array.isArray(nestedObj)) {
          const filteredArr: any[] = [];
          for (let j = 0; j < nestedObj.length; j++) {
            const filteredNestedObj = filterObject(nestedObj[j], nestedArr);
            if (Object.keys(filteredNestedObj).length > 0) {
              filteredArr.push(filteredNestedObj);
            }
          }
          if (filteredArr.length > 0) {
            filteredObj[key[0]] = filteredArr;
          }
        } else if (typeof nestedObj === 'object' && nestedObj !== null) {
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
}

export const cloneDeep = (value: any): any => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  
  let clonedValue: any;
  
  if (Array.isArray(value)) {
    clonedValue = [];
    for (let i = 0; i < value.length; i++) {
      clonedValue[i] = cloneDeep(value[i]);
    }
  } else {
    clonedValue = {};
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        clonedValue[key] = cloneDeep(value[key]);
      }
    }
  }
  
  return clonedValue;
}
