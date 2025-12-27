/**
 * 온보딩 튜토리얼 컴포넌트
 * - 처음 사용자에게 앱 사용법 안내
 * - 스와이프 가능한 카드 형태
 * - 다국어 지원
 */

import { useState } from 'react';
import { useI18n, type Language } from '../i18n/useI18n';

interface OnboardingStep {
  icon: string;
  titleKey: string;
  descKey: string;
  image?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '📸',
    titleKey: 'onboarding_step1_title',
    descKey: 'onboarding_step1_desc',
  },
  {
    icon: '💇',
    titleKey: 'onboarding_step2_title',
    descKey: 'onboarding_step2_desc',
  },
  {
    icon: '✨',
    titleKey: 'onboarding_step3_title',
    descKey: 'onboarding_step3_desc',
  },
  {
    icon: '🎨',
    titleKey: 'onboarding_step4_title',
    descKey: 'onboarding_step4_desc',
  },
];

// 온보딩 텍스트 (다국어)
const ONBOARDING_TEXTS: Record<Language, Record<string, string>> = {
  ko: {
    onboarding_step1_title: '사진 촬영',
    onboarding_step1_desc: '카메라로 사진을 찍거나\n갤러리에서 사진을 선택하세요',
    onboarding_step2_title: '스타일 선택',
    onboarding_step2_desc: '50가지 이상의 헤어스타일 중\n원하는 스타일을 선택하세요',
    onboarding_step3_title: 'AI 시뮬레이션',
    onboarding_step3_desc: 'AI가 자동으로 헤어스타일을\n적용해 드립니다',
    onboarding_step4_title: '다양한 기능',
    onboarding_step4_desc: '헤어 컬러, 체중, 메이크업 등\n다양한 시뮬레이션을 체험하세요',
    skip: '건너뛰기',
    next: '다음',
    start: '시작하기',
  },
  en: {
    onboarding_step1_title: 'Take a Photo',
    onboarding_step1_desc: 'Take a photo with camera\nor select from gallery',
    onboarding_step2_title: 'Choose Style',
    onboarding_step2_desc: 'Select your preferred style\nfrom 50+ hairstyles',
    onboarding_step3_title: 'AI Simulation',
    onboarding_step3_desc: 'AI automatically applies\nthe hairstyle for you',
    onboarding_step4_title: 'More Features',
    onboarding_step4_desc: 'Try hair color, weight,\nmakeup simulations and more',
    skip: 'Skip',
    next: 'Next',
    start: 'Get Started',
  },
  zh: {
    onboarding_step1_title: '拍照',
    onboarding_step1_desc: '用相机拍照\n或从相册选择',
    onboarding_step2_title: '选择发型',
    onboarding_step2_desc: '从50多种发型中\n选择您喜欢的',
    onboarding_step3_title: 'AI模拟',
    onboarding_step3_desc: 'AI自动为您\n应用发型',
    onboarding_step4_title: '更多功能',
    onboarding_step4_desc: '尝试发色、体重、\n化妆等模拟',
    skip: '跳过',
    next: '下一步',
    start: '开始使用',
  },
  ja: {
    onboarding_step1_title: '写真を撮る',
    onboarding_step1_desc: 'カメラで写真を撮るか\nギャラリーから選択',
    onboarding_step2_title: 'スタイル選択',
    onboarding_step2_desc: '50以上のヘアスタイルから\nお好みのスタイルを選択',
    onboarding_step3_title: 'AIシミュレーション',
    onboarding_step3_desc: 'AIが自動で\nヘアスタイルを適用',
    onboarding_step4_title: 'その他の機能',
    onboarding_step4_desc: 'ヘアカラー、体重、\nメイクなどを試す',
    skip: 'スキップ',
    next: '次へ',
    start: '始める',
  },
  es: {
    onboarding_step1_title: 'Toma una Foto',
    onboarding_step1_desc: 'Toma una foto con la cámara\no selecciona de la galería',
    onboarding_step2_title: 'Elige Estilo',
    onboarding_step2_desc: 'Selecciona tu estilo preferido\nentre más de 50 peinados',
    onboarding_step3_title: 'Simulación IA',
    onboarding_step3_desc: 'La IA aplica automáticamente\nel peinado para ti',
    onboarding_step4_title: 'Más Funciones',
    onboarding_step4_desc: 'Prueba color de cabello,\npeso, maquillaje y más',
    skip: 'Omitir',
    next: 'Siguiente',
    start: 'Comenzar',
  },
  pt: {
    onboarding_step1_title: 'Tire uma Foto',
    onboarding_step1_desc: 'Tire uma foto com a câmera\nou selecione da galeria',
    onboarding_step2_title: 'Escolha o Estilo',
    onboarding_step2_desc: 'Selecione seu estilo preferido\nentre mais de 50 penteados',
    onboarding_step3_title: 'Simulação IA',
    onboarding_step3_desc: 'A IA aplica automaticamente\no penteado para você',
    onboarding_step4_title: 'Mais Recursos',
    onboarding_step4_desc: 'Experimente cor de cabelo,\npeso, maquiagem e mais',
    skip: 'Pular',
    next: 'Próximo',
    start: 'Começar',
  },
  fr: {
    onboarding_step1_title: 'Prenez une Photo',
    onboarding_step1_desc: 'Prenez une photo avec l\'appareil\nou choisissez dans la galerie',
    onboarding_step2_title: 'Choisissez un Style',
    onboarding_step2_desc: 'Sélectionnez votre style préféré\nparmi plus de 50 coiffures',
    onboarding_step3_title: 'Simulation IA',
    onboarding_step3_desc: 'L\'IA applique automatiquement\nla coiffure pour vous',
    onboarding_step4_title: 'Plus de Fonctionnalités',
    onboarding_step4_desc: 'Essayez la couleur, le poids,\nle maquillage et plus',
    skip: 'Passer',
    next: 'Suivant',
    start: 'Commencer',
  },
  de: {
    onboarding_step1_title: 'Foto aufnehmen',
    onboarding_step1_desc: 'Nehmen Sie ein Foto auf\noder wählen Sie aus der Galerie',
    onboarding_step2_title: 'Stil wählen',
    onboarding_step2_desc: 'Wählen Sie Ihren bevorzugten Stil\naus über 50 Frisuren',
    onboarding_step3_title: 'KI-Simulation',
    onboarding_step3_desc: 'KI wendet automatisch\ndie Frisur für Sie an',
    onboarding_step4_title: 'Mehr Funktionen',
    onboarding_step4_desc: 'Probieren Sie Haarfarbe, Gewicht,\nMake-up und mehr',
    skip: 'Überspringen',
    next: 'Weiter',
    start: 'Starten',
  },
  th: {
    onboarding_step1_title: 'ถ่ายรูป',
    onboarding_step1_desc: 'ถ่ายรูปด้วยกล้อง\nหรือเลือกจากแกลเลอรี่',
    onboarding_step2_title: 'เลือกสไตล์',
    onboarding_step2_desc: 'เลือกสไตล์ที่ชอบ\nจากทรงผมกว่า 50 แบบ',
    onboarding_step3_title: 'จำลอง AI',
    onboarding_step3_desc: 'AI จะใส่ทรงผม\nให้คุณโดยอัตโนมัติ',
    onboarding_step4_title: 'ฟีเจอร์เพิ่มเติม',
    onboarding_step4_desc: 'ลองสีผม น้ำหนัก\nแต่งหน้า และอื่นๆ',
    skip: 'ข้าม',
    next: 'ถัดไป',
    start: 'เริ่มต้น',
  },
  vi: {
    onboarding_step1_title: 'Chụp Ảnh',
    onboarding_step1_desc: 'Chụp ảnh bằng camera\nhoặc chọn từ thư viện',
    onboarding_step2_title: 'Chọn Kiểu',
    onboarding_step2_desc: 'Chọn kiểu tóc yêu thích\ntừ hơn 50 kiểu',
    onboarding_step3_title: 'Mô phỏng AI',
    onboarding_step3_desc: 'AI tự động áp dụng\nkiểu tóc cho bạn',
    onboarding_step4_title: 'Thêm Tính năng',
    onboarding_step4_desc: 'Thử màu tóc, cân nặng,\ntrang điểm và hơn thế',
    skip: 'Bỏ qua',
    next: 'Tiếp',
    start: 'Bắt đầu',
  },
  id: {
    onboarding_step1_title: 'Ambil Foto',
    onboarding_step1_desc: 'Ambil foto dengan kamera\natau pilih dari galeri',
    onboarding_step2_title: 'Pilih Gaya',
    onboarding_step2_desc: 'Pilih gaya favorit Anda\ndari 50+ gaya rambut',
    onboarding_step3_title: 'Simulasi AI',
    onboarding_step3_desc: 'AI otomatis menerapkan\ngaya rambut untuk Anda',
    onboarding_step4_title: 'Fitur Lainnya',
    onboarding_step4_desc: 'Coba warna rambut, berat,\nriasan dan lainnya',
    skip: 'Lewati',
    next: 'Lanjut',
    start: 'Mulai',
  },
  hi: {
    onboarding_step1_title: 'फोटो लें',
    onboarding_step1_desc: 'कैमरे से फोटो लें\nया गैलरी से चुनें',
    onboarding_step2_title: 'स्टाइल चुनें',
    onboarding_step2_desc: '50+ हेयरस्टाइल में से\nअपना पसंदीदा चुनें',
    onboarding_step3_title: 'AI सिमुलेशन',
    onboarding_step3_desc: 'AI स्वचालित रूप से\nहेयरस्टाइल लागू करता है',
    onboarding_step4_title: 'अधिक सुविधाएं',
    onboarding_step4_desc: 'हेयर कलर, वजन,\nमेकअप और अधिक आज़माएं',
    skip: 'छोड़ें',
    next: 'अगला',
    start: 'शुरू करें',
  },
  ar: {
    onboarding_step1_title: 'التقط صورة',
    onboarding_step1_desc: 'التقط صورة بالكاميرا\nأو اختر من المعرض',
    onboarding_step2_title: 'اختر النمط',
    onboarding_step2_desc: 'اختر نمطك المفضل\nمن أكثر من 50 تسريحة',
    onboarding_step3_title: 'محاكاة الذكاء الاصطناعي',
    onboarding_step3_desc: 'يطبق الذكاء الاصطناعي\nالتسريحة تلقائياً',
    onboarding_step4_title: 'ميزات أخرى',
    onboarding_step4_desc: 'جرب لون الشعر والوزن\nوالمكياج والمزيد',
    skip: 'تخطي',
    next: 'التالي',
    start: 'ابدأ',
  },
};

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { language } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const texts = ONBOARDING_TEXTS[language] || ONBOARDING_TEXTS.en;

  const handleNext = () => {
    if (isAnimating) return;

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setIsAnimating(true);
      setCurrentStep(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('looksim-onboarding-completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  // 터치 스와이프 지원
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50 && currentStep < ONBOARDING_STEPS.length - 1) {
      // 왼쪽 스와이프 -> 다음
      handleNext();
    } else if (diff < -50 && currentStep > 0) {
      // 오른쪽 스와이프 -> 이전
      setCurrentStep(prev => prev - 1);
    }

    setTouchStart(null);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-b from-[#3182f6] to-[#6366f1] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 건너뛰기 버튼 */}
      <div className="flex justify-end p-4 safe-area-top">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-white/80 text-[14px] font-medium hover:text-white active:scale-95 transition-all"
          aria-label={texts.skip}
        >
          {texts.skip}
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 아이콘 */}
        <div
          key={currentStep}
          className={`w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8
            ${isAnimating ? 'animate-fade-in' : ''}`}
        >
          <span className="text-[64px]">{step.icon}</span>
        </div>

        {/* 제목 */}
        <h2
          id="onboarding-title"
          key={`title-${currentStep}`}
          className={`text-[28px] font-bold text-white text-center mb-4
            ${isAnimating ? 'animate-fade-in' : ''}`}
        >
          {texts[step.titleKey]}
        </h2>

        {/* 설명 */}
        <p
          key={`desc-${currentStep}`}
          className={`text-[16px] text-white/80 text-center whitespace-pre-line leading-relaxed
            ${isAnimating ? 'animate-fade-in' : ''}`}
        >
          {texts[step.descKey]}
        </p>
      </div>

      {/* 하단 */}
      <div className="px-8 pb-12 safe-area-bottom">
        {/* 인디케이터 */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* 버튼 */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-white rounded-2xl text-[#3182f6] text-[17px] font-semibold
            shadow-lg shadow-black/10 active:scale-[0.98] transition-transform"
          aria-label={isLastStep ? texts.start : texts.next}
        >
          {isLastStep ? texts.start : texts.next}
        </button>

        {/* 스크린 리더용 스텝 안내 */}
        <div className="sr-only" aria-live="polite">
          {`${currentStep + 1} / ${ONBOARDING_STEPS.length}: ${texts[step.titleKey]}`}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * 온보딩 완료 여부 확인
 */
export const hasCompletedOnboarding = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('looksim-onboarding-completed') === 'true';
};

/**
 * 온보딩 상태 초기화 (테스트용)
 */
export const resetOnboarding = (): void => {
  localStorage.removeItem('looksim-onboarding-completed');
};
