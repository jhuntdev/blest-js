import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const BlestContext = createContext()

export const BlestProvider = ({ children, url, options = {} }) => {

  const [queue, setQueue] = useState([])
  const [state, setState] = useState({})

  const timeout = useRef()

  const enqueue = useCallback((id, name, variables, options) => {
    if (timeout.current) clearTimeout(timeout.current)
    setState((state) => {
      return {
        ...state,
        [id]: {
          loading: false,
          error: null,
          data: null
        }
      }
    })
    setQueue((queue) => [...queue, [id, name, variables, options]])
  }, [])
  
  useEffect(() => {
    if (queue.length > 0) {
      const myQueue = queue.map((q) => [...q])
      const requestIds = queue.map((q) => q[0])
      setQueue([])
      timeout.current = setTimeout(() => {
        setState((state) => {
          const newState = {
            ...state
          }
          for (let i = 0; i < requestIds.length; i++) {
            const id = requestIds[i]
            newState[id] = {
              loading: true,
              error: null,
              data: null
            }
          }
          return newState
        })
        fetch(url, {
          ...options,
          body: JSON.stringify(myQueue),
          mode: 'cors',
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          }
        })
        .then(async (result) => {
          const results = await result.json()
          setState((state) => {
            const newState = {
              ...state
            }
            for (let i = 0; i < results.length; i++) {
              const item = results[i]
              newState[item[0]] = {
                loading: false,
                error: item[3],
                data: item[2]
              }
            }
            return newState
          })
        })
        .catch((error) => {
          setState((state) => {
            const newState = {
              ...state
            }
            for (let i = 0; i < myQueue.length; i++) {
              const id = requestIds[i]
              newState[id] = {
                loading: false,
                error: error,
                data: null
              }
            }
            return newState
          })
        })
      }, 1)
    }
  }, [queue, url, options])

  return (
    <BlestContext.Provider value={{ queue, state, enqueue }}>
      {children}
    </BlestContext.Provider>
  )

}

export const useBlestContext = () => {

  const context = useContext(BlestContext)

  useEffect(() => {
    console.warn('useBlestContext() is a utility function for debugging')
  }, [])

  return context

}

export const useBlestRequest = (name, variables, options) => {

  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState(null)
  const queryState = requestId && state[requestId]
  const lastRequest = useRef()

  useEffect(() => {
    const requestHash = name + JSON.stringify(variables || {}) + JSON.stringify(options || {})
    if (lastRequest.current === requestHash) return;
    lastRequest.current = requestHash
    const id = uuidv4()
    enqueue(id, name, variables, options)
    setRequestId(id)
  }, [name, variables, options, enqueue])

  return queryState || {}

}

export const useBlestCommand = (name, options) => {
  
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState(null)
  const queryState = requestId && state[requestId]

  const request = useCallback((variables) => {
    const id = Math.round(Math.random() * 1000000).toString()
    enqueue(id, name, variables, options)
    setRequestId(id)
  }, [name, options, enqueue, setRequestId])

  return [request, queryState || {}]
}