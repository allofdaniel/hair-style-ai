/**
 * IndexedDB 기반 저장소 서비스
 *
 * localStorage의 5MB 제한을 극복하고 모바일에서 안정적인 저장을 제공
 */

const DB_NAME = 'looksim-db';
const DB_VERSION = 1;

// Store names
const STORE_HISTORY = 'history';
const STORE_RESULTS = 'results';
const STORE_PHOTOS = 'photos';

export interface HistoryItem {
  id: string;
  original: string;      // base64 이미지
  result: string;        // base64 이미지
  styleName: string;
  styleNameKo: string;
  date: string;          // ISO string
}

export interface SavedResult {
  id: string;
  thumbnail: string;     // 압축된 썸네일
  fullImage: string;     // 원본 이미지
  styleName: string;
  styleNameKo: string;
  date: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * IndexedDB 연결 초기화
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 열기 실패:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 기록 저장소
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('date', 'date', { unique: false });
      }

      // 저장된 결과물 저장소
      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        const resultsStore = db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
        resultsStore.createIndex('date', 'date', { unique: false });
      }

      // 사진 저장소 (큰 이미지)
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 히스토리 저장
 */
export async function saveHistory(item: Omit<HistoryItem, 'id'>): Promise<string> {
  const db = await openDB();
  const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);

    const record: HistoryItem = { ...item, id };
    const request = store.add(record);

    request.onsuccess = () => {
      // 최대 20개만 유지
      cleanupOldRecords(STORE_HISTORY, 20);
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 모든 히스토리 조회
 */
export async function getAllHistory(): Promise<HistoryItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const index = store.index('date');
    const request = index.openCursor(null, 'prev'); // 최신순 정렬

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
 * 히스토리 삭제
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
 * 결과물 저장
 */
export async function saveResult(item: Omit<SavedResult, 'id'>): Promise<string> {
  const db = await openDB();
  const id = `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readwrite');
    const store = transaction.objectStore(STORE_RESULTS);

    const record: SavedResult = { ...item, id };
    const request = store.add(record);

    request.onsuccess = () => {
      // 최대 50개만 유지
      cleanupOldRecords(STORE_RESULTS, 50);
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 모든 결과물 조회
 */
export async function getAllResults(): Promise<SavedResult[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readonly');
    const store = transaction.objectStore(STORE_RESULTS);
    const index = store.index('date');
    const request = index.openCursor(null, 'prev'); // 최신순 정렬

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
 * 결과물 삭제
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
 * 모든 결과물 삭제
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
 * 오래된 레코드 정리
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

      // 오래된 것부터 삭제
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
 * 이미지 압축 유틸리티
 */
export function compressImage(
  base64: string,
  maxWidth: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
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
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/**
 * 저장소 사용량 확인
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
 * IndexedDB 지원 여부 확인
 */
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}
