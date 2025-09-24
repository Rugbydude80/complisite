'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registered:', registration)
            
            // Check for updates every 5 minutes
            setInterval(() => {
              registration.update()
            }, 300000)
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error)
          })
      })
    }

    // Request notification permission for background sync
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return null
}
