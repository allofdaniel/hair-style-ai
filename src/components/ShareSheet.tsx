/**
 * 공유 시트 컴포넌트
 * - Web Share API 지원
 * - 폴백: SNS 직접 공유 링크
 * - 이미지 다운로드
 * - 다국어 지원
 */

import { useState, useEffect, useRef } from 'react';
import { useI18n, type Language } from '../i18n/useI18n';
import { Analytics } from '../services/analytics';

// 공유 텍스트 (다국어)
const SHARE_TEXTS: Record<Language, Record<string, string>> = {
  ko: {
    title: '공유하기',
    share_image: '이미지 저장',
    share_link: '링크 복사',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: '복사됨!',
    saved: '저장됨!',
    share_message: 'AI로 새로운 헤어스타일을 체험해보세요! #LookSim',
    cancel: '취소',
  },
  en: {
    title: 'Share',
    share_image: 'Save Image',
    share_link: 'Copy Link',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Copied!',
    saved: 'Saved!',
    share_message: 'Try new hairstyles with AI! #LookSim',
    cancel: 'Cancel',
  },
  zh: {
    title: '分享',
    share_image: '保存图片',
    share_link: '复制链接',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: '已复制！',
    saved: '已保存！',
    share_message: '用AI尝试新发型！#LookSim',
    cancel: '取消',
  },
  ja: {
    title: '共有',
    share_image: '画像を保存',
    share_link: 'リンクをコピー',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'コピーしました！',
    saved: '保存しました！',
    share_message: 'AIで新しいヘアスタイルを試そう！#LookSim',
    cancel: 'キャンセル',
  },
  es: {
    title: 'Compartir',
    share_image: 'Guardar Imagen',
    share_link: 'Copiar Enlace',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: '¡Copiado!',
    saved: '¡Guardado!',
    share_message: '¡Prueba nuevos peinados con IA! #LookSim',
    cancel: 'Cancelar',
  },
  pt: {
    title: 'Compartilhar',
    share_image: 'Salvar Imagem',
    share_link: 'Copiar Link',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Copiado!',
    saved: 'Salvo!',
    share_message: 'Experimente novos penteados com IA! #LookSim',
    cancel: 'Cancelar',
  },
  fr: {
    title: 'Partager',
    share_image: 'Enregistrer Image',
    share_link: 'Copier Lien',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Copié !',
    saved: 'Enregistré !',
    share_message: 'Essayez de nouvelles coiffures avec l\'IA ! #LookSim',
    cancel: 'Annuler',
  },
  de: {
    title: 'Teilen',
    share_image: 'Bild Speichern',
    share_link: 'Link Kopieren',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Kopiert!',
    saved: 'Gespeichert!',
    share_message: 'Probiere neue Frisuren mit KI! #LookSim',
    cancel: 'Abbrechen',
  },
  th: {
    title: 'แชร์',
    share_image: 'บันทึกรูป',
    share_link: 'คัดลอกลิงก์',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'คัดลอกแล้ว!',
    saved: 'บันทึกแล้ว!',
    share_message: 'ลองทรงผมใหม่ด้วย AI! #LookSim',
    cancel: 'ยกเลิก',
  },
  vi: {
    title: 'Chia sẻ',
    share_image: 'Lưu Ảnh',
    share_link: 'Sao Chép Link',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Đã sao chép!',
    saved: 'Đã lưu!',
    share_message: 'Thử kiểu tóc mới với AI! #LookSim',
    cancel: 'Hủy',
  },
  id: {
    title: 'Bagikan',
    share_image: 'Simpan Gambar',
    share_link: 'Salin Link',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'Disalin!',
    saved: 'Disimpan!',
    share_message: 'Coba gaya rambut baru dengan AI! #LookSim',
    cancel: 'Batal',
  },
  hi: {
    title: 'शेयर करें',
    share_image: 'इमेज सेव करें',
    share_link: 'लिंक कॉपी करें',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'कॉपी हो गया!',
    saved: 'सेव हो गया!',
    share_message: 'AI से नया हेयरस्टाइल ट्राई करें! #LookSim',
    cancel: 'रद्द करें',
  },
  ar: {
    title: 'مشاركة',
    share_image: 'حفظ الصورة',
    share_link: 'نسخ الرابط',
    share_instagram: 'Instagram',
    share_facebook: 'Facebook',
    share_twitter: 'X (Twitter)',
    share_whatsapp: 'WhatsApp',
    share_kakao: 'KakaoTalk',
    share_line: 'LINE',
    copied: 'تم النسخ!',
    saved: 'تم الحفظ!',
    share_message: 'جرب تسريحات جديدة بالذكاء الاصطناعي! #LookSim',
    cancel: 'إلغاء',
  },
};

