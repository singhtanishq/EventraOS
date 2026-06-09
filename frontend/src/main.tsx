import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})


// TEMP DEBUG: surface fatal errors visibly
window.addEventListener('error', (e) => {
  const el = document.createElement('pre');
  el.id = 'fatal-error';
  el.textContent = 'FATAL: ' + e.message + ' @ ' + e.filename + ':' + e.lineno + ':' + e.colno;
  document.body.appendChild(el);
});
window.addEventListener('unhandledrejection', (e) => {
  const el = document.createElement('pre');
  el.id = 'fatal-error';
  el.textContent = 'REJECTION: ' + String(e.reason && e.reason.stack ? e.reason.stack : e.reason).slice(0, 600);
  document.body.appendChild(el);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#102a43',
              color: '#fff',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              fontSize: '0.875rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)