// Bundle analysis utilities for EventraOS

// Webpack Bundle Analyzer configuration
export const bundleAnalyzerConfig = {
  analyzerMode: 'static',
  reportFilename: 'bundle-report.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  logLevel: 'info',
  defaultSizes: 'parsed',
}

// Bundle size budgets
export const bundleBudgets = {
  initial: {
    maximumWarning: '250kb',
    maximumError: '500kb',
  },
  anyComponentStyle: {
    maximumWarning: '10kb',
    maximumError: '20kb',
  },
}

// Chunk splitting configuration
export const chunkSplitConfig = {
  vendor: {
    test: /[\\/]node_modules[\\/]/,
    name: 'vendors',
    chunks: 'all',
    priority: 10,
  },
  common: {
    name: 'common',
    minChunks: 2,
    chunks: 'all',
    priority: 5,
    reuseExistingChunk: true,
  },
  runtime: {
    name: 'runtime',
    chunks: 'all',
  },
}

// Tree shaking configuration
export const treeShakingConfig = {
  sideEffects: false,
  usedExports: true,
  providedExports: true,
  innerGraph: true,
}

// Module federation config for micro-frontends
export const moduleFederationConfig = {
  name: 'eventraos',
  filename: 'remoteEntry.js',
  exposes: {
    './SearchWidget': './src/components/SearchWidget',
    './BookingWidget': './src/components/BookingWidget',
    './UserProfile': './src/components/UserProfile',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.1' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
    'react-router-dom': { singleton: true, requiredVersion: '^6.26.2' },
    '@tanstack/react-query': { singleton: true, requiredVersion: '^5.56.2' },
    zustand: { singleton: true, requiredVersion: '^4.5.5' },
  },
}

// Dynamic imports with webpack magic comments
export const dynamicImports = {
  // Heavy components loaded on demand
  SearchWidget: () => import(/* webpackChunkName: "search-widget" */ '@/components/SearchWidget'),
  BookingWidget: () => import(/* webpackChunkName: "booking-widget" */ '@/components/BookingWidget'),
  SeatMap: () => import(/* webpackChunkName: "seat-map" */ '@/components/SeatMap'),
  Calendar: () => import(/* webpackChunkName: "calendar" */ '@/components/Calendar'),
  Chart: () => import(/* webpackChunkName: "chart" */ '@/components/Chart'),
  Map: () => import(/* webpackChunkName: "map" */ '@/components/Map'),
  DatePicker: () => import(/* webpackChunkName: "datepicker" */ '@/components/DatePicker'),
  ImageGallery: () => import(/* webpackChunkName: "image-gallery" */ '@/components/ImageGallery'),
  RichTextEditor: () => import(/* webpackChunkName: "rich-text-editor" */ '@/components/RichTextEditor'),
  FileUploader: () => import(/* webpackChunkName: "file-uploader" */ '@/components/FileUploader'),
  DataTable: () => import(/* webpackChunkName: "data-table" */ '@/components/DataTable'),
  Modal: () => import(/* webpackChunkName: "modal" */ '@/components/Modal'),
  Toast: () => import(/* webpackChunkName: "toast" */ '@/components/Toast'),
}

// Route-based code splitting
export const routeSplitting = {
  Home: () => import(/* webpackChunkName: "home" */ '@/pages/public/Home'),
  Search: () => import(/* webpackChunkName: "search" */ '@/pages/public/SearchPage'),
  Hotels: () => import(/* webpackChunkName: "hotels" */ '@/pages/hotels/HotelResults'),
  HotelDetail: () => import(/* webpackChunkName: "hotel-detail" */ '@/pages/hotels/HotelDetail'),
  Flights: () => import(/* webpackChunkName: "flights" */ '@/pages/flights/FlightResults'),
  FlightDetail: () => import(/* webpackChunkName: "flight-detail" */ '@/pages/flights/FlightDetail'),
  Venues: () => import(/* webpackChunkName: "venues" */ '@/pages/venues/VenueResults'),
  VenueDetail: () => import(/* webpackChunkName: "venue-detail" */ '@/pages/venues/VenueDetail'),
  Trains: () => import(/* webpackChunkName: "trains" */ '@/pages/trains/TrainResults'),
  Buses: () => import(/* webpackChunkName: "buses" */ '@/pages/buses/BusResults'),
  Cars: () => import(/* webpackChunkName: "cars" */ '@/pages/cars/CarResults'),
  Activities: () => import(/* webpackChunkName: "activities" */ '@/pages/activities/ActivityResults'),
  Transfers: () => import(/* webpackChunkName: "transfers" */ '@/pages/transfers/TransferResults'),
  Packages: () => import(/* webpackChunkName: "packages" */ '@/pages/packages/PackageResults'),
  Checkout: () => import(/* webpackChunkName: "checkout" */ '@/pages/checkout/Checkout'),
  CustomerDashboard: () => import(/* webpackChunkName: "customer-dashboard" */ '@/pages/customer/Dashboard'),
  AgentDashboard: () => import(/* webpackChunkName: "agent-dashboard" */ '@/pages/agent/Dashboard'),
  AdminDashboard: () => import(/* webpackChunkName: "admin-dashboard" */ '@/pages/admin/Dashboard'),
}

