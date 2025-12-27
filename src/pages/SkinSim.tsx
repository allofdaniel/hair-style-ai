import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 피부 시술 종류 정의
interface TreatmentOption {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  effect: string;
  intensity: number; // 1-5
}

const treatmentCategories = [
  { id: 'basic', name: '기본 케어', icon: '✨' },
  { id: 'anti-aging', name: '안티에이징', icon: '⏰' },
  { id: 'contouring', name: '윤곽/리프팅', icon: '💎' },
  { id: 'texture', name: '피부결 개선', icon: '🌟' },
];

const treatments: TreatmentOption[] = [
  // 기본 케어
  {
    id: 'whitening',
    name: '미백 관리',
    category: 'basic',
    description: '피부 톤을 밝고 균일하게',
    icon: '🌸',
    effect: 'brightness',
    intensity: 2,
  },
  {
    id: 'hydration',
    name: '수분 관리',
    category: 'basic',
    description: '촉촉하고 건강한 피부',
    icon: '💧',
    effect: 'glow',
    intensity: 2,
  },
  {
    id: 'pore-care',
    name: '모공 케어',
    category: 'basic',
    description: '모공을 조여 매끈한 피부',
    icon: '🔍',
    effect: 'smooth',
    intensity: 2,
  },

  // 안티에이징
  {
    id: 'botox-forehead',
    name: '이마 보톡스',
    category: 'anti-aging',
    description: '이마 주름 개선',
    icon: '😌',
    effect: 'smooth-forehead',
    intensity: 3,
  },
  {
    id: 'botox-crow',
    name: '눈가 보톡스',
    category: 'anti-aging',
    description: '눈가 주름(까마귀발) 개선',
    icon: '👁️',
    effect: 'smooth-eyes',
    intensity: 3,
  },
  {
    id: 'filler-nasolabial',
    name: '팔자주름 필러',
    category: 'anti-aging',
    description: '입가 팔자주름 개선',
    icon: '💉',
    effect: 'fill-nasolabial',
    intensity: 4,
  },
  {
    id: 'skin-booster',
    name: '스킨 부스터',
    category: 'anti-aging',
    description: '전체적인 탄력 개선',
    icon: '💎',
    effect: 'tighten',
    intensity: 3,
  },

  // 윤곽/리프팅
  {
    id: 'jaw-botox',
    name: '턱 보톡스',
    category: 'contouring',
    description: '턱선을 갸름하게',
    icon: '✌️',
    effect: 'slim-jaw',
    intensity: 4,
  },
  {
    id: 'thread-lift',
    name: '실 리프팅',
    category: 'contouring',
    description: '처진 피부를 위로',
    icon: '⬆️',
    effect: 'lift',
    intensity: 4,
  },
  {
    id: 'hifu',
    name: '하이푸',
    category: 'contouring',
    description: '피부 깊숙이 탄력',
    icon: '🔥',
    effect: 'deep-tighten',
    intensity: 5,
  },
  {
    id: 'nose-filler',
    name: '코 필러',
    category: 'contouring',
    description: '코 라인 개선',
    icon: '👃',
    effect: 'nose-enhance',
    intensity: 3,
  },

  // 피부결 개선
  {
    id: 'laser-toning',
    name: '레이저 토닝',
    category: 'texture',
    description: '피부 톤 균일화',
    icon: '✨',
    effect: 'even-tone',
    intensity: 3,
  },
  {
    id: 'fraxel',
    name: '프락셀',
    category: 'texture',
    description: '흉터, 모공 개선',
    icon: '🔬',
    effect: 'resurface',
    intensity: 4,
  },
  {
    id: 'peeling',
    name: '피부 필링',
    category: 'texture',
    description: '각질 제거로 맑은 피부',
    icon: '🧴',
    effect: 'renew',
    intensity: 2,
  },
];

