// Performance monitoring utilities for EventraOS

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

type MetricHandler = (metric: WebVitalsMetric) => void

// Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

// Performance observer for Web Vitals
let observer: PerformanceObserver | null = null
let metrics: PerformanceMetric[] = []

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Initialize Performance Observer for Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          handlePerformanceEntry(entry)
        }
      })

      observer.observe({ type: 'web-vital', buffered: true })
    } catch (error) {
      console.warn('PerformanceObserver not fully supported:', error)
    }

    // Observe other performance entries
    observePerformanceEntries()
  }

  // Track page load performance
  trackPageLoad()

  // Track resource timing
  trackResourceTiming()

  // Track long tasks
  trackLongTasks()

  // Report metrics periodically
  setInterval(reportMetrics, 30000) // Every 30 seconds

  // Report on page unload
  window.addEventListener('beforeunload', () => {
    sendMetricsToAnalytics()
  })

  // Track visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendMetricsToAnalytics()
    }
  })
}

function handlePerformanceEntry(entry: PerformanceEntry) {
  const metric = entry as unknown as WebVitalsMetric

  // Only process web-vital entries
  if (!['CLS', 'FID', 'LCP', 'FCP', 'TTFB', 'INP'].includes(entry.name)) {
    return
  }

  const thresholds = THRESHOLDS[entry.name as keyof typeof THRESHOLDS]
  if (!thresholds) return

  let rating: 'good' | 'needs-improvement' | 'poor'
  if (entry.value <= thresholds.good) {
    rating = 'good'
  } else if (entry.value <= thresholds.poor) {
    rating = 'needs-improvement'
  } else {
    rating = 'poor'
  }

  const metric: PerformanceMetric = {
    name: entry.name,
    value: entry.value,
    rating,
    timestamp: Date.now(),
    url: window.location.href,
  }

  metrics.push(metric)

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${entry.name}: ${entry.value.toFixed(2)}ms (${rating})`)
  }

  // Send to analytics if rating is poor
  if (rating === 'poor') {
    sendMetricToAnalytics(metric)
  }
}

function observePerformanceEntries() {
  if (!('PerformanceObserver' in window)) return

  // Observe paint timing
  try {
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('FCP', entry.startTime, 'good')
        }
      }
    })
    paintObserver.observe({ type: 'paint', buffered: true })
  } catch (e) {
    // Ignore
  }

  // Observe navigation timing
  try {
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          recordMetric('TTFB', navEntry.responseStart - navEntry.requestStart, 'good')
          recordMetric('DOMContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'good')
          recordMetric('LoadComplete', navEntry.loadEventEnd - navEntry.fetchStart, 'good')
        }
      }
    })
    navObserver.observe({ type: 'navigation', buffered: true })
  } catch (e) {
    // Ignore
  }

  // Observe resource timing
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming
        if (resourceEntry.duration > 1000) {
          // Log slow resources
          console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration.toFixed(2)}ms`)
        }
      }
    })
    resourceObserver.observe({ type: 'resource', buffered: true })
  } catch (e) {
    // Ignore
  }
}

function trackPageLoad() {
  if (!('performance' in window)) return

  // Wait for load event
  if (document.readyState === 'complete') {
    measurePageLoad()
  } else {
    window.addEventListener('load', () => {
      // Use setTimeout to ensure all resources are loaded
      setTimeout(measurePageLoad, 0)
    })
  }
}

function measurePageLoad() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) return

  const metrics = {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    tls: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domProcessing: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,

    // Resource counts
    resourceCount: performance.getEntriesByType('resource').length,

    // Memory (if available)
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  }

  // Record key metrics
  recordMetric('TTFB', metrics.ttfb, 'good')
  recordMetric('FCP', getFCP(), 'good')
  recordMetric('LCP', getLCP(), 'good')
  recordMetric('PageLoad', metrics.loadComplete, 'good')

  // Log page load metrics in development
  if (import.meta.env.DEV) {
    console.group('[Performance] Page Load Metrics')
    console.table(metrics)
    console.groupEnd()
  }

  // Send to analytics
  sendMetricsToAnalytics({ pageLoad: metrics })
}

function getFCP(): number {
  const paintEntries = performance.getEntriesByType('paint')
  const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  return fcp ? fcp.startTime : 0
}

function getLCP(): number {
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
  if (lcpEntries.length === 0) return 0
  const lastEntry = lcpEntries[lcpEntries.length - 1]
  return lastEntry.startTime
}

