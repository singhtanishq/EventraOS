import { useState, useCallback, useEffect } from 'react'
import { useSearchStore } from '@/store/search'
import { api } from '@/lib/api'
import { useDebounce } from './useDebounce'

interface SearchParams {
  service_type?: string
  destination?: string
  start_date?: string
  end_date?: string
  guests?: number
  rooms?: number
  passengers?: number
  cabin_class?: string
  category?: string
  page?: number
  per_page?: number
  sort?: string
  [key: string]: any
}

interface SearchResult<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export function useSearch<T = any>(serviceType: string) {
  const { setParams, setResults, setLoading, setError, clearResults, params } = useSearchStore()
  const [debouncedParams, setDebouncedParams] = useState<SearchParams>(params)
  const debouncedSearch = useDebounce(debouncedParams, 300)

  const search = useCallback(async (searchParams: SearchParams) => {
    setParams(searchParams)
    setDebouncedParams(searchParams)
    setLoading(true)
    setError(null)

    try {
      const body = await api.get<any>(`/search/${serviceType}`, { params: searchParams })
      const payload = body?.data ?? body?.results ?? body
      setResults(payload?.results ?? payload ?? [], payload?.total_count)
      return payload
    } catch (err: any) {
      const message = err.response?.data?.message || 'Search failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [serviceType, setParams, setLoading, setError, setResults])

  const searchDebounced = useCallback(async (searchParams: SearchParams) => {
    setDebouncedParams(searchParams)
    setParams(searchParams)
    setLoading(true)
    setError(null)

    try {
      const body = await api.get<any>(`/search/${serviceType}`, { params: searchParams })
      const payload = body?.data ?? body?.results ?? body
      setResults(payload?.results ?? payload ?? [], payload?.total_count)
      return payload
    } catch (err: any) {
      const message = err.response?.data?.message || 'Search failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [serviceType, setParams, setLoading, setError, setResults])

  const nextPage = useCallback(async () => {
    if (params.page && params.per_page) {
      await search({ ...params, page: params.page + 1 })
    }
  }, [params, search])

  const reset = useCallback(() => {
    clearResults()
    setDebouncedParams({} as SearchParams)
  }, [clearResults])

  useEffect(() => {
    if (debouncedSearch && Object.keys(debouncedSearch).length > 0) {
      const hasValidParams = Object.values(debouncedSearch).some(v => v !== undefined && v !== '')
      if (hasValidParams) {
        search(debouncedSearch)
      }
    }
  }, [debouncedSearch, search])

  return {
    params,
    debouncedParams,
    search,
    searchDebounced,
    nextPage,
    reset,
    isLoading: useSearchStore.getState().isLoading,
    error: useSearchStore.getState().error,
    results: useSearchStore.getState().results,
    total: useSearchStore.getState().total,
  }
}

export function useQuickSearch<T = any>(serviceType: string) {
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, filters: Record<string, any> = {}) => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults([])
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      const body = await api.get<any>('/search/suggestions', {
        params: { q: query, ...filters }
      })
      const searchResults = body?.data?.suggestions ?? body?.data ?? body?.results ?? []
      setResults(searchResults)
      return searchResults
    } catch (err: any) {
      const message = err.response?.data?.message || 'Quick search failed'
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [serviceType])

  return { results, isLoading, error, search }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<Array<{
    id: string
    query: string
    params: Record<string, any>
    timestamp: number
    serviceType: string
  }>>([])

  useEffect(() => {
    const stored = localStorage.getItem('eventraos-recent-searches')
    if (stored) {
      try {
        setSearches(JSON.parse(stored))
      } catch {
        setSearches([])
      }
    }
  }, [])

  const addSearch = useCallback((query: string, params: Record<string, any>, serviceType: string) => {
    if (!query.trim()) return
    
    const newSearch = {
      id: Date.now().toString(),
      query,
      params,
      timestamp: Date.now(),
      serviceType,
    }

    setSearches(prev => {
      const filtered = prev.filter(s => s.query !== query || s.serviceType !== serviceType)
      const updated = [newSearch, ...filtered].slice(0, 10)
      localStorage.setItem('eventraos-recent-searches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeSearch = useCallback((id: string) => {
    setSearches(prev => {
      const updated = prev.filter(s => s.id !== id)
      localStorage.setItem('eventraos-recent-searches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearSearches = useCallback(() => {
    setSearches([])
    localStorage.removeItem('eventraos-recent-searches')
  }, [])

  return { searches, addSearch, removeSearch, clearSearches }
}