export default function SkinSim() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto, gender } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사진 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMyBasePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 시술 선택 토글
  const toggleTreatment = (id: string) => {
    setSelectedTreatments(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
    setShowComparison(false);
  };

  // AI 시뮬레이션 실행
  const runSimulation = async () => {
    if (!myBasePhoto || selectedTreatments.length === 0) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skin',
          photo: myBasePhoto,
          treatments: selectedTreatments,
          gender,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultImage(data.result);
      } else {
        setResultImage(myBasePhoto);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setResultImage(myBasePhoto);
    } finally {
      setIsProcessing(false);
      setShowComparison(true);
    }
  };

  // 시술에 따른 시각적 효과
  const getVisualEffect = () => {
    let brightness = 1;
    let blur = 0;
    let contrast = 1;
    let saturate = 1;

    selectedTreatments.forEach(id => {
      const treatment = treatments.find(t => t.id === id);
      if (!treatment) return;

      switch (treatment.effect) {
        case 'brightness':
          brightness += 0.05;
          break;
        case 'glow':
          brightness += 0.03;
          saturate += 0.05;
          break;
        case 'smooth':
        case 'smooth-forehead':
        case 'smooth-eyes':
          blur += 0.3;
          break;
        case 'tighten':
        case 'deep-tighten':
          contrast += 0.03;
          break;
        case 'even-tone':
          saturate -= 0.05;
          brightness += 0.02;
          break;
        case 'resurface':
        case 'renew':
          brightness += 0.03;
          blur += 0.2;
          break;
      }
    });

    return {
      filter: `brightness(${brightness}) blur(${blur}px) contrast(${contrast}) saturate(${saturate})`,
    };
  };

  const filteredTreatments = treatments.filter(t => t.category === selectedCategory);
  const selectedTreatmentObjects = treatments.filter(t => selectedTreatments.includes(t.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] safe-area-top safe-area-bottom pb-32">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a12]/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-semibold">피부 시술 시뮬레이션</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Photo Section */}
      <div className="p-4">
        {!myBasePhoto ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 bg-white/5"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">사진을 추가해주세요</p>
              <p className="text-white/50 text-sm mt-1">정면 얼굴 사진이 가장 좋아요</p>
            </div>
          </button>
        ) : showComparison && resultImage ? (
          /* Comparison View */
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            {/* Before */}
            <img
              src={myBasePhoto}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* After */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
            >
              <img
                src={resultImage}
                alt="After"
                className="w-full h-full object-cover transition-all duration-300"
                style={getVisualEffect()}
              />
            </div>

            {/* Slider */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${comparisonPosition}%`, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                const handleMove = (moveE: MouseEvent) => {
                  const x = ((moveE.clientX - rect.left) / rect.width) * 100;
                  setComparisonPosition(Math.max(0, Math.min(100, x)));
                };
                const handleUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleUp);
                };
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp);
              }}
              onTouchStart={(e) => {
                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                const handleMove = (moveE: TouchEvent) => {
                  const x = ((moveE.touches[0].clientX - rect.left) / rect.width) * 100;
                  setComparisonPosition(Math.max(0, Math.min(100, x)));
                };
                const handleEnd = () => {
                  document.removeEventListener('touchmove', handleMove);
                  document.removeEventListener('touchend', handleEnd);
                };
                document.addEventListener('touchmove', handleMove);
                document.addEventListener('touchend', handleEnd);
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-full">
              <span className="text-white text-sm">Before</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
              <span className="text-white text-sm">After</span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img
              src={myBasePhoto}
              alt="My photo"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Treatment Categories */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {treatmentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Treatments Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {filteredTreatments.map((treatment) => (
            <button
              key={treatment.id}
              onClick={() => toggleTreatment(treatment.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedTreatments.includes(treatment.id)
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{treatment.icon}</span>
                {selectedTreatments.includes(treatment.id) && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <h4 className="text-white font-medium text-sm mb-1">{treatment.name}</h4>
              <p className="text-white/50 text-xs">{treatment.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Treatments Summary */}
      {selectedTreatments.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">선택한 시술 ({selectedTreatments.length}개)</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTreatmentObjects.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full"
                >
                  <span className="text-sm">{treatment.icon}</span>
                  <span className="text-emerald-300 text-sm">{treatment.name}</span>
                  <button
                    onClick={() => toggleTreatment(treatment.id)}
                    className="text-emerald-300/60 hover:text-emerald-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Button (Fixed) */}
      {myBasePhoto && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent">
          <button
            onClick={runSimulation}
            disabled={isProcessing || selectedTreatments.length === 0}
            className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              isProcessing || selectedTreatments.length === 0
                ? 'bg-white/10 text-white/40'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                시뮬레이션 중...
              </>
            ) : selectedTreatments.length === 0 ? (
              '시술을 선택해주세요'
            ) : (
              <>
                <span className="text-lg">✨</span>
                {selectedTreatments.length}개 시술 효과 보기
              </>
            )}
          </button>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
