const CACHE_NAME = 'complisite-v1';
const DATA_CACHE_NAME = 'complisite-data-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and external services
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip requests to external services that might cause errors
  if (event.request.url.includes('datadoghq.com') || 
      event.request.url.includes('analytics') ||
      event.request.url.includes('tracking') ||
      event.request.url.includes('monitoring')) {
    return;
  }

  // Handle API calls differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.log('[ServiceWorker] API request failed:', event.request.url, err);
        // Return a basic response for failed API calls
        return new Response(JSON.stringify({ error: 'Network request failed' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.log('[ServiceWorker] Fetch failed for:', event.request.url, error);
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        // For other requests, just let them fail gracefully
        throw error;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);
  
  if (event.tag === 'sync-checklists') {
    event.waitUntil(syncChecklists());
  }
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

// Sync offline checklists
async function syncChecklists() {
  const offlineData = await getOfflineData('checklists');
  
  if (offlineData && offlineData.length > 0) {
    for (const checklist of offlineData) {
      try {
        await fetch('/api/checklists/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checklist)
        });
        
        await removeOfflineData('checklists', checklist.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync checklist:', error);
      }
    }
  }
}

// Sync offline photos
async function syncPhotos() {
  const offlinePhotos = await getOfflineData('photos');
  
  if (offlinePhotos && offlinePhotos.length > 0) {
    for (const photo of offlinePhotos) {
      try {
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('checklistItemId', photo.checklistItemId);
        
        await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        });
        
        await removeOfflineData('photos', photo.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync photo:', error);
      }
    }
  }
}

// Helper functions for IndexedDB
async function getOfflineData(storeName) {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineData(storeName, id) {
  // Implementation would use IndexedDB
}
