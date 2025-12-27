/**
 * 앱 스토어 레이팅 요청 프롬프트
 * - 적절한 타이밍에 리뷰 요청
 * - 사용자 경험에 방해가 되지 않도록 조건부 표시
 * - 다국어 지원
 */

import { useI18n, type Language } from '../i18n/useI18n';

// 레이팅 텍스트 (다국어)
const RATING_TEXTS: Record<Language, Record<string, string>> = {
  ko: {
    title: 'LookSim이 마음에 드셨나요?',
    message: '앱 스토어에서 리뷰를 남겨주시면\n더 나은 서비스를 만드는데 큰 도움이 됩니다!',
    rate: '별점 주기',
    later: '나중에',
    never: '다시 묻지 않기',
  },
  en: {
    title: 'Enjoying LookSim?',
    message: 'Your review on the app store\nhelps us make the app even better!',
    rate: 'Rate Now',
    later: 'Maybe Later',
    never: 'Don\'t Ask Again',
  },
  zh: {
    title: '喜欢 LookSim 吗？',
    message: '您在应用商店的评价\n将帮助我们做得更好！',
    rate: '去评价',
    later: '稍后',
    never: '不再询问',
  },
  ja: {
    title: 'LookSimを気に入りましたか？',
    message: 'アプリストアでレビューを残していただけると\nアプリの改善に役立ちます！',
    rate: '評価する',
    later: '後で',
    never: '今後表示しない',
  },
  es: {
    title: '¿Te gusta LookSim?',
    message: '¡Tu reseña en la tienda de apps\nnos ayuda a mejorar!',
    rate: 'Calificar',
    later: 'Más Tarde',
    never: 'No Preguntar',
  },
  pt: {
    title: 'Gostando do LookSim?',
    message: 'Sua avaliação na loja de apps\nnos ajuda a melhorar!',
    rate: 'Avaliar',
    later: 'Depois',
    never: 'Não Perguntar',
  },
  fr: {
    title: 'Vous aimez LookSim ?',
    message: 'Votre avis sur l\'app store\nnous aide à nous améliorer !',
    rate: 'Noter',
    later: 'Plus Tard',
    never: 'Ne Plus Demander',
  },
  de: {
    title: 'Gefällt Ihnen LookSim?',
    message: 'Ihre Bewertung im App Store\nhilft uns, die App zu verbessern!',
    rate: 'Bewerten',
    later: 'Später',
    never: 'Nicht Mehr Fragen',
  },
  th: {
    title: 'ชอบ LookSim ไหม?',
    message: 'รีวิวของคุณใน App Store\nช่วยให้เราพัฒนาแอปได้ดีขึ้น!',
    rate: 'ให้คะแนน',
    later: 'ภายหลัง',
    never: 'ไม่ต้องถามอีก',
  },
  vi: {
    title: 'Bạn thích LookSim?',
    message: 'Đánh giá của bạn trên app store\ngiúp chúng tôi cải thiện!',
    rate: 'Đánh Giá',
    later: 'Để Sau',
    never: 'Không Hỏi Nữa',
  },
  id: {
    title: 'Suka LookSim?',
    message: 'Ulasan Anda di app store\nmembantu kami menjadi lebih baik!',
    rate: 'Beri Rating',
    later: 'Nanti',
    never: 'Jangan Tanya Lagi',
  },
  hi: {
    title: 'LookSim पसंद आया?',
    message: 'ऐप स्टोर पर आपकी समीक्षा\nहमें बेहतर बनाने में मदद करती है!',
    rate: 'रेट करें',
    later: 'बाद में',
    never: 'फिर न पूछें',
  },
  ar: {
    title: 'هل أعجبك LookSim؟',
    message: 'تقييمك في متجر التطبيقات\nيساعدنا على التحسين!',
    rate: 'تقييم',
    later: 'لاحقاً',
    never: 'لا تسأل مجدداً',
  },
};

// 스토어 URL
const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.looksim.app',
  ios: 'https://apps.apple.com/app/looksim/id0000000000', // 실제 ID로 교체 필요
};

interface RatingPromptProps {
  onClose: () => void;
}

export default function RatingPrompt({ onClose }: RatingPromptProps) {
  const { language } = useI18n();
  const texts = RATING_TEXTS[language] || RATING_TEXTS.en;

  const handleRate = () => {
    // 플랫폼 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const storeUrl = isIOS ? STORE_URLS.ios : STORE_URLS.android;

    // 스토어로 이동
    window.open(storeUrl, '_blank');

    // 다시 묻지 않기
    localStorage.setItem('looksim-rating-status', 'rated');
    onClose();
  };

  const handleLater = () => {
    // 3일 후 다시 표시
    const later = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('looksim-rating-later', later.toString());
    onClose();
  };

  const handleNever = () => {
    localStorage.setItem('looksim-rating-status', 'never');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-scale-in">
        {/* 아이콘 */}
        <div className="w-16 h-16 bg-gradient-to-br from-[#3182f6] to-[#6366f1] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⭐</span>
        </div>

        {/* 제목 */}
        <h3 className="text-[20px] font-bold text-[#191f28] text-center mb-2">
          {texts.title}
        </h3>

        {/* 메시지 */}
        <p className="text-[14px] text-[#6b7684] text-center whitespace-pre-line mb-6">
          {texts.message}
        </p>

        {/* 별점 시각화 */}
        <div className="flex justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className="w-8 h-8 text-[#fbbf24]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* 버튼들 */}
        <div className="space-y-2">
          <button
            onClick={handleRate}
            className="w-full py-3.5 bg-[#3182f6] text-white text-[15px] font-semibold rounded-xl active:scale-[0.98] transition-transform"
          >
            {texts.rate}
          </button>
          <button
            onClick={handleLater}
            className="w-full py-3 text-[#6b7684] text-[14px] font-medium"
          >
            {texts.later}
          </button>
          <button
            onClick={handleNever}
            className="w-full py-2 text-[#b0b8c1] text-[13px]"
          >
            {texts.never}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * 레이팅 프롬프트 표시 여부 확인
 */
export const shouldShowRatingPrompt = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 이미 평가했거나 다시 묻지 않기 선택
  const status = localStorage.getItem('looksim-rating-status');
  if (status === 'rated' || status === 'never') return false;

  // 나중에 선택한 경우 시간 확인
  const laterTime = localStorage.getItem('looksim-rating-later');
  if (laterTime && Date.now() < parseInt(laterTime)) return false;

  // 시뮬레이션 완료 횟수 확인 (3회 이상)
  const completionCount = parseInt(localStorage.getItem('looksim-simulation-count') || '0');
  if (completionCount < 3) return false;

  return true;
};

/**
 * 시뮬레이션 완료 횟수 증가
 */
export const incrementSimulationCount = (): void => {
  const current = parseInt(localStorage.getItem('looksim-simulation-count') || '0');
  localStorage.setItem('looksim-simulation-count', (current + 1).toString());
};
