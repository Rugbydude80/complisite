import { useState, useEffect, useCallback } from 'react'

type OfflineData = {
  id: string
  type: 'checklist' | 'photo' | 'comment'
  data: any
  timestamp: number
  synced: boolean
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check IndexedDB for pending items
    loadPendingItems()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CompliSiteDB', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  const saveOfflineData = useCallback(async (type: OfflineData['type'], data: any) => {
    const db = await openDB()
    const transaction = db.transaction(['offlineData'], 'readwrite')
    const store = transaction.objectStore('offlineData')

    const offlineItem: OfflineData = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    }

    store.add(offlineItem)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        loadPendingItems()
        resolve(offlineItem)
      }
      transaction.onerror = () => reject(transaction.error)
    })
  }, [])

  const loadPendingItems = async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offlineData'], 'readonly')
      const store = transaction.objectStore('offlineData')
      const index = store.index('synced')
      const request = index.getAll()

      request.onsuccess = () => {
        setPendingSync(request.result.filter(item => !item.synced))
      }
    } catch (error) {
      console.error('Failed to load pending items:', error)
    }
  }

  const syncOfflineData = async () => {
    if (!navigator.onLine) return

    const db = await openDB()
    const transaction = db.transaction(['offlineData'], 'readonly')
    const store = transaction.objectStore('offlineData')
    const index = store.index('synced')
    const request = index.getAll()

    request.onsuccess = async () => {
      const items = request.result.filter(item => !item.synced)

      for (const item of items) {
        try {
          // Sync based on type
          if (item.type === 'checklist') {
            await syncChecklist(item.data)
          } else if (item.type === 'photo') {
            await syncPhoto(item.data)
          } else if (item.type === 'comment') {
            await syncComment(item.data)
          }

          // Mark as synced
          await markAsSynced(item.id)
        } catch (error) {
          console.error(`Failed to sync ${item.type}:`, error)
        }
      }

      loadPendingItems()
    }
  }

  const syncChecklist = async (data: any) => {
    const response = await fetch('/api/checklists/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to sync checklist')
    }
  }

  const syncPhoto = async (data: any) => {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('checklistItemId', data.checklistItemId)

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to sync photo')
    }
  }

  const syncComment = async (data: any) => {
    const response = await fetch('/api/comments/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to sync comment')
    }
  }

  const markAsSynced = async (id: string) => {
    const db = await openDB()
    const transaction = db.transaction(['offlineData'], 'readwrite')
    const store = transaction.objectStore('offlineData')
    
    const request = store.get(id)
    request.onsuccess = () => {
      const item = request.result
      if (item) {
        item.synced = true
        store.put(item)
      }
    }
  }

  const clearSyncedData = async () => {
    const db = await openDB()
    const transaction = db.transaction(['offlineData'], 'readwrite')
    const store = transaction.objectStore('offlineData')
    const index = store.index('synced')
    const request = index.getAll()

    request.onsuccess = () => {
      const items = request.result.filter(item => item.synced)
      items.forEach(item => store.delete(item.id))
    }
  }

  return {
    isOnline,
    pendingSync,
    saveOfflineData,
    syncOfflineData,
    clearSyncedData
  }
}
