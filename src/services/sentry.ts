/**
 * Sentry 에러 모니터링 서비스
 * 프로덕션 환경에서 에러 추적 및 성능 모니터링
 */
import * as Sentry from '@sentry/react';

// Sentry DSN (환경변수에서 가져옴)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Sentry 초기화
 */
export const initSentry = (): void => {
  // DSN이 없으면 초기화하지 않음
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, error monitoring disabled');
    return;
  }

  // 개발 환경에서는 기본적으로 비활성화
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SENTRY_DEV) {
    console.log('[Sentry] Disabled in development');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 설정
    environment: import.meta.env.MODE,

    // 릴리즈 버전 (빌드 시 설정)
    release: `looksim@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // 샘플링 비율 (비용 절감을 위해 조정 가능)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 프로덕션에서 10%

    // 프로파일 샘플링
    profilesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // 리플레이 세션 샘플링 (선택적)
    replaysSessionSampleRate: 0.1, // 10% 세션 기록
    replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 기록

    // 통합 설정
    integrations: [
      // 브라우저 트레이싱
      Sentry.browserTracingIntegration({
        // 라우팅 추적
        enableInp: true,
      }),
      // 리플레이 (선택적)
      Sentry.replayIntegration({
        maskAllText: true, // 개인정보 보호
        blockAllMedia: true,
      }),
    ],

    // 에러 필터링
    beforeSend(event, hint) {
      // 개발자 도구 관련 에러 무시
      const error = hint.originalException;
      if (error instanceof Error) {
        // 특정 에러 메시지 필터링
        const ignoredMessages = [
          'ResizeObserver loop',
          'Non-Error promise rejection',
          'Network request failed',
          'Load failed',
          'ChunkLoadError',
        ];

        if (ignoredMessages.some(msg => error.message?.includes(msg))) {
          return null;
        }
      }

      return event;
    },

    // 개인정보 보호
    beforeBreadcrumb(breadcrumb) {
      // 민감한 정보가 포함된 브레드크럼 필터링
      if (breadcrumb.category === 'console') {
        return null; // 콘솔 로그 제외
      }
      return breadcrumb;
    },

    // 민감한 데이터 스크러빙
    denyUrls: [
      // 크롬 확장 프로그램
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // 파이어폭스 확장 프로그램
      /^moz-extension:\/\//i,
    ],
  });
};

/**
 * 사용자 컨텍스트 설정
 */
export const setUserContext = (userId?: string, userData?: Record<string, unknown>): void => {
  if (!SENTRY_DSN) return;

  if (userId) {
    Sentry.setUser({
      id: userId,
      ...userData,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * 커스텀 태그 추가
 */
export const setTags = (tags: Record<string, string>): void => {
  if (!SENTRY_DSN) return;

  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
};

/**
 * 수동 에러 캡처
 */
export const captureError = (error: Error, context?: Record<string, unknown>): void => {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * 커스텀 메시지 캡처
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void => {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * 브레드크럼 추가 (이벤트 로깅)
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

/**
 * 성능 트랜잭션 시작
 */
export const startTransaction = (name: string, op: string): Sentry.Span | undefined => {
  if (!SENTRY_DSN) return undefined;

  return Sentry.startInactiveSpan({
    name,
    op,
  });
};

/**
 * React Error Boundary 컴포넌트 내보내기
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * React 프로파일러 내보내기
 */
export const withSentryProfiler = Sentry.withProfiler;

// 앱 특화 에러 캡처 헬퍼
export const SentryHelpers = {
  // 시뮬레이션 에러
  captureSimulationError: (type: string, error: Error, metadata?: Record<string, unknown>) => {
    captureError(error, {
      type: 'simulation_error',
      simulationType: type,
      ...metadata,
    });
  },

  // API 에러
  captureApiError: (endpoint: string, error: Error, statusCode?: number) => {
    captureError(error, {
      type: 'api_error',
      endpoint,
      statusCode,
    });
  },

  // 이미지 처리 에러
  captureImageError: (operation: string, error: Error) => {
    captureError(error, {
      type: 'image_error',
      operation,
    });
  },

  // 네트워크 에러
  captureNetworkError: (url: string, error: Error) => {
    captureError(error, {
      type: 'network_error',
      url,
    });
  },
};

export default {
  init: initSentry,
  setUserContext,
  setTags,
  captureError,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  ErrorBoundary: SentryErrorBoundary,
  withProfiler: withSentryProfiler,
  helpers: SentryHelpers,
};
