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

const http = require('http')
const events = require('events')
const { v4: uuidv4 } = require('uuid')

const createHttpServer = (requestHandler, options) => {
  
  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future.')
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          let jsonData
          try {
            jsonData = JSON.parse(body)
          } catch (error) {
            console.error(error)
            res.statusCode = 400
            res.end(error.message)
          }
          try {

            const context = {
              headers: req.headers
            }
            const [result, error] = await requestHandler(jsonData, context)
            if (error) {
              res.statusCode = 500
              res.end(error.message)
            } else if (result) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(result))
            } else {
              res.statusCode = 204
              res.end()
            }

          } catch (error) {
            console.error(error)
            res.statusCode = 500
            res.end(error.message)
          }
        })
      } else {
        res.statusCode = 405
        res.end()
      }
    } else {
      res.statusCode = 404
      res.end()
    }
  })

  return server

}

const createHttpClient = (url, options) => {

  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future.')
  }

  const maxBatchSize = 100
  let queue = []
  let timeout = null
  const emitter = new events.EventEmitter()

  const process = () => {
    const newQueue = queue.splice(0, maxBatchSize)
    clearTimeout(timeout)
    if (!queue.length) {
      timeout = null
    } else {
      timeout = setTimeout(() => {
        process()
      }, 1)
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newQueue)
    })
    .then(async (result) => {
      const data = await result.json()
      data.forEach((r) => {
        emitter.emit(r[0], r[2], r[3])
      })
    })
    .catch((error) => {
      newQueue.forEach((q) => {
        emitter.emit(q[0], null, error)
      })
    })
  }

  const request = (route, params, selector) => {
    return new Promise((resolve, reject) => {
      if (!route) {
        return reject(new Error('Route is required'))
      } else if (params && typeof params !== 'object') {
        return reject(new Error('Params should be an object'))
      } else if (selector && !Array.isArray(selector)) {
        return reject(new Error('Selector should be an array'))
      }
      const id = uuidv4()
      emitter.once(id, (result, error) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
      queue.push([id, route, params || null, selector || null])
      if (!timeout) {
        timeout = setTimeout(() => {
          process()
        }, 1)
      }
    })
  }

  return request

}

const createRequestHandler = (routes, options) => {

  if (options) {
    console.warn('The "options" argument is not yet used, but may be used in the future')
  }

  const routeRegex = /^[a-zA-Z][a-zA-Z0-9_\-\/]*[a-zA-Z0-9_\-]$/

  const handler = async (requests, context = {}) => {

    if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) return handleError(400, 'Request body should be a JSON array')

    const uniqueIds = []
    const promises = []

    for (let i = 0; i < requests.length; i++) {

      const request = requests[i]

      if (!Array.isArray(request)) {
        return handleError(400, 'Request item should be an array')
      }

      const id = request[0]
      const route = request[1]
      const parameters = request[2] || null
      const selector = request[3] || null
      
      if (!id || typeof id !== 'string') {
        return handleError(400, 'Request item should have an ID')
      }
      if (!route || typeof route !== 'string') {
        return handleError(400, 'Request item should have a route')
      }
      if (!routeRegex.test(route)) {
        const routeLength = route.length
        if (routeLength < 2) {
          return handleError(400, 'Request item route should be at least two characters long')
        } else if (route.charAt(routeLength - 1) === '/') {
          return handleError(400, 'Request item route should not end in a forward slash')
        } else if (!/[a-zA-Z]/.test(route.charAt(0))) {
          return handleError(400, 'Request item route should start with a letter')
        } else {
          return handleError(400, 'Request item route should contain only letters, numbers, dashes, underscores, and forward slashes')
        }
      }
      if (parameters && typeof parameters !== 'object') return handleError(400, 'Request item parameters should be a JSON object')
      if (selector && !Array.isArray(selector)) return handleError(400, 'Request item selector should be a JSON array')

      if (uniqueIds.indexOf(id) > -1) return handleError(400, 'Request items should have unique IDs')
      uniqueIds.push(id)

      const routeHandler = routes[route] || routeNotFound

      const requestObject = {
        id,
        route,
        parameters,
        selector
      }

      promises.push(routeReducer(routeHandler, requestObject, context))

    }

    const results = await Promise.all(promises)

    return handleResult(results)

  }

  return handler

}

module.exports = {
  createHttpServer,
  createHttpClient,
  createRequestHandler
}

const handleResult = (result) => {
  return [result, null]
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

const routeReducer = async (handler, { id, route, parameters, selector }, context) => {
  try {
    const safeContext = context ? cloneDeep(context) : {}
    let result
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        const tempResult = await handler[i](parameters, safeContext)
        if (i === handler.length - 1) {
          result = tempResult
        } else {
          if (tempResult) {
            throw new Error('Middleware should not return anything but may mutate context')
          }
        }
      }
    } else {
      result = await handler(parameters, safeContext)
    }
    if (result && (typeof result !== 'object' || Array.isArray(result))) {
      throw new Error('The result, if any, should be a JSON object')
    }
    if (result && selector) {
      result = filterObject(result, selector)
    }
    return [id, route, result, null]
  } catch (error) {
    console.error(error)
    return [id, route, null, { message: error.message }]
  }
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

function cloneDeep(value) {
  if (typeof value !== 'object' || value === null) {
    return value
  }
  let clonedValue
  if (Array.isArray(value)) {
    clonedValue = []
    for (let i = 0; i < value.length; i++) {
      clonedValue[i] = cloneDeep(value[i])
    }
  } else {
    clonedValue = {}
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        clonedValue[key] = cloneDeep(value[key])
      }
    }
  }
  return clonedValue
}