// Preload critical routes
export const preloadRoutes = [
  '/search',
  '/hotels',
  '/flights',
  '/venues',
  '/checkout',
]

// Module preloading
export function preloadModule(moduleLoader: () => Promise<any>) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      moduleLoader()
    })
  } else {
    setTimeout(() => moduleLoader(), 1)
  }
}

// Bundle size reporting
export function reportBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource')

    const jsResources = resources.filter((r) => r.name.endsWith('.js'))
    const cssResources = resources.filter((r) => r.name.endsWith('.css'))

    const totalJsSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize, 0)
    const totalCssSize = cssResources.reduce((sum, r) => sum + (r as any).transferSize, 0)

    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      navigation: {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      },
      resources: {
        js: {
          count: jsResources.length,
          totalSize: totalJsSize,
          gzippedSize: jsResources.reduce((sum, r) => sum + ((r as any).encodedBodySize || 0), 0),
        },
        css: {
          count: cssResources.length,
          totalSize: totalCssSize,
          gzippedSize: cssResources.reduce((sum, r) => sum + ((r as any).encodedBodySize || 0), 0),
        },
        totalSize: totalJsSize + totalCssSize,
      },

      // Send to analytics
      const shouldSend = navigator.sendBeacon
      if (shouldSend) {
        navigator.sendBeacon('/api/analytics/bundle-size', JSON.stringify(report))
      }

      return report
  }

  return null
}

// Code coverage reporting
export function collectCodeCoverage() {
  if (typeof window !== 'undefined' && (window as any).__coverage__) {
    return (window as any).__coverage__
  }
  return null
}

// Webpack stats analysis
export function analyzeWebpackStats(stats: any) {
  const analysis = {
    totalSize: 0,
    chunks: [],
    modules: [],
    assets: [],
    warnings: [],
    errors: [],
  }

  if (stats.chunks) {
    stats.chunks.forEach((chunk: any) => {
      analysis.chunks.push({
        id: chunk.id,
        names: chunk.names,
        size: chunk.size,
        files: chunk.files,
        modules: chunk.modules?.length || 0,
      })
      analysis.totalSize += chunk.size
    })
  }

  if (stats.modules) {
    stats.modules.forEach((module: any) => {
      analysis.modules.push({
        name: module.name,
        size: module.size,
        chunks: module.chunks,
        reasons: module.reasons,
      })
    })
  }

  if (stats.assets) {
    stats.assets.forEach((asset: any) => {
      analysis.assets.push({
        name: asset.name,
        size: asset.size,
        chunks: asset.chunks,
        emitted: asset.emitted,
      })
    })
  }

  return analysis
}

// Webpack bundle analyzer plugin configuration
export const webpackBundleAnalyzer = {
  analyzerMode: 'static',
  reportFilename: '../bundle-report.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  logLevel: 'info',
  defaultSizes: 'parsed',
  excludeAssets: [
    '*.map',
    '*.txt',
    '*.md',
  ],
}

// Visualize bundle with webpack-bundle-analyzer
export function visualizeBundle(statsPath: string) {
  const fs = require('fs')
  const path = require('path')

  if (!fs.existsSync(statsPath)) {
    console.error('Stats file not found:', statsPath)
    return
  }

  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'))
  const analysis = analyzeWebpackStats(stats)

  // Generate HTML report
  const report = generateHtmlReport(analysis)
  const reportPath = path.join(path.dirname(statsPath), 'bundle-report.html')
  fs.writeFileSync(reportPath, report)

  console.log('Bundle analysis report generated:', reportPath)
  return analysis
}

function generateHtmlReport(analysis: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    h1, h2 { color: #1a2a43; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    .good { color: #16a34a; }
    .warning { color: #d97706; }
    .error { color: #dc2626; }
    .size { font-family: monospace; }
  </style>
</head>
<body>
  <h1>Bundle Analysis Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <h2>Summary</h2>
  <table>
    <tr><th>Total Size</th><td class="size">${formatBytes(stats.totalSize)}</td></tr>
    <tr><th>Chunks</th><td>${stats.chunks.length}</td></tr>
    <tr><th>Modules</th><td>${stats.modules.length}</td></tr>
    <tr><th>Assets</th><td>${stats.assets.length}</td></tr>
  </table>

  <h2>Chunks</h2>
  <table>
    <tr><th>Name</th><th>Size</th><th>Modules</th><th>Files</th></tr>
    ${stats.chunks.map((chunk: any) => `
      <tr>
        <td>${chunk.names.join(', ')}</td>
        <td class="size">${formatBytes(chunk.size)}</td>
        <td>${chunk.modules}</td>
        <td>${chunk.files.join(', ')}</td>
      </tr>
    `).join('')}
  </table>

  <h2>Largest Modules</h2>
  <table>
    <tr><th>Name</th><th>Size</th><th>Chunks</th></tr>
    ${stats.modules
      .sort((a: any, b: any) => b.size - a.size)
      .slice(0, 20)
      .map((module: any) => `
        <tr>
          <td>${module.name}</td>
          <td class="size">${formatBytes(module.size)}</td>
          <td>${module.chunks.join(', ')}</td>
        </tr>
      `).join('')}
  </table>
</body>
</html>
  `
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}