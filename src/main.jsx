import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './context/ThemeContext'
import { PrivacyProvider } from './context/PrivacyContext'
import { ToastProvider } from './context/ToastContext'

const CHUNK_RELOAD_SESSION_KEY = 'persona-chunk-reload'

async function clearLegacyServiceWorkers() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    if (!registrations.length) return

    await Promise.all(registrations.map((registration) => registration.unregister()))

    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
    }

    if (navigator.serviceWorker.controller && !window.sessionStorage.getItem('persona-sw-reset')) {
      window.sessionStorage.setItem('persona-sw-reset', '1')
      window.location.reload()
    }
  } catch (error) {
    console.error('Failed to clear legacy service workers', error)
  }
}

clearLegacyServiceWorkers()

function installChunkRecovery() {
  if (typeof window === 'undefined') return

  const handleChunkFailure = (event) => {
    const reason = event?.reason
    const error = reason instanceof Error ? reason : event?.error instanceof Error ? event.error : null
    const message = error?.message || String(reason || event?.message || '')

    if (!message.includes('Failed to fetch dynamically imported module')) return
    if (window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return

    window.sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1')
    window.location.reload()
  }

  window.addEventListener('error', handleChunkFailure)
  window.addEventListener('unhandledrejection', handleChunkFailure)
}

installChunkRecovery()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <PrivacyProvider>
            <App />
          </PrivacyProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
