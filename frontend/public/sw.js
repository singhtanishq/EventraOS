// Service Worker for EventraOS - Offline caching and performance
const CACHE_NAME = 'eventraos-v1'
const STATIC_CACHE = 'eventraos-static-v1'
const DYNAMIC_CACHE = 'eventraos-dynamic-v1'
const IMAGE_CACHE = 'eventraos-images-v1'
const API_CACHE = 'eventraos-api-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

const CACHE_STRATEGIES = {
  // Cache first - for static assets
  static: ['/assets/', '/fonts/', '/images/', '/manifest.json'],
  // Network first - for API calls
  api: ['/api/'],
  // Stale while revalidate - for images
  images: ['/images/', '/uploads/'],
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE &&
              name !== API_CACHE
            )
          })
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Determine cache strategy based on URL
  const isStaticAsset = CACHE_STRATEGIES.static.some((path) => url.pathname.startsWith(path))
  const isApiCall = CACHE_STRATEGIES.api.some((path) => url.pathname.startsWith(path))
  const isImage = CACHE_STRATEGIES.images.some((path) => url.pathname.startsWith(path))

  if (isStaticAsset) {
    // Cache first strategy for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isApiCall) {
    // Network first for API calls with short timeout
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000))
  } else if (isImage) {
    // Stale while revalidate for images
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
  } else {
    // Network first with fallback for other requests
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline.html')
      if (offlineResponse) return offlineResponse
    }
    throw error
  }
}

// Network first with timeout
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const networkResponse = await fetch(request, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // If network fails or times out, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page for navigation
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline.html')
      if (offlineResponse) return offlineResponse
    }

    throw error
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline.html')
      if (offlineResponse) return offlineResponse
    }

    throw error
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })

  return cachedResponse || fetchPromise
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings())
  }
})

async function syncBookings() {
  // Sync pending bookings when back online
  const cache = await caches.open(DYNAMIC_CACHE)
  const requests = await cache.keys()

  for (const request of requests) {
    if (request.url.includes('/api/bookings') && request.method === 'POST') {
      try {
        await fetch(request)
        await cache.delete(request)
      } catch (error) {
        console.log('Failed to sync booking:', error)
      }
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})