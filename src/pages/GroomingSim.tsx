import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 그루밍 옵션 정의
interface GroomingOption {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  forGender: 'male' | 'female' | 'both';
  timeframe?: string; // 예: "몇 년 안 했을 때" vs "꾸준히 했을 때"
}

const groomingCategories = [
  { id: 'basic', name: '기본 관리', icon: '🧼' },
  { id: 'eyebrow', name: '눈썹', icon: '👁️' },
  { id: 'skin-care', name: '스킨케어', icon: '🧴' },
  { id: 'beard', name: '수염', icon: '🧔' },
];

const groomingOptions: GroomingOption[] = [
  // 기본 관리
  {
    id: 'sunscreen-never',
    name: '선크림 안 바름',
    category: 'basic',
    description: '5년간 선크림 없이 생활',
    icon: '☀️',
    forGender: 'both',
    timeframe: 'negative',
  },
  {
    id: 'sunscreen-always',
    name: '선크림 꾸준히',
    category: 'basic',
    description: '매일 선크림 사용',
    icon: '🧴',
    forGender: 'both',
    timeframe: 'positive',
  },
  {
    id: 'basic-skincare',
    name: '기초 화장',
    category: 'basic',
    description: '토너, 로션, 에센스',
    icon: '✨',
    forGender: 'both',
    timeframe: 'positive',
  },
  {
    id: 'no-skincare',
    name: '스킨케어 안 함',
    category: 'basic',
    description: '물 세안만 하는 생활',
    icon: '💧',
    forGender: 'both',
    timeframe: 'negative',
  },

  // 눈썹
  {
    id: 'eyebrow-groomed',
    name: '눈썹 정리',
    category: 'eyebrow',
    description: '깔끔하게 정리된 눈썹',
    icon: '✂️',
    forGender: 'both',
    timeframe: 'positive',
  },
  {
    id: 'eyebrow-natural',
    name: '눈썹 자연 그대로',
    category: 'eyebrow',
    description: '정리 안 한 자연 눈썹',
    icon: '🌿',
    forGender: 'both',
    timeframe: 'neutral',
  },
  {
    id: 'eyebrow-tattoo',
    name: '눈썹 문신',
    category: 'eyebrow',
    description: '반영구 눈썹 문신',
    icon: '🖌️',
    forGender: 'both',
    timeframe: 'positive',
  },

  // 스킨케어
  {
    id: 'bb-cream',
    name: 'BB크림',
    category: 'skin-care',
    description: '자연스러운 톤업',
    icon: '🎨',
    forGender: 'both',
    timeframe: 'positive',
  },
  {
    id: 'concealer',
    name: '컨실러',
    category: 'skin-care',
    description: '다크서클/잡티 커버',
    icon: '✏️',
    forGender: 'both',
    timeframe: 'positive',
  },
  {
    id: 'lip-balm',
    name: '립밤/립케어',
    category: 'skin-care',
    description: '촉촉한 입술 관리',
    icon: '💋',
    forGender: 'both',
    timeframe: 'positive',
  },

  // 수염 (남성)
  {
    id: 'clean-shave',
    name: '깔끔 면도',
    category: 'beard',
    description: '매일 면도하는 깔끔함',
    icon: '🪒',
    forGender: 'male',
    timeframe: 'positive',
  },
  {
    id: 'stubble',
    name: '무정자 수염',
    category: 'beard',
    description: '2-3일 자란 수염',
    icon: '🧔‍♂️',
    forGender: 'male',
    timeframe: 'neutral',
  },
  {
    id: 'beard-styled',
    name: '수염 스타일링',
    category: 'beard',
    description: '다듬어진 수염 스타일',
    icon: '👨',
    forGender: 'male',
    timeframe: 'positive',
  },
  {
    id: 'full-beard',
    name: '풀 비어드',
    category: 'beard',
    description: '덥수룩한 수염',
    icon: '🧙',
    forGender: 'male',
    timeframe: 'neutral',
  },
];

// 시간 경과 시뮬레이션 (선크림 안 바른 경우 등)
const timeSimulations = [
  { id: '1year', label: '1년 후', years: 1 },
  { id: '3years', label: '3년 후', years: 3 },
  { id: '5years', label: '5년 후', years: 5 },
  { id: '10years', label: '10년 후', years: 10 },
];

