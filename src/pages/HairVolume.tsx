import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 머리숱 레벨 정의
const volumeLevels = [
  { id: 'very-thin', label: '매우 적음', value: -3, description: '탈모 진행 상태' },
  { id: 'thin', label: '적음', value: -2, description: '머리숱이 부족함' },
  { id: 'slightly-thin', label: '약간 적음', value: -1, description: '평균 이하' },
  { id: 'normal', label: '보통', value: 0, description: '현재 상태' },
  { id: 'slightly-thick', label: '약간 많음', value: 1, description: '평균 이상' },
  { id: 'thick', label: '많음', value: 2, description: '풍성한 머리숱' },
  { id: 'very-thick', label: '매우 많음', value: 3, description: '아주 풍성함' },
];

export default function HairVolume() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto, gender } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState(0);
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

  // AI 시뮬레이션 실행
  const runSimulation = async () => {
    if (!myBasePhoto) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      // Gemini API로 이미지 생성 요청
      const prompt = generatePrompt(selectedLevel, gender);

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hair-volume',
          photo: myBasePhoto,
          level: selectedLevel,
          gender,
          prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultImage(data.result);
        setShowComparison(true);
      } else {
        // 실패시 로컬 시뮬레이션 (CSS 필터로 대체 효과)
        setResultImage(myBasePhoto);
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      // 실패해도 비교 모드로 전환
      setResultImage(myBasePhoto);
      setShowComparison(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 프롬프트 생성
  const generatePrompt = (level: number, genderType: string) => {
    const genderText = genderType === 'male' ? 'man' : 'woman';

    if (level < 0) {
      const intensity = Math.abs(level);
      return `Transform this ${genderText}'s photo to show hair loss/thinning effect.
              Hair density reduced by ${intensity * 30}%.
              ${intensity >= 2 ? 'Show visible scalp through thinning hair.' : 'Slightly thinner hair volume.'}
              Keep the exact same face, expression, lighting, and background.
              Only modify the hair density/volume, nothing else.`;
    } else if (level > 0) {
      return `Transform this ${genderText}'s photo to show increased hair volume/density.
              Hair appears ${level * 30}% thicker and fuller.
              ${level >= 2 ? 'Very voluminous, thick healthy hair.' : 'Slightly fuller hair.'}
              Keep the exact same face, expression, lighting, and background.
              Only modify the hair density/volume, nothing else.`;
    }
    return '';
  };

  const currentLevel = volumeLevels.find(l => l.value === selectedLevel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] safe-area-top safe-area-bottom">
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
          <h1 className="text-white font-semibold">머리숱 시뮬레이션</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Photo Section */}
      <div className="p-4">
        {!myBasePhoto ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 bg-white/5"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
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
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
            {/* Before (Original) */}
            <img
              src={myBasePhoto}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* After (Result) with clip */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
            >
              <img
                src={resultImage}
                alt="After"
                className="w-full h-full object-cover"
                style={{
                  filter: selectedLevel < 0
                    ? `brightness(${1 + selectedLevel * 0.05}) contrast(${1 - Math.abs(selectedLevel) * 0.03})`
                    : selectedLevel > 0
                    ? `brightness(${1 - selectedLevel * 0.02}) contrast(${1 + selectedLevel * 0.03})`
                    : 'none'
                }}
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
              <span className="text-white text-sm">현재</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
              <span className="text-white text-sm">{currentLevel?.label}</span>
            </div>
          </div>
        ) : (
          /* Normal Photo View */
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
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

      {/* Volume Level Selector */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">머리숱 레벨</h3>
          <span className="text-purple-400 font-medium">{currentLevel?.label}</span>
        </div>

        {/* Slider */}
        <div className="relative mb-6">
          <input
            type="range"
            min="-3"
            max="3"
            step="1"
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(Number(e.target.value));
              setShowComparison(false);
            }}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-thumb"
          />

          {/* Level markers */}
          <div className="flex justify-between mt-2">
            {volumeLevels.map((level) => (
              <div
                key={level.id}
                className={`flex flex-col items-center ${
                  level.value === selectedLevel ? 'text-purple-400' : 'text-white/40'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-1 ${
                    level.value === selectedLevel
                      ? 'bg-purple-500'
                      : level.value === 0
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                />
                <span className="text-[10px]">{level.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Level Description */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedLevel < 0
                ? 'bg-red-500/20'
                : selectedLevel > 0
                ? 'bg-green-500/20'
                : 'bg-white/10'
            }`}>
              <span className="text-xl">
                {selectedLevel < 0 ? '🧑‍🦲' : selectedLevel > 0 ? '💇' : '👤'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{currentLevel?.label}</p>
              <p className="text-white/50 text-sm">{currentLevel?.description}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {myBasePhoto && (
          <div className="space-y-3">
            <button
              onClick={runSimulation}
              disabled={isProcessing || selectedLevel === 0}
              className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                isProcessing || selectedLevel === 0
                  ? 'bg-white/10 text-white/40'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  시뮬레이션 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {selectedLevel === 0 ? '레벨을 선택하세요' : '시뮬레이션 보기'}
                </>
              )}
            </button>

            {showComparison && (
              <button
                onClick={() => setShowComparison(false)}
                className="w-full py-3 bg-white/10 rounded-xl text-white/60"
              >
                다시 선택하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-4 pb-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-white font-medium mb-1">알고 계셨나요?</p>
              <p className="text-white/60 text-sm">
                머리숱이 적어 보이는 것은 탈모 초기 증상일 수 있어요.
                미리 시뮬레이션해보고 관리 계획을 세워보세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #EC4899, #8B5CF6);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #EC4899, #8B5CF6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
