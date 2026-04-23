import { logger } from './logger';
/**
 * ?묎렐???쒕퉬?? * - ?ㅽ겕由?由щ뜑 吏?? * - ?ㅻ낫???ㅻ퉬寃뚯씠?? * - ?ъ빱??愿由? * - 媛먯냼???숈옉 吏?? */

/**
 * ?ㅽ겕由?由щ뜑瑜??꾪븳 ?쇱씠釉??곸뿭 ?뚮┝
 */
const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  // 湲곗〈 ?쇱씠釉??곸뿭 李얘린 ?먮뒗 ?앹꽦
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

  // 硫붿떆吏 ?낅뜲?댄듃 (鍮꾩썙議뚮떎媛 ?ㅼ떆 梨꾩썙?몄빞 ?ㅽ겕由?由щ뜑媛 ?쎌쓬)
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * ?ㅻ낫???ъ빱???몃옪 (紐⑤떖??
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

  // ?뺣━ ?⑥닔 諛섑솚
  return () => {
    element.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * ?댁쟾 ?ъ빱?????諛?蹂듭썝
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
 * 媛먯냼???숈옉 誘몃뵒??荑쇰━ ?뺤씤
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 媛먯냼???숈옉 蹂寃?媛먯?
 */
export function watchReducedMotion(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', handler);

  // 珥덇린媛??몄텧
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * 怨좊?鍮?紐⑤뱶 ?뺤씤
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * ?ㅽ겕 紐⑤뱶 ?뺤씤
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * ?ㅽ겕 紐⑤뱶 蹂寃?媛먯?
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
 * ?ъ빱???쒖떆 ?ㅽ???愿由? * 留덉슦???ъ슜?먯뿉寃뚮뒗 ?ъ빱??留??④린怨? ?ㅻ낫???ъ슜?먯뿉寃뚮쭔 ?쒖떆
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

  // CSS ?ㅽ???異붽?
  const style = document.createElement('style');
  style.textContent = `
    /* 湲곕낯 ?ъ빱???ㅽ????쒓굅 (?ㅻ낫???ъ슜???? */
    :focus:not([data-focus-visible]) {
      outline: none;
    }

    /* ?ㅻ낫???ъ슜?먯슜 ?ъ빱???ㅽ???*/
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
 * ?ㅽ궢 留곹겕 ?ㅼ젙
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
 * ?묎렐??珥덇린?? */
export function initAccessibility(): void {
  if (typeof window === 'undefined') return;

  setupFocusVisible();
  setupSkipLinks();

  // 媛먯냼???숈옉 紐⑤뱶?먯꽌 ?좊땲硫붿씠??鍮꾪솢?깊솕
  watchReducedMotion((prefersReduced) => {
    document.documentElement.classList.toggle('reduce-motion', prefersReduced);
  });

  // 怨좊?鍮?紐⑤뱶 ?대옒??異붽?
  if (prefersHighContrast()) {
    document.documentElement.classList.add('high-contrast');
  }
}

/**
 * ARIA ?띿꽦 ?ы띁
 */
export const ariaHelpers = {
  // 踰꾪듉???뚮┛ ?곹깭
  setPressed: (element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', String(pressed));
  },

  // ?뺤옣/異뺤냼 ?곹깭
  setExpanded: (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', String(expanded));
  },

  // ?좏깮???곹깭
  setSelected: (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', String(selected));
  },

  // 鍮꾪솢?깊솕 ?곹깭
  setDisabled: (element: HTMLElement, disabled: boolean) => {
    element.setAttribute('aria-disabled', String(disabled));
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  },

  // 濡쒕뵫 ?곹깭
  setBusy: (element: HTMLElement, busy: boolean) => {
    element.setAttribute('aria-busy', String(busy));
  },

  // ?꾩옱 ?곹깭 (?ㅻ퉬寃뚯씠??
  setCurrent: (element: HTMLElement, current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false') => {
    element.setAttribute('aria-current', current);
  },

  // ?먮윭 ?곹깭
  setInvalid: (element: HTMLElement, invalid: boolean, errorMessage?: string) => {
    element.setAttribute('aria-invalid', String(invalid));
    if (errorMessage) {
      const errorId = `${element.id || 'field'}-error`;
      element.setAttribute('aria-describedby', errorId);
    }
  },

  // ?쇰꺼 ?곌껐
  setLabelledBy: (element: HTMLElement, labelId: string) => {
    element.setAttribute('aria-labelledby', labelId);
  },

  // ?ㅻ챸 ?곌껐
  setDescribedBy: (element: HTMLElement, descriptionId: string) => {
    element.setAttribute('aria-describedby', descriptionId);
  },

  // ?④? ?곹깭
  setHidden: (element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', String(hidden));
  },
};

/**
 * ?묎렐???뚯뒪???꾩슦誘?(媛쒕컻 紐⑤뱶??
 */
export function runA11yAudit(): void {
  if (!import.meta.env.DEV) return;

  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    logger.warn('[A11y] Images without alt attribute:', imagesWithoutAlt);
  }

  const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
  interactiveElements.forEach((el) => {
    const hasAccessibleName =
      el.textContent?.trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('title');

    if (!hasAccessibleName) {
      logger.warn('[A11y] Interactive element without accessible name:', el);
    }
  });

  const formFields = document.querySelectorAll('input, select, textarea');
  formFields.forEach((field) => {
    const id = field.getAttribute('id');
    const hasLabel =
      field.getAttribute('aria-label') ||
      field.getAttribute('aria-labelledby') ||
      (id && document.querySelector(`label[for="${id}"]`));

    if (!hasLabel) {
      logger.warn('[A11y] Form field without label:', field);
    }
  });

  // ?됱긽 ?鍮?寃쎄퀬 (湲곕낯?곸씤 泥댄겕留?
  const lowContrastElements = document.querySelectorAll('[style*="color"]');
  if (lowContrastElements.length > 0) {
    logger.info('[A11y] Elements with inline color styles (check contrast manually):', lowContrastElements.length);
  }

  debugLog('[A11y] Audit complete');
}


