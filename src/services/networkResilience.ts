/**
 * 네트워크 복원력 서비스
 * - 자동 재시도 (지수 백오프)
 * - 요청 큐잉 (오프라인 시)
 * - 연결 상태 감지
 * - 신흥 시장 저속 네트워크 최적화
 */

// 재시도 설정
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;      // 기본 지연 (ms)
  maxDelay: number;       // 최대 지연 (ms)
  retryableStatuses: number[];
}

// 기본 재시도 설정
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// 요청 큐 아이템
interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
}

// 요청 큐
let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

// 연결 상태
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let connectionQuality: 'good' | 'slow' | 'offline' = 'good';

/**
 * 연결 상태 초기화
 */
export const initNetworkMonitoring = (): void => {
  if (typeof window === 'undefined') return;

  // 온라인/오프라인 이벤트 리스너
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Network Information API (지원되는 경우)
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection) {
    connection.addEventListener('change', updateConnectionQuality);
    updateConnectionQuality();
  }
};

interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * 연결 품질 업데이트
 */
const updateConnectionQuality = (): void => {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return;

  if (!navigator.onLine) {
    connectionQuality = 'offline';
  } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.rtt > 500) {
    connectionQuality = 'slow';
  } else {
    connectionQuality = 'good';
  }

  // 연결 품질 변경 이벤트
  window.dispatchEvent(new CustomEvent('connection-quality-changed', {
    detail: { quality: connectionQuality }
  }));
};

/**
 * 온라인 복구 핸들러
 */
const handleOnline = (): void => {
  isOnline = true;
  updateConnectionQuality();

  // 큐에 쌓인 요청 처리
  processQueue();

  console.log('[Network] Connection restored, processing queued requests');
};

/**
 * 오프라인 핸들러
 */
const handleOffline = (): void => {
  isOnline = false;
  connectionQuality = 'offline';

  window.dispatchEvent(new CustomEvent('connection-quality-changed', {
    detail: { quality: 'offline' }
  }));

  console.log('[Network] Connection lost');
};

/**
 * 지수 백오프 계산
 */
const calculateBackoff = (retryCount: number, config: RetryConfig): number => {
  // 지수 백오프 + 지터
  const delay = Math.min(
    config.baseDelay * Math.pow(2, retryCount) + Math.random() * 1000,
    config.maxDelay
  );
  return delay;
};

/**
 * 재시도 가능한 에러인지 확인
 */
const isRetryableError = (error: Error | Response, config: RetryConfig): boolean => {
  // 네트워크 에러
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP 응답
  if (error instanceof Response) {
    return config.retryableStatuses.includes(error.status);
  }

  // AbortError는 재시도하지 않음
  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }

  return false;
};

/**
 * 지연 함수
 */
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 복원력 있는 fetch 함수
 */
export const resilientFetch = async (
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> => {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // 오프라인인 경우 큐에 추가
  if (!isOnline) {
    return queueRequest(url, options);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // 타임아웃 설정 (느린 네트워크 대응)
      const timeout = connectionQuality === 'slow' ? 60000 : 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 성공 또는 재시도 불가능한 응답
      if (response.ok || !isRetryableError(response, fullConfig)) {
        return response;
      }

      // 재시도 가능한 에러
      lastError = new Error(`HTTP ${response.status}`);

    } catch (error) {
      lastError = error as Error;

      // 오프라인이 된 경우 큐에 추가
      if (!navigator.onLine) {
        return queueRequest(url, options);
      }

      // 재시도 불가능한 에러
      if (!isRetryableError(error as Error, fullConfig)) {
        throw error;
      }
    }

    // 마지막 시도가 아니면 백오프 후 재시도
    if (attempt < fullConfig.maxRetries) {
      const backoffTime = calculateBackoff(attempt, fullConfig);
      console.log(`[Network] Retry ${attempt + 1}/${fullConfig.maxRetries} in ${backoffTime}ms`);
      await delay(backoffTime);
    }
  }

  throw lastError || new Error('Maximum retries exceeded');
};

/**
 * 요청 큐에 추가
 */
const queueRequest = (url: string, options: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      resolve,
      reject,
    };

    requestQueue.push(request);

    // LocalStorage에 백업 (앱 재시작 대비)
    saveQueueToStorage();

    console.log(`[Network] Request queued: ${url}`);
  });
};

/**
 * 큐 처리
 */
const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || requestQueue.length === 0 || !isOnline) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0 && isOnline) {
    const request = requestQueue[0];

    // 오래된 요청 삭제 (30분)
    if (Date.now() - request.timestamp > 30 * 60 * 1000) {
      requestQueue.shift();
      request.reject(new Error('Request expired'));
      continue;
    }

    try {
      const response = await fetch(request.url, request.options);
      requestQueue.shift();
      request.resolve(response);
    } catch (error) {
      request.retryCount++;

      if (request.retryCount >= 3) {
        requestQueue.shift();
        request.reject(error as Error);
      } else {
        // 백오프 후 재시도
        await delay(calculateBackoff(request.retryCount, DEFAULT_RETRY_CONFIG));
      }
    }

    saveQueueToStorage();
  }

  isProcessingQueue = false;
};

/**
 * 큐를 LocalStorage에 저장
 */
const saveQueueToStorage = (): void => {
  try {
    const queueData = requestQueue.map(r => ({
      id: r.id,
      url: r.url,
      options: {
        method: r.options.method,
        headers: r.options.headers,
        body: typeof r.options.body === 'string' ? r.options.body : null,
      },
      timestamp: r.timestamp,
    }));
    localStorage.setItem('looksim-request-queue', JSON.stringify(queueData));
  } catch {
    // Storage 에러 무시
  }
};

/**
 * 현재 연결 상태 가져오기
 */
export const getConnectionStatus = (): {
  isOnline: boolean;
  quality: 'good' | 'slow' | 'offline';
  queuedRequests: number;
} => ({
  isOnline,
  quality: connectionQuality,
  queuedRequests: requestQueue.length,
});

/**
 * 이미지 로딩 최적화 (연결 품질에 따라)
 */
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

/**
 * API 요청 타임아웃 (연결 품질에 따라)
 */
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

/**
 * 배치 요청 (여러 요청을 모아서 처리)
 */
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

/**
 * 프리로드 (연결 품질이 좋을 때)
 */
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

// 앱 시작 시 초기화
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
