import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, languages, type Language, type TranslationKey } from './translations';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: () => boolean;
  getDir: () => 'rtl' | 'ltr';
}

// RTL 언어 목록
const RTL_LANGUAGES: Language[] = ['ar'];

// 브라우저 언어 감지
const detectBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs: Language[] = ['en', 'ko', 'ja', 'zh', 'es', 'pt', 'fr', 'de', 'th', 'vi', 'id', 'hi', 'ar'];
  return supportedLangs.includes(browserLang as Language) ? (browserLang as Language) : 'en';
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: detectBrowserLanguage(), // 영어 기본, 브라우저 언어 자동 감지
      setLanguage: (lang) => {
        set({ language: lang });
        // DOM에 RTL 속성 즉시 적용
        const isRtl = RTL_LANGUAGES.includes(lang);
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
      t: (key) => {
        const { language } = get();
        const langTranslations = translations[language] as Record<string, string>;
        const enTranslations = translations.en as Record<string, string>;
        return langTranslations?.[key] || enTranslations[key] || key;
      },
      isRTL: () => RTL_LANGUAGES.includes(get().language),
      getDir: () => RTL_LANGUAGES.includes(get().language) ? 'rtl' : 'ltr',
    }),
    {
      name: 'hair-style-i18n',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        // 앱 시작 시 저장된 언어 설정 복원
        if (state?.language) {
          const isRtl = RTL_LANGUAGES.includes(state.language);
          document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);

// Helper hook for getting translations
export const useTranslation = () => {
  const { language, t, setLanguage, isRTL, getDir } = useI18n();
  return { language, t, setLanguage, isRTL: isRTL(), dir: getDir() };
};

// 언어 목록 및 타입 export
export { languages };
export type { Language, TranslationKey };
