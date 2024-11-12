// API optimization utilities for EventraOS

import { api } from './api'

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>()
const CACHE_TTL = 5000 // 5 seconds

// Request deduplication
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const cached = requestCache.get(key)
  if (cached) {
    return cached
  }

  const promise = requestFn().finally(() => {
    // Remove from cache after TTL
    setTimeout(() => {
      requestCache.delete(key)
    }, CACHE_TTL)
  })

  requestCache.set(key, promise)
  return promise
}

// Batch API requests
export async function batchRequests<T>(
  requests: Array<{ key: string; fn: () => Promise<any> }>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {}

  // Execute all requests in parallel
  const promises = requests.map(async ({ key, fn }) => {
    try {
      const result = await fn()
      return { key, result, error: null }
    } catch (error) {
      return { key, result: null, error }
    }
  })

  const results_array = await Promise.all(promises)

  for (const { key, result, error } of results_array) {
    if (error) {
      throw error
    }
    results[key] = result
  }

  return results
}

// Request cancellation
export function createCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController()
  const promise = requestFn(controller.signal)

  return {
    promise,
    cancel: () => controller.abort(),
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    retryCondition?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = () => true,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries || !retryCondition(error)) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent: number

  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => fn().then(resolve, reject))
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const fn = this.queue.shift()!

    try {
      await fn()
    } finally {
      this.running--
      this.process()
    }
  }
}

export const apiQueue = new RequestQueue(6)

// API response compression helper
export function compressResponse(data: any): string {
  return JSON.stringify(data)
}

// Request prefetching
const prefetchCache = new Map<string, Promise<any>>()

export function prefetchRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (prefetchCache.has(key)) {
    return prefetchCache.get(key)!
  }

  const promise = fn().finally(() => {
    // Keep in cache for 30 seconds
    setTimeout(() => prefetchCache.delete(key), 30000)
  })

  prefetchCache.set(key, promise)
  return promise
}

// Request interceptor for automatic retries
export function withRetry(
  fn: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    baseDelay: 1000,
    retryCondition: (error: any) => {
      // Retry on network errors or 5xx errors
      if (error instanceof TypeError && error.message.includes('Network')) {
        return true
      }
      if (error.response?.status >= 500) {
        return true
      }
      return false
    },
  })
}

// Batch API client
export class BatchApiClient {
  private batch: Array<{
    key: string
    resolve: (value: any) => void
    reject: (error: Error) => void
    fn: () => Promise<any>
  }> = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private readonly batchSize: number
  private readonly flushInterval: number

  constructor(batchSize = 10, flushInterval = 50) {
    this.batchSize = batchSize
    this.flushInterval = flushInterval
  }

  add<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, fn, resolve, reject })

      if (this.batch.length >= this.batchSize) {
        this.flush()
      } else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), this.flushInterval)
      }
    })
  }

  private async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    const batch = this.batch.splice(0, this.batchSize)
    if (batch.length === 0) return

    try {
      const results = await Promise.all(
        batch.map(async ({ fn }) => {
          try {
            return await fn()
          } catch (error) {
            return { error }
          }
        })
      )

      for (let i = 0; i < batch.length; i++) {
        const { resolve, reject } = batch[i]
        const result = results[i]
        if (result.error) {
          reject(result.error)
        } else {
          resolve(result)
        }
      }
    } catch (error) {
      batch.forEach(({ reject }) => reject(error as Error))
    }
  }
}

export const batchApiClient = new BatchApiClient(10, 50)

// Response caching middleware
export function createCachedApi<T extends Record<string, any>>(
  apiClient: T,
  cacheOptions: {
    ttl?: number
    keyPrefix?: string
    excludeMethods?: string[]
  } = {}
): T {
  const { ttl = 60000, keyPrefix = 'api:', excludeMethods = ['post', 'put', 'patch', 'delete'] } = cacheOptions
  const cache = new Map<string, { data: any; expires: number }>()

  return new Proxy(apiClient, {
    get(target, prop) {
      const value = target[prop as keyof T]

      if (typeof value === 'function' && !excludeMethods.includes(prop as string)) {
        return async (...args: any[]) => {
          const cacheKey = `${keyPrefix}${prop}:${JSON.stringify(args)}`
          const cached = cache.get(cacheKey)

          if (cached && cached.expires > Date.now()) {
            return cached.data
          }

          const result = await (value as Function).apply(target, args)

          cache.set(cacheKey, {
            data: result,
            expires: Date.now() + ttl,
          })

          // Clean expired entries periodically
          if (cache.size > 1000) {
            const now = Date.now()
            for (const [key, value] of cache.entries()) {
              if (value.expires < now) {
                cache.delete(key)
              }
            }
          }

          return result
        }
      }
      return value
    }) as T
}

// Request/Response transformation
export function transformRequest(data: any): any {
  // Remove undefined and null values
  if (Array.isArray(data)) {
    return data.map(transformRequest).filter((v) => v !== undefined)
  }

  if (data && typeof data === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        result[key] = transformRequest(value)
      }
    }
    return result
  }

  return data
}

export function transformResponse<T>(data: T): T {
  // Transform API response to internal format
  return data
}

// Error boundary for API calls
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static fromResponse(response: Response, data: any): ApiError {
    return new ApiError(
      data.message || 'API Error',
      response.status,
      data.code || 'API_ERROR',
      data.details
    )
  }
}

// Circuit breaker for failing services
export class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailure = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  getState() {
    return this.state
  }
}

export const apiCircuitBreaker = new CircuitBreaker()