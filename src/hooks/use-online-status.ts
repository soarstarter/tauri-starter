import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void): (() => void) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const getSnapshot = (): boolean => navigator.onLine

// Assume online on the server snapshot so the offline banner never flashes
// during the initial render before hydration settles.
const getServerSnapshot = (): boolean => true

/**
 * Reactive network reachability driven by the browser's `online`/`offline`
 * events. Note this reflects the OS network interface, not actual internet
 * reachability — good enough to warn the user that requests may fail.
 */
export const useOnlineStatus = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
