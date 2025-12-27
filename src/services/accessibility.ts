/**
 * 접근성 서비스
 * - 스크린 리더 지원
 * - 키보드 네비게이션
 * - 포커스 관리
 * - 감소된 동작 지원
 */

/**
 * 스크린 리더를 위한 라이브 영역 알림
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  // 기존 라이브 영역 찾기 또는 생성
  let liveRegion = document.getElementById('sr-live-region');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(liveRegion);
  }

  // 메시지 업데이트 (비워졌다가 다시 채워져야 스크린 리더가 읽음)
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * 키보드 포커스 트랩 (모달용)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeydown);
  firstFocusable?.focus();

  // 정리 함수 반환
  return () => {
    element.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * 이전 포커스 저장 및 복원
 */
let previouslyFocusedElement: HTMLElement | null = null;

export function saveFocus(): void {
  previouslyFocusedElement = document.activeElement as HTMLElement;
}

export function restoreFocus(): void {
  if (previouslyFocusedElement && previouslyFocusedElement.focus) {
    previouslyFocusedElement.focus();
    previouslyFocusedElement = null;
  }
}

/**
 * 감소된 동작 미디어 쿼리 확인
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 감소된 동작 변경 감지
 */
export function watchReducedMotion(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', handler);

  // 초기값 호출
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * 고대비 모드 확인
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * 다크 모드 확인
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 다크 모드 변경 감지
 */
export function watchDarkMode(callback: (prefersDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', handler);

  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * 포커스 표시 스타일 관리
 * 마우스 사용자에게는 포커스 링 숨기고, 키보드 사용자에게만 표시
 */
export function setupFocusVisible(): () => void {
  if (typeof document === 'undefined') return () => {};

  let hadKeyboardEvent = false;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Escape') {
      hadKeyboardEvent = true;
    }
  };

  const handlePointerdown = () => {
    hadKeyboardEvent = false;
  };

  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (hadKeyboardEvent || target.matches(':focus-visible')) {
      target.setAttribute('data-focus-visible', 'true');
    }
  };

  const handleBlur = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-focus-visible')) {
      target.removeAttribute('data-focus-visible');
    }
  };

  document.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('pointerdown', handlePointerdown, true);
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('blur', handleBlur, true);

  // CSS 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    /* 기본 포커스 스타일 제거 (키보드 사용자 외) */
    :focus:not([data-focus-visible]) {
      outline: none;
    }

    /* 키보드 사용자용 포커스 스타일 */
    [data-focus-visible] {
      outline: 2px solid #3182f6;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.removeEventListener('keydown', handleKeydown, true);
    document.removeEventListener('pointerdown', handlePointerdown, true);
    document.removeEventListener('focus', handleFocus, true);
    document.removeEventListener('blur', handleBlur, true);
    style.remove();
  };
}

/**
 * 스킵 링크 설정
 */
export function setupSkipLinks(): void {
  if (typeof document === 'undefined') return;

  const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
  if (!skipLink) return;

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = skipLink.getAttribute('href')?.substring(1);
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.removeAttribute('tabindex');
    }
  });
}

/**
 * 접근성 초기화
 */
export function initAccessibility(): void {
  if (typeof window === 'undefined') return;

  setupFocusVisible();
  setupSkipLinks();

  // 감소된 동작 모드에서 애니메이션 비활성화
  watchReducedMotion((prefersReduced) => {
    document.documentElement.classList.toggle('reduce-motion', prefersReduced);
  });

  // 고대비 모드 클래스 추가
  if (prefersHighContrast()) {
    document.documentElement.classList.add('high-contrast');
  }
}

/**
 * ARIA 속성 헬퍼
 */
export const ariaHelpers = {
  // 버튼이 눌린 상태
  setPressed: (element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', String(pressed));
  },

  // 확장/축소 상태
  setExpanded: (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', String(expanded));
  },

  // 선택된 상태
  setSelected: (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', String(selected));
  },

  // 비활성화 상태
  setDisabled: (element: HTMLElement, disabled: boolean) => {
    element.setAttribute('aria-disabled', String(disabled));
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  },

  // 로딩 상태
  setBusy: (element: HTMLElement, busy: boolean) => {
    element.setAttribute('aria-busy', String(busy));
  },

  // 현재 상태 (네비게이션)
  setCurrent: (element: HTMLElement, current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false') => {
    element.setAttribute('aria-current', current);
  },

  // 에러 상태
  setInvalid: (element: HTMLElement, invalid: boolean, errorMessage?: string) => {
    element.setAttribute('aria-invalid', String(invalid));
    if (errorMessage) {
      const errorId = `${element.id || 'field'}-error`;
      element.setAttribute('aria-describedby', errorId);
    }
  },

  // 라벨 연결
  setLabelledBy: (element: HTMLElement, labelId: string) => {
    element.setAttribute('aria-labelledby', labelId);
  },

  // 설명 연결
  setDescribedBy: (element: HTMLElement, descriptionId: string) => {
    element.setAttribute('aria-describedby', descriptionId);
  },

  // 숨김 상태
  setHidden: (element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', String(hidden));
  },
};

/**
 * 접근성 테스트 도우미 (개발 모드용)
 */
export function runA11yAudit(): void {
  if (process.env.NODE_ENV !== 'development') return;

  // 이미지 alt 속성 검사
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    console.warn('[A11y] Images without alt attribute:', imagesWithoutAlt);
  }

  // 버튼/링크 접근성 이름 검사
  const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
  interactiveElements.forEach((el) => {
    const hasAccessibleName =
      el.textContent?.trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('title');

    if (!hasAccessibleName) {
      console.warn('[A11y] Interactive element without accessible name:', el);
    }
  });

  // 폼 필드 라벨 검사
  const formFields = document.querySelectorAll('input, select, textarea');
  formFields.forEach((field) => {
    const id = field.getAttribute('id');
    const hasLabel =
      field.getAttribute('aria-label') ||
      field.getAttribute('aria-labelledby') ||
      (id && document.querySelector(`label[for="${id}"]`));

    if (!hasLabel) {
      console.warn('[A11y] Form field without label:', field);
    }
  });

  // 색상 대비 경고 (기본적인 체크만)
  const lowContrastElements = document.querySelectorAll('[style*="color"]');
  if (lowContrastElements.length > 0) {
    console.info('[A11y] Elements with inline color styles (check contrast manually):', lowContrastElements.length);
  }

  console.log('[A11y] Audit complete');
}