// 앱 URL
const APP_URL = 'https://looksim.app';

interface ShareSheetProps {
  imageUrl?: string;
  styleName?: string;
  onClose: () => void;
}

export default function ShareSheet({ imageUrl, styleName, onClose }: ShareSheetProps) {
  const { language } = useI18n();
  const texts = SHARE_TEXTS[language] || SHARE_TEXTS.en;
  const [feedback, setFeedback] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // RTL 언어 지원
  const isRtl = language === 'ar';

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 포커스 트랩
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusableElements = sheet.querySelectorAll<HTMLElement>(
      'button, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    sheet.addEventListener('keydown', handleTab);
    return () => sheet.removeEventListener('keydown', handleTab);
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2000);
  };

  // Web Share API 지원 확인
  const canUseWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // 공유 메시지에 스타일 이름 포함
  const getShareMessage = () => {
    if (styleName) {
      return `${texts.share_message.replace('#LookSim', '')}${styleName} #LookSim`;
    }
    return texts.share_message;
  };

  // 이미지 저장
  const handleSaveImage = async () => {
    if (!imageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      // styleName이 있으면 파일명에 포함
      const safeStyleName = styleName?.replace(/[^a-zA-Z0-9가-힣]/g, '-') || '';
      link.download = safeStyleName
        ? `looksim-${safeStyleName}-${Date.now()}.png`
        : `looksim-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showFeedback(texts.saved);
      Analytics.resultSaved('image');
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      showFeedback(texts.copied);
      Analytics.resultShared('copy_link');
    } catch (error) {
      // 폴백: 구형 브라우저
      const textArea = document.createElement('textarea');
      textArea.value = APP_URL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showFeedback(texts.copied);
    }
  };

  // 네이티브 공유
  const handleNativeShare = async () => {
    if (!canUseWebShare) return;

    try {
      const shareMessage = getShareMessage();
      const shareData: ShareData = {
        title: 'LookSim - AI Hair Simulator',
        text: shareMessage,
        url: APP_URL,
      };

      // 이미지가 있으면 파일로 공유
      if (imageUrl && 'files' in navigator) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const safeStyleName = styleName?.replace(/[^a-zA-Z0-9가-힣]/g, '-') || 'hairstyle';
        const file = new File([blob], `looksim-${safeStyleName}.png`, { type: 'image/png' });
        shareData.files = [file];
      }

      await navigator.share(shareData);
      Analytics.resultShared('native');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  // SNS 공유 함수들
  const shareMessage = getShareMessage();

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}&quote=${encodeURIComponent(shareMessage)}`,
      '_blank',
      'width=600,height=400'
    );
    Analytics.resultShared('facebook');
    onClose();
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(APP_URL)}`,
      '_blank',
      'width=600,height=400'
    );
    Analytics.resultShared('twitter');
    onClose();
  };

  const shareToWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${APP_URL}`)}`,
      '_blank'
    );
    Analytics.resultShared('whatsapp');
    onClose();
  };

  const shareToLine = () => {
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(`${shareMessage} ${APP_URL}`)}`,
      '_blank'
    );
    Analytics.resultShared('line');
    onClose();
  };

  const shareToKakao = () => {
    // KakaoTalk SDK가 필요하지만, 간단한 링크 공유로 대체
    window.open(
      `https://story.kakao.com/share?url=${encodeURIComponent(APP_URL)}`,
      '_blank'
    );
    Analytics.resultShared('kakao');
    onClose();
  };

  // Instagram 공유 (이미지 저장 후 안내)
  const shareToInstagram = async () => {
    if (imageUrl) {
      await handleSaveImage();
      // Instagram은 직접 공유 API가 없어서 이미지 저장 후 앱으로 이동
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isIOS || isAndroid) {
        window.open('instagram://camera', '_blank');
      } else {
        window.open('https://www.instagram.com/', '_blank');
      }
    }
    Analytics.resultShared('instagram');
    onClose();
  };

  // 지역별 SNS 버튼
  const getSnsButtons = () => {
    const buttons: Array<{ id: string; icon: string; color: string; action: () => void; label: string }> = [
      { id: 'instagram', icon: '📸', color: '#E4405F', action: shareToInstagram, label: 'Instagram' },
      { id: 'whatsapp', icon: '💬', color: '#25D366', action: shareToWhatsApp, label: 'WhatsApp' },
      { id: 'facebook', icon: '📘', color: '#1877F2', action: shareToFacebook, label: 'Facebook' },
      { id: 'twitter', icon: '🐦', color: '#1DA1F2', action: shareToTwitter, label: 'X (Twitter)' },
    ];

    // 아시아 지역은 LINE, KakaoTalk 추가
    if (['ko'].includes(language)) {
      buttons.unshift({ id: 'kakao', icon: '💛', color: '#FEE500', action: shareToKakao, label: 'KakaoTalk' });
    }
    if (['ja', 'th'].includes(language)) {
      buttons.unshift({ id: 'line', icon: '💚', color: '#00B900', action: shareToLine, label: 'LINE' });
    }

    return buttons;
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={`absolute bottom-0 inset-x-0 bg-white rounded-t-3xl animate-slide-up safe-area-bottom ${isRtl ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[#e5e8eb] rounded-full" />
        </div>

        {/* 제목 */}
        <h3
          id="share-sheet-title"
          className="text-[18px] font-semibold text-[#191f28] text-center pb-4"
        >
          {texts.title}
        </h3>

        {/* 피드백 토스트 */}
        {feedback && (
          <div className="absolute top-4 inset-x-4 bg-[#191f28] text-white text-[14px] text-center py-3 rounded-xl animate-fade-in">
            {feedback}
          </div>
        )}

        {/* 주요 액션 */}
        <div className="px-6 pb-4 flex gap-3">
          {imageUrl && (
            <button
              onClick={handleSaveImage}
              className="flex-1 flex flex-col items-center gap-2 py-4 bg-[#f2f4f6] rounded-2xl active:bg-[#e5e8eb] transition-colors"
              aria-label={texts.share_image}
            >
              <div className="w-12 h-12 bg-[#3182f6] rounded-full flex items-center justify-center" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span className="text-[13px] text-[#4e5968]">{texts.share_image}</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="flex-1 flex flex-col items-center gap-2 py-4 bg-[#f2f4f6] rounded-2xl active:bg-[#e5e8eb] transition-colors"
            aria-label={texts.share_link}
          >
            <div className="w-12 h-12 bg-[#6b7684] rounded-full flex items-center justify-center" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </div>
            <span className="text-[13px] text-[#4e5968]">{texts.share_link}</span>
          </button>

          {canUseWebShare && (
            <button
              onClick={handleNativeShare}
              className="flex-1 flex flex-col items-center gap-2 py-4 bg-[#f2f4f6] rounded-2xl active:bg-[#e5e8eb] transition-colors"
              aria-label="More sharing options"
            >
              <div className="w-12 h-12 bg-[#191f28] rounded-full flex items-center justify-center" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <span className="text-[13px] text-[#4e5968]">More</span>
            </button>
          )}
        </div>

        {/* SNS 버튼 */}
        <div className="px-6 pb-6">
          <div className="flex justify-center gap-4 flex-wrap">
            {getSnsButtons().map((btn) => (
              <button
                key={btn.id}
                onClick={btn.action}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl active:scale-95 transition-transform"
                style={{ backgroundColor: btn.color + '20' }}
                aria-label={`${texts.title} ${btn.label}`}
              >
                <span aria-hidden="true">{btn.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 취소 */}
        <button
          onClick={onClose}
          className="w-full py-4 border-t border-[#f2f4f6] text-[15px] text-[#6b7684] font-medium"
        >
          {texts.cancel}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
