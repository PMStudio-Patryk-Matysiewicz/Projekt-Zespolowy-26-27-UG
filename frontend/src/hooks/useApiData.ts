import { useEffect, useState } from 'react'

export type ApiData<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' }

// Loads data once when the component mounts. `load` must be stable (a module-level function).
export function useApiData<T>(load: () => Promise<T>): ApiData<T> {
  const [state, setState] = useState<ApiData<T>>({ status: 'loading' })

  useEffect(() => {
    // Ignore a response that arrives after unmount (or after StrictMode's extra mount in dev).
    let active = true
    load()
      .then((data) => {
        if (active) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [load])

  return state
}
