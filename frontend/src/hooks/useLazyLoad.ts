import { useEffect, useRef, useState, useCallback } from 'react'

interface UseLazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useLazyLoad<T extends HTMLElement>({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseLazyLoadOptions = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<T>(null)

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [isVisible, threshold, rootMargin, triggerOnce])

  return [setRef, isVisible] as const
}

// Hook for lazy loading images with blur-up effect
export function useLazyImage(src: string, placeholder?: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const [ref, inView] = useLazyLoad<HTMLImageElement>({
    rootMargin: '100px',
    threshold: 0.1,
  })

  useEffect(() => {
    setIsInView(inView)
  }, [inView])

  useEffect(() => {
    if (!isInView || isLoaded) return

    const img = new Image()
    img.src = src
    img.onload = () => {
      setIsLoaded(true)
    }
    img.onerror = () => {
      setIsLoaded(true) // Still mark as loaded to show error state
    }
  }, [isInView, src, isLoaded])

  const combinedRef = useCallback(
    (node: HTMLImageElement | null) => {
      ref(node)
      imgRef.current = node
    },
    [ref]
  )

  return {
    ref: combinedRef,
    isLoaded,
    isInView,
    src: isInView ? src : placeholder,
  }
}

// Hook for lazy loading components
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: { fallback?: React.ReactNode }
) {
  const [Component, setComponent] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const module = await importFn()
      setComponent(() => module.default)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [Component, isLoading])

  return {
    Component,
    isLoading,
    error,
    loadComponent,
  }
}

// Hook for virtualized lists
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = {
    start: Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    end: Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    ),
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end)

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  }
}

// Hook for debounced search
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await searchFn(query)
        setResults(data)
      } catch (err) {
        setError(err as Error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [query, searchFn, delay])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
  }
}

// Hook for infinite scroll
export function useInfiniteScroll<T>({
  fetchFn,
  getNextCursor,
  initialData = [],
}: {
  fetchFn: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>
  getNextCursor: (data: T[]) => string | undefined
  initialData?: T[]
}) {
  const [data, setData] = useState<T[]>(initialData)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const { data: newData, nextCursor } = await fetchFn(cursor)

      setData((prev) => [...prev, ...newData])

      if (nextCursor) {
        setCursor(nextCursor)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [cursor, fetchFn, hasMore])

  const reset = useCallback(() => {
    setData(initialData)
    setCursor(undefined)
    setHasMore(true)
    setError(null)
  }, [initialData])

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
  }
}

// Hook for prefetching resources
export function usePrefetch() {
  const prefetched = useRef<Set<string>>(new Set())

  const prefetch = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      if (prefetched.current.has(url)) return

      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
      prefetched.current.add(url)
    })
  }, [])

  const prefetchImage = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      if (prefetched.current.has(url)) return

      const img = new Image()
      img.src = url
      prefetched.current.add(url)
    })
  }, [])

  return { prefetch, prefetchImage }
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0)
  const mountTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current += 1
    const renderTime = performance.now() - mountTime.current

    if (import.meta.env.DEV) {
      console.log(`[Render] ${componentName} #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
    }

    if (renderCount.current > 10) {
      console.warn(`[Perf Warning] ${componentName} rendered ${renderCount.current} times`)
    }
  })

  return { renderCount: renderCount.current }
}

// Hook for measuring interaction latency
export function useInteractionLatency() {
  const startTime = useRef<number | null>(null)

  const onInteractionStart = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const onInteractionEnd = useCallback((actionName: string) => {
    if (startTime.current === null) return

    const latency = performance.now() - startTime.current
    startTime.current = null

    if (import.meta.env.DEV) {
      console.log(`[Interaction] ${actionName}: ${latency.toFixed(2)}ms`)
    }

    // Report to analytics if latency is high
    if (latency > 100) {
      console.warn(`[High Latency] ${actionName}: ${latency.toFixed(2)}ms`)
    }
  }, [])

  return { onInteractionStart, onInteractionEnd }
}

// Hook for measuring component lifecycle
export function useLifecycleMetrics(componentName: string) {
  const mountTime = useRef(performance.now())
  const updateCount = useRef(0)

  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current

    if (import.meta.env.DEV) {
      console.log(`[Lifecycle] ${componentName} mounted in ${mountDuration.toFixed(2)}ms`)
    }

    return () => {
      const unmountTime = performance.now()
      console.log(`[Lifecycle] ${componentName} unmounted after ${(unmountTime - mountTime.current).toFixed(2)}ms`)
    }
  }, [])

  useEffect(() => {
    updateCount.current += 1

    if (import.meta.env.DEV && updateCount.current > 10) {
      console.warn(`[Perf Warning] Component ${componentName} re-rendered ${updateCount.current} times`)
    }
  })

  return { updateCount: updateCount.current }
}