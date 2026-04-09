import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProviders } from './app/providers/AppProviders'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
