import { AppStorageState } from '../types';

const DB_NAME = 'ZY_VocabHear_LocalDatabase_v1';
const STORE_NAME = 'app_state_store';
const STATE_KEY = 'current_app_state';

/**
 * Initialize IndexedDB database connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save state asynchronously to browser's IndexedDB
 */
export async function saveStateToIndexedDB(state: AppStorageState): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB save failed, falling back to localStorage:', error);
    return false;
  }
}

/**
 * Load state asynchronously from browser's IndexedDB
 */
export async function loadStateFromIndexedDB(): Promise<AppStorageState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);

      req.onsuccess = () => {
        resolve(req.result ? (req.result as AppStorageState) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB load failed:', error);
    return null;
  }
}

/**
 * Clear state from IndexedDB
 */
export async function clearIndexedDB(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB clear failed:', error);
    return false;
  }
}

/**
 * Estimate storage usage in IndexedDB / Browser storage
 */
export async function getStorageUsageInfo(): Promise<{
  usageMB: string;
  quotaMB: string;
  isIndexedDBSupported: boolean;
}> {
  const isSupported = 'indexedDB' in window;
  if (!isSupported) {
    return { usageMB: '0.00', quotaMB: 'N/A', isIndexedDBSupported: false };
  }

  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
      const quota = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
      return { usageMB: usage, quotaMB: quota, isIndexedDBSupported: true };
    }
  } catch (e) {
    console.warn('Storage estimate error:', e);
  }

  return { usageMB: '< 1.0', quotaMB: 'Unlimited (Browser Managed)', isIndexedDBSupported: true };
}