function trackResourceTiming() {
  if (!('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming

        // Track slow resources (>1s)
        if (resourceEntry.duration > 1000) {
          console.warn(`[Slow Resource] ${resourceEntry.name}: ${resourceEntry.duration.toFixed(2)}ms`)

          // Send to analytics for slow resources
          sendMetricToAnalytics({
            name: 'SlowResource',
            value: resourceEntry.duration,
            rating: 'poor',
            timestamp: Date.now(),
            url: window.location.href,
            resource: resourceEntry.name,
          })
        }

        // Track failed resources
        if (resourceEntry.responseEnd === 0 && resourceEntry.transferSize === 0) {
          console.error(`[Failed Resource] ${resourceEntry.name}`)
          sendMetricToAnalytics({
            name: 'FailedResource',
            value: 1,
            rating: 'poor',
            timestamp: Date.now(),
            url: window.location.href,
            resource: resourceEntry.name,
          })
        }
      }
    })
    observer.observe({ type: 'resource', buffered: true })
  } catch (e) {
    // Ignore
  }
}

function trackLongTasks() {
  if (!('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`[Long Task] ${entry.duration.toFixed(2)}ms`)

          sendMetricToAnalytics({
            name: 'LongTask',
            value: entry.duration,
            rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
            timestamp: Date.now(),
            url: window.location.href,
            attribution: (entry as any).attribution,
          })
        }
      }
    })
    observer.observe({ type: 'longtask', buffered: true })
  } catch (e) {
    // Ignore
  }
}

function recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
  const metric: PerformanceMetric = {
    name,
    value,
    rating,
    timestamp: Date.now(),
    url: window.location.href,
  }

  metrics.push(metric)

  if (import.meta.env.DEV) {
    console.log(`[Metric] ${name}: ${value.toFixed(2)}ms (${rating})`)
  }

  if (rating === 'poor') {
    sendMetricToAnalytics(metric)
  }
}

let metricsQueue: PerformanceMetric[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function sendMetricToAnalytics(metric: PerformanceMetric) {
  metricsQueue.push(metric)

  if (flushTimeout) {
    clearTimeout(flushTimeout)
  }

  flushTimeout = setTimeout(() => {
    flushMetricsQueue()
  }, 1000)
}

function flushMetricsQueue() {
  if (metricsQueue.length === 0) return

  const payload = {
    metrics: metricsQueue,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    connection: (navigator as any).connection
      ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
      : null,
  }

  metricsQueue = []

  // Send to analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/metrics', JSON.stringify(payload))
  } else {
    fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }
}

function sendMetricsToAnalytics(data?: any) {
  if (data) {
    sendMetricToAnalytics(data)
  }
  flushMetricsQueue()
}

function reportMetrics() {
  if (metrics.length === 0) return

  const summary = {
    totalMetrics: metrics.length,
    byRating: {
      good: metrics.filter((m) => m.rating === 'good').length,
      'needs-improvement': metrics.filter((m) => m.rating === 'needs-improvement').length,
      poor: metrics.filter((m) => m.rating === 'poor').length,
    },
    byName: metrics.reduce((acc, m) => {
      acc[m.name] = (acc[m.name] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  if (import.meta.env.DEV) {
    console.group('[Performance] Metrics Summary')
    console.table(summary)
    console.groupEnd()
  }

  // Send summary to analytics
  sendMetricToAnalytics({
    name: 'MetricsSummary',
    value: summary.totalMetrics,
    rating: summary.byRating.poor > 0 ? 'poor' : 'good',
    timestamp: Date.now(),
    url: window.location.href,
    summary,
  })

  // Clear old metrics (keep last 100)
  if (metrics.length > 100) {
    metrics = metrics.slice(-100)
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  // Defer initialization to avoid blocking main thread
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestIdleCallback(initPerformanceMonitoring)
    })
  } else {
    requestIdleCallback(initPerformanceMonitoring)
  }
}

// Export for manual use
export const performanceMonitor = {
  init: initPerformanceMonitoring,
  recordMetric,
  sendMetricToAnalytics,
  flushMetrics: flushMetricsQueue,
  getMetrics: () => [...metrics],
  clearMetrics: () => { metrics = [] },
}

// Helper to measure custom timing
export function measureTiming(name: string, fn: () => void | Promise<void>): Promise<void> {
  const start = performance.now()
  const result = fn()

  if (result instanceof Promise) {
    return result.then(() => {
      const duration = performance.now() - start
      recordMetric(name, duration, 'good')
    })
  } else {
    const duration = performance.now() - start
    recordMetric(name, duration, 'good')
    return Promise.resolve()
  }
}

// Wrapper for async functions
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  return fn().then((result) => {
    const duration = performance.now() - start
    recordMetric(name, duration, 'good')
    return result
  })
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  // This would be used in React components
  return {
    measureTiming,
    measureAsync,
    recordMetric,
  }
}

// Declare global interfaces for TypeScript
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }

  interface Navigator {
    connection?: {
      effectiveType: string
      downlink: number
      rtt: number
    }
  }
}