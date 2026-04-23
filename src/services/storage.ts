import { logger } from './logger';
/**
 * IndexedDB ê¸°ë°˜ ?€?¥ì†Œ ?œë¹„?? *
 * localStorage??5MB ?œí•œ??ê·¹ë³µ?˜ê³  ëª¨ë°”?¼ì—???ˆì •?ì¸ ?€?¥ì„ ?œê³µ
 */

const DB_NAME = 'looksim-db';
const DB_VERSION = 1;

// Store names
const STORE_HISTORY = 'history';
const STORE_RESULTS = 'results';
const STORE_PHOTOS = 'photos';

export interface HistoryItem {
  id: string;
  original: string;      // base64 ?´ë?ì§€
  result: string;        // base64 ?´ë?ì§€
  styleName: string;
  styleNameKo: string;
  date: string;          // ISO string
}

export interface SavedResult {
  id: string;
  thumbnail: string;     // ?•ì¶•???¸ë„¤??  fullImage: string;     // ?ë³¸ ?´ë?ì§€
  styleName: string;
  styleNameKo: string;
  date: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * IndexedDB ?°ê²° ì´ˆê¸°?? */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('IndexedDB ?´ê¸° ?¤íŒ¨:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ê¸°ë¡ ?€?¥ì†Œ
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('date', 'date', { unique: false });
      }

      // ?€?¥ëœ ê²°ê³¼ë¬??€?¥ì†Œ
      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        const resultsStore = db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
        resultsStore.createIndex('date', 'date', { unique: false });
      }

      // ?¬ì§„ ?€?¥ì†Œ (???´ë?ì§€)
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    };
  });
}

/**
 * ?ˆìŠ¤? ë¦¬ ?€?? */
export async function saveHistory(item: Omit<HistoryItem, 'id'>): Promise<string> {
  const db = await openDB();
  const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);

    const record: HistoryItem = { ...item, id };
    const request = store.add(record);

    request.onsuccess = () => {
      // ìµœë? 20ê°œë§Œ ? ì?
      cleanupOldRecords(STORE_HISTORY, 20);
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * ëª¨ë“  ?ˆìŠ¤? ë¦¬ ì¡°íšŒ
 */
export async function getAllHistory(): Promise<HistoryItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const index = store.index('date');
    const request = index.openCursor(null, 'prev'); // ìµœì‹ ???•ë ¬

    const results: HistoryItem[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * ?ˆìŠ¤? ë¦¬ ?? œ
 */
export async function deleteHistory(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * ëª¨ë“  ?ˆìŠ¤? ë¦¬ ?? œ
 */
export async function clearAllHistory(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * ?ˆìŠ¤? ë¦¬ ê°œìˆ˜ ì¡°íšŒ
 */
export async function getHistoryCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * ê²°ê³¼ë¬??€?? */
export async function saveResult(item: Omit<SavedResult, 'id'>): Promise<string> {
  const db = await openDB();
  const id = `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readwrite');
    const store = transaction.objectStore(STORE_RESULTS);

    const record: SavedResult = { ...item, id };
    const request = store.add(record);

    request.onsuccess = () => {
      // ìµœë? 50ê°œë§Œ ? ì?
      cleanupOldRecords(STORE_RESULTS, 50);
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * ëª¨ë“  ê²°ê³¼ë¬?ì¡°íšŒ
 */
export async function getAllResults(): Promise<SavedResult[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readonly');
    const store = transaction.objectStore(STORE_RESULTS);
    const index = store.index('date');
    const request = index.openCursor(null, 'prev'); // ìµœì‹ ???•ë ¬

    const results: SavedResult[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * ê²°ê³¼ë¬??? œ
 */
export async function deleteResult(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readwrite');
    const store = transaction.objectStore(STORE_RESULTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * ëª¨ë“  ê²°ê³¼ë¬??? œ
 */
export async function clearAllResults(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readwrite');
    const store = transaction.objectStore(STORE_RESULTS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * ?¤ë˜???ˆì½”???•ë¦¬
 */
async function cleanupOldRecords(storeName: string, maxCount: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      if (count <= maxCount) {
        resolve();
        return;
      }

      // ?¤ë˜??ê²ƒë????? œ
      const index = store.index('date');
      const deleteCount = count - maxCount;
      let deleted = 0;

      const cursorRequest = index.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor && deleted < deleteCount) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        } else {
          resolve();
        }
      };
    };
  });
}

/**
 * ?´ë?ì§€ ?•ì¶• ? í‹¸ë¦¬í‹°
 * ?€?„ì•„??ì¶”ê??˜ì—¬ ë¬´í•œ ?€ê¸?ë°©ì?
 */
export function compressImage(
  base64: string,
  maxWidth: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // 10ì´??€?„ì•„???¤ì • - ?ˆë¬´ ?¤ë˜ ê±¸ë¦¬ë©??ë³¸ ë°˜í™˜
    const timeout = setTimeout(() => {
      logger.warn('compressImage timeout - returning original');
      resolve(base64);
    }, 10000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64);
        }
      } catch (err) {
        logger.warn('compressImage error:', err);
        resolve(base64);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      logger.warn('compressImage img.onerror - returning original');
      resolve(base64);
    };
    img.src = base64;
  });
}

/**
 * ?€?¥ì†Œ ?¬ìš©???•ì¸
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

/**
 * IndexedDB ì§€???¬ë? ?•ì¸
 */
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}