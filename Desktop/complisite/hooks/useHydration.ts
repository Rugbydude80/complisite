import { useState, useEffect } from 'react'

/**
 * Custom hook to prevent hydration mismatches caused by browser extensions
 * and other client-side only features
 */
export function useHydration() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

/**
 * Higher-order component to prevent hydration issues
 */
export function withHydration<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function HydrationWrapper(props: T) {
    const mounted = useHydration()
    
    if (!mounted) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

/**
 * Hook to safely access window object
 */
export function useWindow() {
  const [window, setWindow] = useState<Window | undefined>(undefined)
  
  useEffect(() => {
    setWindow(window)
  }, [])
  
  return window
}

/**
 * Hook to safely access document object
 */
export function useDocument() {
  const [document, setDocument] = useState<Document | undefined>(undefined)
  
  useEffect(() => {
    setDocument(document)
  }, [])
  
  return document
}
