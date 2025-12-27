/**
 * PWAInstallPrompt - PWA 설치 프롬프트 컴포넌트
 * 앱 설치 유도 배너 표시
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { useI18n } from '../i18n/useI18n';
import { Analytics } from '../services/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = memo(function PWAInstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // 설치 프롬프트 이벤트 캡처
  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // localStorage에서 dismissal 확인
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        return; // 일주일 동안 다시 표시하지 않음
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 약간의 딜레이 후 표시 (UX 개선)
      setTimeout(() => setIsVisible(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      Analytics.pwaInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 설치 버튼 클릭
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        Analytics.pwaInstalled();
      }

      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }, [deferredPrompt]);

  // 닫기 버튼 클릭
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  }, []);

  // 표시 조건
  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up safe-area-bottom"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <div className="mx-4 mb-4 bg-white rounded-2xl shadow-toss-lg border border-[#e5e8eb] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3182f6] to-[#6b5ce7] rounded-xl flex items-center justify-center text-2xl shadow-md">
              💇
            </div>
            <div>
              <h3 id="pwa-install-title" className="text-[15px] font-semibold text-[#191f28]">
                {t('install_app') || 'LookSim 앱 설치'}
              </h3>
              <p id="pwa-install-desc" className="text-[13px] text-[#8b95a1] mt-0.5">
                {t('install_app_desc') || '홈 화면에 추가하고 더 빠르게 사용하세요'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 -mr-1 -mt-1 text-[#b0b8c1] hover:text-[#6b7684] transition-colors"
            aria-label={t('close') || '닫기'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-2 p-4 pt-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 text-[14px] font-medium text-[#6b7684] bg-[#f2f4f6] rounded-xl transition-colors hover:bg-[#e5e8eb]"
          >
            {t('later') || '나중에'}
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-3 text-[14px] font-semibold text-white bg-[#3182f6] rounded-xl transition-colors hover:bg-[#1b64da] flex items-center justify-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v8m0 0l3-3m-3 3L5 7m-3 5h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('install') || '설치하기'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PWAInstallPrompt;
