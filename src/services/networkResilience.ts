import { logger } from './logger';
/**
 * Network resilience utilities.
 *
 * - Retry control for unstable transport
 * - Offline queueing for later replay
 * - Basic connection quality tracking
 * - Simple network preload helpers
 */

const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};

const sanitizeLogUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
};

const sanitizeHeaders = (headers?: HeadersInit): Record<string, string> | undefined => {
  if (!headers) return undefined;

  const entries: Array<[string, string]> = [];

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      entries.push([key, value]);
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      entries.push([key, String(value)]);
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      entries.push([key, String(value)]);
    });
  }

  const redacted: Record<string, string> = {};
  const sensitiveHeaderNames = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key', 'api-key']);

  for (const [key, value] of entries) {
    const lower = key.toLowerCase();
    if (sensitiveHeaderNames.has(lower)) {
      continue;
    }
    redacted[key] = value.slice(0, 80);
  }

  if (Object.keys(redacted).length === 0) return undefined;
  return redacted;
};

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
}

interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

const QUEUE_STORAGE_KEY = 'looksim-request-queue';
const MAX_QUEUED_AGE_MS = 30 * 60 * 1000;
const MAX_QUEUED_RETRIES = 3;

let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let isMonitoringInitialized = false;
let isNetworkQueueRestored = false;

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let connectionQuality: 'good' | 'slow' | 'offline' = 'good';

const getPersistedBody = (body: RequestInit['body']): string | null => {
  if (typeof body !== 'string') return null;
  const normalized = body.toLowerCase();
  if (body.length > 1024) return null;
  if (normalized.includes('data:image') || normalized.includes('base64') || normalized.includes('image')) return null;
  return body;
};

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const initNetworkMonitoring = (): void => {
  if (typeof window === 'undefined' || isMonitoringInitialized) return;

  isMonitoringInitialized = true;
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection) {
    connection.addEventListener('change', updateConnectionQuality);
    updateConnectionQuality();
  } else {
    updateConnectionQuality();
  }

  restoreQueueFromStorage();
  if (requestQueue.length > 0) {
    processQueue();
  }
};

const updateConnectionQuality = (): void => {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) {
    connectionQuality = navigator.onLine ? 'good' : 'offline';
    return;
  }

  if (!navigator.onLine) {
    connectionQuality = 'offline';
  } else if (
    connection.effectiveType === 'slow-2g'
    || connection.effectiveType === '2g'
    || connection.rtt > 500
  ) {
    connectionQuality = 'slow';
  } else {
    connectionQuality = 'good';
  }

  window.dispatchEvent(new CustomEvent('connection-quality-changed', {
    detail: { quality: connectionQuality }
  }));
};

const handleOnline = (): void => {
  isOnline = true;
  updateConnectionQuality();
  processQueue();
  debugLog('[Network] Connection restored, processing queued requests');
};

const handleOffline = (): void => {
  isOnline = false;
  connectionQuality = 'offline';
  window.dispatchEvent(new CustomEvent('connection-quality-changed', {
    detail: { quality: 'offline' }
  }));
  debugLog('[Network] Connection lost');
};

const calculateBackoff = (retryCount: number, config: RetryConfig): number => {
  return Math.min(
    config.baseDelay * Math.pow(2, retryCount) + Math.random() * 1000,
    config.maxDelay
  );
};

const isRetryableError = (error: Error | Response, config: RetryConfig): boolean => {
  if (error instanceof Response) {
    return config.retryableStatuses.includes(error.status);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) return true;

  if (error instanceof Error && error.name === 'AbortError') return false;

  return false;
};

export const resilientFetch = async (
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> => {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  if (!isOnline) {
    return queueRequest(url, options);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = connectionQuality === 'slow' ? 60000 : 30000;
    const controller = new AbortController();

    try {
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: options.signal ? options.signal : controller.signal,
      });

      if (!isRetryableError(response, fullConfig)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);

      if (attempt < fullConfig.maxRetries) {
        const backoffTime = calculateBackoff(attempt, fullConfig);
        debugLog(`[Network] Retry ${attempt + 1}/${fullConfig.maxRetries} in ${backoffTime}ms`);
        await delay(backoffTime);
      }
    } catch (error) {
      lastError = error as Error;

      if (!isOnline || !isRetryableError(error as Error, fullConfig)) {
        throw error;
      }

      if (attempt < fullConfig.maxRetries) {
        const backoffTime = calculateBackoff(attempt, fullConfig);
        debugLog(`[Network] Retry ${attempt + 1}/${fullConfig.maxRetries} in ${backoffTime}ms`);
        await delay(backoffTime);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  throw lastError || new Error('Maximum retries exceeded');
};

const queueRequest = (url: string, options: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      url,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      resolve,
      reject,
    };

    requestQueue.push(request);
    saveQueueToStorage();
    debugLog(`[Network] Request queued: ${sanitizeLogUrl(url)}`);
  });
};

