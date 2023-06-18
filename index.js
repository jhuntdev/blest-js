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
    console.warn('The "options" argument is not yet used, but may be used in the future.')
  }

  const handler = async (requests, context) => {

    if (!requests || typeof requests !== 'object' || !Array.isArray(requests)) return handleError(400, 'Request body should be a JSON array')

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
  createHttpServer,
  createHttpClient,
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
    const safeContext = context ? JSON.parse(JSON.stringify(context)) : {}
    let result
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        const tempResult = await handler[i](params, safeContext)
        if (i === handler.length - 1) {
          result = tempResult
        } else {
          if (tempResult) {
            throw new Error('Middleware should not return anything but may mutate context')
          }
        }
      }
    } else {
      result = await handler(params, safeContext)
    }
    if (result && (typeof result !== 'object' || Array.isArray(result))) {
      throw new Error('The result, if any, should be a JSON object')
    }
    if (result && selector) {
      result = filterObject(result, selector)
    }
    return [id, endpoint, result, null]
  } catch (error) {
    console.error(error)
    return [id, endpoint, null, { message: error.message }]
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