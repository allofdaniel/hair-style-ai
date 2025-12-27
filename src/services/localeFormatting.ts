/**
 * 로케일 포맷팅 서비스
 * - 날짜/시간 형식 (각 지역별)
 * - 숫자 형식 (천 단위 구분자, 소수점)
 * - 통화 형식
 * - 상대 시간 (1분 전, 2시간 전 등)
 * - 지역별 첫 번째 요일 설정
 */

import type { Language } from '../i18n/translations';

// 언어 코드를 로케일 코드로 매핑
const LOCALE_MAP: Record<Language, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  es: 'es-ES',
  pt: 'pt-BR',  // 브라질이 남미에서 가장 큰 시장
  fr: 'fr-FR',
  de: 'de-DE',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  hi: 'hi-IN',
  ar: 'ar-SA',
};

// 지역별 첫 번째 요일 (0 = 일요일, 1 = 월요일)
const FIRST_DAY_OF_WEEK: Record<Language, 0 | 1 | 6> = {
  ko: 0,  // 일요일
  en: 0,  // 일요일 (미국)
  zh: 1,  // 월요일
  ja: 0,  // 일요일
  es: 1,  // 월요일
  pt: 0,  // 일요일
  fr: 1,  // 월요일
  de: 1,  // 월요일
  th: 0,  // 일요일
  vi: 1,  // 월요일
  id: 0,  // 일요일
  hi: 0,  // 일요일
  ar: 6,  // 토요일 (이슬람 주간)
};

// 통화 코드
const CURRENCY_MAP: Record<Language, string> = {
  ko: 'KRW',
  en: 'USD',
  zh: 'CNY',
  ja: 'JPY',
  es: 'EUR',
  pt: 'BRL',
  fr: 'EUR',
  de: 'EUR',
  th: 'THB',
  vi: 'VND',
  id: 'IDR',
  hi: 'INR',
  ar: 'SAR',
};

/**
 * 로케일 코드 가져오기
 */
export const getLocale = (language: Language): string => {
  return LOCALE_MAP[language] || 'en-US';
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (
  date: Date | string | number,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
};

/**
 * 짧은 날짜 포맷팅 (YYYY/MM/DD 또는 지역별)
 */
export const formatShortDate = (
  date: Date | string | number,
  language: Language
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * 시간 포맷팅
 */
export const formatTime = (
  date: Date | string | number,
  language: Language,
  options?: {
    hour12?: boolean;
    showSeconds?: boolean;
  }
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);

  // 지역별 12시간/24시간 형식 기본값
  const uses12Hour: Record<Language, boolean> = {
    ko: false,
    en: true,
    zh: false,
    ja: false,
    es: false,
    pt: false,
    fr: false,
    de: false,
    th: false,
    vi: false,
    id: false,
    hi: true,
    ar: true,
  };

  const hour12 = options?.hour12 ?? uses12Hour[language];

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: options?.showSeconds ? '2-digit' : undefined,
    hour12,
  }).format(dateObj);
};

/**
 * 날짜와 시간 함께 포맷팅
 */
export const formatDateTime = (
  date: Date | string | number,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
};

/**
 * 상대 시간 포맷팅 (1분 전, 2시간 전 등)
 */
export const formatRelativeTime = (
  date: Date | string | number,
  language: Language
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  });

  // 시간 단위 결정
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-Math.round(diffInSeconds), 'second');
  }

  const diffInMinutes = diffInSeconds / 60;
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(-Math.round(diffInMinutes), 'minute');
  }

  const diffInHours = diffInMinutes / 60;
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(-Math.round(diffInHours), 'hour');
  }

  const diffInDays = diffInHours / 24;
  if (Math.abs(diffInDays) < 7) {
    return rtf.format(-Math.round(diffInDays), 'day');
  }

  const diffInWeeks = diffInDays / 7;
  if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(-Math.round(diffInWeeks), 'week');
  }

  const diffInMonths = diffInDays / 30;
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(-Math.round(diffInMonths), 'month');
  }

  const diffInYears = diffInDays / 365;
  return rtf.format(-Math.round(diffInYears), 'year');
};

/**
 * 숫자 포맷팅 (천 단위 구분자)
 */
export const formatNumber = (
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string => {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, options).format(value);
};

/**
 * 백분율 포맷팅
 */
