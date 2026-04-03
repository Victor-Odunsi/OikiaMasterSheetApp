import { useState, useEffect, useCallback } from 'react'

interface UseApiDataOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options?: UseApiDataOptions<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options?.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (options?.enabled !== false) {
      load()
    }
  }, [load, options?.enabled])

  return { data, isLoading, error, refetch: load }
}
