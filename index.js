/*
  -------------------------------------------------------------------------------------------------
  BLEST (Batch-able, Lightweight, Encrypted State Transfer) - A modern alternative to REST
  (c) 2023 JHunt <blest@jhunt.dev>
  License: MIT
  -------------------------------------------------------------------------------------------------
  Sample Request [id, endpoint, parameters (optional), selector (optional)]
  [
    [
      "abc123",
      "math",
      {
        "operation": "divide",
        "dividend": 22,
        "divisor": 7
      },
      ["status",["result",["quotient"]]]
    ]
  ]
  -------------------------------------------------------------------------------------------------
  Sample Response [id, endpoint, result, error (optional)]
  [
    [
      "abc123",
      "math",
      {
        "status": "Successfully divided 22 by 7",
        "result": {
          "quotient": 3.1415926535
        }
      },
      {
        "message": "If there was an error you would see it here"
      }
    ]
  ]
  -------------------------------------------------------------------------------------------------
*/

const createRequestHandler = (routes, options) => {

  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future.')
  }

  const handler = async (requests, context) => {

    if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) return handleError(400, 'Request body should be a JSON array')

    
    if (!Array.isArray(requests)) return handleError(400, 'Request body should be a JSON array')

    const dedupe = []
    const promises = []

    for (let i = 0; i < requests.length; i++) {

      const request = requests[i]
      
      if (!Array.isArray(request) || request.length < 2 || typeof request[0] !== 'string' || typeof request[1] !== 'string') {
        return handleError(400, 'Request items should be an array with a unique ID and an endpoint')
      }
      if (request[2] && typeof request[2] !== 'object') return handleError(400, 'Request item parameters should be a JSON object')
      if (request[3] && !Array.isArray(request[3])) return handleError(400, 'Request item selector should be a JSON array')

      if (dedupe.indexOf(request[0]) > -1) return handleError(400, 'Request items should have unique IDs')
      dedupe.push(request[0])

      const routeHandler = routes[request[1]] || routeNotFound

      promises.push(routeReducer(routeHandler, request, context))

    }

    const results = await Promise.all(promises)

    return handleResult(results)

  }

  return handler

}

module.exports = {
  createRequestHandler
}

const handleResult = (result) => {
  return [result]
}

const handleError = (code, message, headers) => {
  return [null, {
    code,
    message,
    headers
  }]
}

const routeNotFound = () => {
  throw new Error('Route not found')
}

const routeReducer = async (handler, [id, endpoint, params, selector], context) => {
  try {
    let result = await handler(params, context)
    if (typeof result !== 'object' || Array.isArray(result)) {
      result = null
      error = new Error('Result should be a JSON object')
    }
    if (selector) {
      result = filterObject(result, selector)
    }
    return [id, endpoint, result]
  } catch (error) {
    return [id, endpoint, null, { message: error.message }]
  }
}

const deepCopy = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  let copy
  if (Array.isArray(obj)) {
    copy = []
    for (let i = 0; i < obj.length; i++) {
      copy[i] = deepCopy(obj[i])
    }
  } else {
    copy = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key])
      }
    }
  }
  return copy
}

function filterObject(obj, arr) {
  if (Array.isArray(arr)) {
    const filteredObj = {}
    for (let i = 0; i < arr.length; i++) {
      const key = arr[i]
      if (typeof key === 'string') {
        if (obj.hasOwnProperty(key)) {
          filteredObj[key] = obj[key]
        }
      } else if (Array.isArray(key)) {
        const nestedObj = obj[key[0]]
        const nestedArr = key[1]
        if (Array.isArray(nestedObj)) {
          const filteredArr = []
          for (let j = 0; j < nestedObj.length; j++) {
            const filteredNestedObj = filterObject(nestedObj[j], nestedArr)
            if (Object.keys(filteredNestedObj).length > 0) {
              filteredArr.push(filteredNestedObj)
            }
          }
          if (filteredArr.length > 0) {
            filteredObj[key[0]] = filteredArr
          }
        } else if (typeof nestedObj === 'object' && nestedObj !== null) {
          const filteredNestedObj = filterObject(nestedObj, nestedArr)
          if (Object.keys(filteredNestedObj).length > 0) {
            filteredObj[key[0]] = filteredNestedObj
          }
        }
      }
    }
    return filteredObj
  }
  return {}
}