export const formatPercent = (
  value: number,
  language: Language,
  decimals: number = 0
): string => {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * 통화 포맷팅
 */
export const formatCurrency = (
  value: number,
  language: Language,
  currencyCode?: string
): string => {
  const locale = getLocale(language);
  const currency = currencyCode || CURRENCY_MAP[language] || 'USD';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * 컴팩트 숫자 포맷팅 (1K, 1M 등)
 */
export const formatCompactNumber = (
  value: number,
  language: Language
): string => {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (
  bytes: number,
  language: Language
): string => {
  const locale = getLocale(language);

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(size);

  return `${formattedNumber} ${units[unitIndex]}`;
};

/**
 * 요일 이름 가져오기
 */
export const getWeekdayNames = (
  language: Language,
  format: 'long' | 'short' | 'narrow' = 'short'
): string[] => {
  const locale = getLocale(language);
  const firstDay = FIRST_DAY_OF_WEEK[language];

  // 일주일 날짜 생성 (2024년 1월 첫째 주 기준)
  const weekdays: string[] = [];
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });

  for (let i = 0; i < 7; i++) {
    // 2024년 1월 7일은 일요일
    const dayOffset = (i + firstDay) % 7;
    const date = new Date(2024, 0, 7 + dayOffset);
    weekdays.push(formatter.format(date));
  }

  return weekdays;
};

/**
 * 월 이름 가져오기
 */
export const getMonthNames = (
  language: Language,
  format: 'long' | 'short' | 'narrow' = 'long'
): string[] => {
  const locale = getLocale(language);
  const months: string[] = [];
  const formatter = new Intl.DateTimeFormat(locale, { month: format });

  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    months.push(formatter.format(date));
  }

  return months;
};

/**
 * 첫 번째 요일 가져오기 (0 = 일요일)
 */
export const getFirstDayOfWeek = (language: Language): 0 | 1 | 6 => {
  return FIRST_DAY_OF_WEEK[language];
};

/**
 * 타임존 정보 가져오기
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * 특정 타임존으로 시간 변환
 */
export const formatInTimezone = (
  date: Date | string | number,
  language: Language,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const locale = getLocale(language);
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: timezone,
  }).format(dateObj);
};

/**
 * 기간 포맷팅 (예: 2시간 30분)
 */
export const formatDuration = (
  seconds: number,
  language: Language,
  options?: {
    showSeconds?: boolean;
    compact?: boolean;
  }
): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const locale = getLocale(language);

  // 컴팩트 모드
  if (options?.compact) {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return options.showSeconds ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${secs}s`;
  }

  // Intl.DurationFormat이 지원되면 사용 (일부 브라우저에서만)
  if ('DurationFormat' in Intl) {
    try {
      const duration: { hours?: number; minutes?: number; seconds?: number } = {};
      if (hours > 0) duration.hours = hours;
      if (minutes > 0) duration.minutes = minutes;
      if (options?.showSeconds && secs > 0) duration.seconds = secs;

      // @ts-expect-error DurationFormat is not yet in TypeScript types
      return new Intl.DurationFormat(locale, { style: 'long' }).format(duration);
    } catch {
      // 폴백
    }
  }

  // 폴백: 간단한 형식
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (options?.showSeconds && secs > 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ') || '0m';
};

/**
 * 리스트 포맷팅 (A, B, and C 형식)
 */
export const formatList = (
  items: string[],
  language: Language,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string => {
  const locale = getLocale(language);

  if ('ListFormat' in Intl) {
    return new (Intl as unknown as { ListFormat: new (locale: string, options: { style: string; type: string }) => { format: (items: string[]) => string } }).ListFormat(locale, {
      style: 'long',
      type,
    }).format(items);
  }

  // 폴백
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) {
    const connector = type === 'conjunction' ? ' and ' : ' or ';
    return items.join(connector);
  }

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  const connector = type === 'conjunction' ? ', and ' : ', or ';
  return otherItems.join(', ') + connector + lastItem;
};

export default {
  getLocale,
  formatDate,
  formatShortDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  formatCurrency,
  formatCompactNumber,
  formatFileSize,
  getWeekdayNames,
  getMonthNames,
  getFirstDayOfWeek,
  getUserTimezone,
  formatInTimezone,
  formatDuration,
  formatList,
};