export default function GroomingSim() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto, gender } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('3years');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const toggleOption = (id: string) => {
    setSelectedOptions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
    setShowComparison(false);
  };

  const runSimulation = async () => {
    if (!myBasePhoto || selectedOptions.length === 0) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grooming',
          photo: myBasePhoto,
          options: selectedOptions,
          timeframe: selectedTimeframe,
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

  // 그루밍 효과 시각화
  const getVisualEffect = () => {
    let brightness = 1;
    let contrast = 1;
    let saturate = 1;
    let blur = 0;

    selectedOptions.forEach(id => {
      const option = groomingOptions.find(o => o.id === id);
      if (!option) return;

      if (option.timeframe === 'negative') {
        // 부정적 효과
        const years = timeSimulations.find(t => t.id === selectedTimeframe)?.years || 3;
        brightness -= years * 0.01;
        saturate -= years * 0.02;
        contrast += years * 0.01;
      } else if (option.timeframe === 'positive') {
        // 긍정적 효과
        brightness += 0.02;
        saturate += 0.03;
        blur += 0.1;
      }
    });

    return {
      filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`,
    };
  };

  const filteredOptions = groomingOptions.filter(
    o => o.category === selectedCategory && (o.forGender === 'both' || o.forGender === gender)
  );

  const hasNegativeOptions = selectedOptions.some(id => {
    const option = groomingOptions.find(o => o.id === id);
    return option?.timeframe === 'negative';
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] safe-area-top safe-area-bottom pb-24">
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
          <h1 className="text-white font-semibold">그루밍 시뮬레이션</h1>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">사진을 추가해주세요</p>
              <p className="text-white/50 text-sm mt-1">정면 얼굴 사진 권장</p>
            </div>
          </button>
        ) : showComparison && resultImage ? (
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img src={myBasePhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
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
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-full">
              <span className="text-white text-sm">현재</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
              <span className="text-white text-sm">
                {hasNegativeOptions ? timeSimulations.find(t => t.id === selectedTimeframe)?.label : '적용 후'}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img src={myBasePhoto} alt="My photo" className="w-full h-full object-cover" />
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

      {/* Categories */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {groomingCategories
            .filter(c => c.id !== 'beard' || gender === 'male')
            .map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* Options Grid */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedOptions.includes(option.id)
                  ? option.timeframe === 'negative'
                    ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/50'
                    : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{option.icon}</span>
                {selectedOptions.includes(option.id) && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    option.timeframe === 'negative' ? 'bg-red-500' : 'bg-indigo-500'
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <h4 className="text-white font-medium text-sm mb-1">{option.name}</h4>
              <p className="text-white/50 text-xs">{option.description}</p>
              {option.timeframe === 'negative' && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/20 rounded text-red-400 text-[10px]">
                  부정적 효과
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe Selector (for negative effects) */}
      {hasNegativeOptions && (
        <div className="px-4 mb-4">
          <h3 className="text-white font-semibold mb-3">기간 설정</h3>
          <div className="flex gap-2">
            {timeSimulations.map((time) => (
              <button
                key={time.id}
                onClick={() => {
                  setSelectedTimeframe(time.id);
                  setShowComparison(false);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTimeframe === time.id
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Summary */}
      {selectedOptions.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">선택한 옵션</h4>
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map(id => {
                const option = groomingOptions.find(o => o.id === id);
                if (!option) return null;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      option.timeframe === 'negative' ? 'bg-red-500/20' : 'bg-indigo-500/20'
                    }`}
                  >
                    <span className="text-sm">{option.icon}</span>
                    <span className={`text-sm ${option.timeframe === 'negative' ? 'text-red-300' : 'text-indigo-300'}`}>
                      {option.name}
                    </span>
                    <button onClick={() => toggleOption(id)} className="opacity-60 hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {myBasePhoto && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent">
          <button
            onClick={runSimulation}
            disabled={isProcessing || selectedOptions.length === 0}
            className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              isProcessing || selectedOptions.length === 0
                ? 'bg-white/10 text-white/40'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                시뮬레이션 중...
              </>
            ) : selectedOptions.length === 0 ? (
              '옵션을 선택해주세요'
            ) : (
              <>
                <span className="text-lg">🪒</span>
                효과 시뮬레이션 보기
              </>
            )}
          </button>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