const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || requestQueue.length === 0 || !isOnline) {
    return;
  }

  isProcessingQueue = true;

  try {
    while (requestQueue.length > 0 && isOnline) {
      const request = requestQueue[0];

      if (Date.now() - request.timestamp > MAX_QUEUED_AGE_MS) {
        requestQueue.shift();
        request.reject(new Error('Request expired'));
        saveQueueToStorage();
        continue;
      }

      try {
        const response = await fetch(request.url, request.options);

        if (response.ok) {
          requestQueue.shift();
          request.resolve(response);
          saveQueueToStorage();
          continue;
        }

        const retryable = isRetryableError(response, DEFAULT_RETRY_CONFIG);
        request.retryCount += 1;

        if (!retryable || request.retryCount >= MAX_QUEUED_RETRIES) {
          requestQueue.shift();
          request.reject(new Error(`HTTP ${response.status}`));
          saveQueueToStorage();
          continue;
        }

        debugLog(
          `[Network] Retrying queued request ${request.id} after failure (attempt ${request.retryCount})`
        );
        await delay(calculateBackoff(request.retryCount, DEFAULT_RETRY_CONFIG));
      } catch (error) {
        request.retryCount += 1;
        if (!isOnline || request.retryCount >= MAX_QUEUED_RETRIES) {
          requestQueue.shift();
          request.reject(error as Error);
          saveQueueToStorage();
          continue;
        }

        debugLog(
          `[Network] Retrying queued request ${request.id} after failure (attempt ${request.retryCount})`
        );
        await delay(calculateBackoff(request.retryCount, DEFAULT_RETRY_CONFIG));
      }
    }
  } finally {
    isProcessingQueue = false;
  }
};

const restoreQueueFromStorage = (): void => {
  if (typeof localStorage === 'undefined' || isNetworkQueueRestored) return;

  isNetworkQueueRestored = true;

  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    requestQueue = parsed
      .map((item): QueuedRequest | null => {
        if (!item || typeof item !== 'object') return null;

        const candidate = item as {
          id?: unknown;
          url?: unknown;
          options?: {
            method?: unknown;
            headers?: Record<string, string>;
            body?: string | null;
          };
          retryCount?: unknown;
          timestamp?: unknown;
        };

        if (typeof candidate.id !== 'string' || typeof candidate.url !== 'string') return null;

        const timestamp =
          typeof candidate.timestamp === 'number' && Number.isFinite(candidate.timestamp)
            ? candidate.timestamp
            : Date.now();

        return {
          id: candidate.id,
          url: candidate.url,
          options: {
            method: typeof candidate.options?.method === 'string' ? candidate.options.method : 'GET',
            headers:
              candidate.options && typeof candidate.options.headers === 'object'
                ? candidate.options.headers
                : undefined,
            body:
              candidate.options && typeof candidate.options.body === 'string'
                ? candidate.options.body
                : undefined,
          },
          retryCount:
            typeof candidate.retryCount === 'number' && Number.isFinite(candidate.retryCount)
              ? candidate.retryCount
              : 0,
          timestamp,
          resolve: () => {},
          reject: () => {},
        };
      })
      .filter((entry): entry is QueuedRequest => !!entry);

    if (!requestQueue.length) return;

    requestQueue = requestQueue.filter(request => Date.now() - request.timestamp <= MAX_QUEUED_AGE_MS);
    if (!requestQueue.length) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return;
    }

    debugLog(`[Network] Restored queued requests from storage: ${requestQueue.length}`);
  } catch {
    debugLog('[Network] Failed to restore request queue');
    requestQueue = [];
  }
};

const saveQueueToStorage = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;

    if (requestQueue.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return;
    }

    const queueData = requestQueue.map(r => ({
      id: r.id,
      url: r.url,
      options: {
        method: r.options.method,
        headers: sanitizeHeaders(r.options.headers),
        body: getPersistedBody(r.options.body),
      },
      retryCount: r.retryCount,
      timestamp: r.timestamp,
    }));

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueData));
  } catch {
    debugLog('[Network] Failed to persist request queue');
  }
};

export const getConnectionStatus = (): {
  isOnline: boolean;
  quality: 'good' | 'slow' | 'offline';
  queuedRequests: number;
} => ({
  isOnline,
  quality: connectionQuality,
  queuedRequests: requestQueue.length,
});

export const getOptimalImageQuality = (): 'high' | 'medium' | 'low' => {
  switch (connectionQuality) {
    case 'good':
      return 'high';
    case 'slow':
      return 'medium';
    case 'offline':
      return 'low';
    default:
      return 'medium';
  }
};

export const getOptimalTimeout = (): number => {
  switch (connectionQuality) {
    case 'good':
      return 30000;
    case 'slow':
      return 60000;
    case 'offline':
      return 0;
    default:
      return 45000;
  }
};

export const batchRequests = async <T>(
  requests: Array<() => Promise<T>>,
  concurrency: number = connectionQuality === 'slow' ? 2 : 4
): Promise<Array<T | Error>> => {
  const results: Array<T | Error> = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn => fn()));

    results.push(
      ...batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      )
    );
  }

  return results;
};

export const preloadWhenIdle = (urls: string[]): void => {
  if (connectionQuality !== 'good') return;

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      });
    });
  }
};

if (typeof window !== 'undefined') {
  initNetworkMonitoring();
}

export default {
  resilientFetch,
  getConnectionStatus,
  getOptimalImageQuality,
  getOptimalTimeout,
  batchRequests,
  preloadWhenIdle,
};