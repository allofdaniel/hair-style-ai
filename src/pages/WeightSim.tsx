import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 체중 변화 레벨 정의 (미래 사용 예정)
const _weightLevels = [
  { id: 'lose-15', label: '-15kg', value: -15, description: '상당한 감량' },
  { id: 'lose-10', label: '-10kg', value: -10, description: '큰 감량' },
  { id: 'lose-5', label: '-5kg', value: -5, description: '적당한 감량' },
  { id: 'lose-3', label: '-3kg', value: -3, description: '약간의 감량' },
  { id: 'current', label: '현재', value: 0, description: '현재 상태' },
  { id: 'gain-3', label: '+3kg', value: 3, description: '약간의 증가' },
  { id: 'gain-5', label: '+5kg', value: 5, description: '적당한 증가' },
  { id: 'gain-10', label: '+10kg', value: 10, description: '큰 증가' },
  { id: 'gain-15', label: '+15kg', value: 15, description: '상당한 증가' },
];
void _weightLevels;

export default function WeightSim() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto, gender } = useAppStore();
  const [selectedWeight, setSelectedWeight] = useState(0);
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
      // API 호출 시도
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weight',
          photo: myBasePhoto,
          weight: selectedWeight,
          gender,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultImage(data.result);
      } else {
        // 실패시 원본 사용
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

  // 체중에 따른 시각적 효과 계산
  const getVisualEffect = () => {
    if (selectedWeight === 0) return {};

    if (selectedWeight < 0) {
      // 감량: 얼굴이 좁아지고 날카로워짐
      const intensity = Math.abs(selectedWeight) / 15;
      return {
        filter: `brightness(${1 + intensity * 0.05}) contrast(${1 + intensity * 0.1})`,
        transform: `scaleX(${1 - intensity * 0.08})`,
      };
    } else {
      // 증량: 얼굴이 넓어지고 부드러워짐
      const intensity = selectedWeight / 15;
      return {
        filter: `brightness(${1 - intensity * 0.03}) blur(${intensity * 0.5}px)`,
        transform: `scaleX(${1 + intensity * 0.1})`,
      };
    }
  };

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
          <h1 className="text-white font-semibold">체중 변화 시뮬레이션</h1>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
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
              <span className="text-white text-sm">현재</span>
            </div>
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${
              selectedWeight < 0 ? 'bg-green-500' : selectedWeight > 0 ? 'bg-orange-500' : 'bg-gray-500'
            }`}>
              <span className="text-white text-sm">
                {selectedWeight > 0 ? '+' : ''}{selectedWeight}kg
              </span>
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

      {/* Weight Level Selector */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">체중 변화</h3>
          <span className={`font-medium ${
            selectedWeight < 0 ? 'text-green-400' : selectedWeight > 0 ? 'text-orange-400' : 'text-white/60'
          }`}>
            {selectedWeight > 0 ? '+' : ''}{selectedWeight}kg
          </span>
        </div>

        {/* Slider */}
        <div className="relative mb-6">
          <input
            type="range"
            min="-15"
            max="15"
            step="1"
            value={selectedWeight}
            onChange={(e) => {
              setSelectedWeight(Number(e.target.value));
              setShowComparison(false);
            }}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-weight"
          />

          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-400">-15kg</span>
            <span className="text-white/60">현재</span>
            <span className="text-orange-400">+15kg</span>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[-10, -5, 0, 5, 10].map((weight) => (
            <button
              key={weight}
              onClick={() => {
                setSelectedWeight(weight);
                setShowComparison(false);
              }}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                selectedWeight === weight
                  ? weight < 0
                    ? 'bg-green-500 text-white'
                    : weight > 0
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {weight > 0 ? '+' : ''}{weight === 0 ? '현재' : `${weight}kg`}
            </button>
          ))}
        </div>

        {/* Effect Description */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedWeight < 0
                ? 'bg-green-500/20'
                : selectedWeight > 0
                ? 'bg-orange-500/20'
                : 'bg-white/10'
            }`}>
              <span className="text-xl">
                {selectedWeight < -5 ? '🏃' : selectedWeight < 0 ? '🥗' : selectedWeight > 5 ? '🍔' : selectedWeight > 0 ? '🍕' : '⚖️'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">
                {selectedWeight === 0
                  ? '현재 체중'
                  : selectedWeight < 0
                  ? `${Math.abs(selectedWeight)}kg 감량 시`
                  : `${selectedWeight}kg 증가 시`}
              </p>
              <p className="text-white/50 text-sm">
                {selectedWeight === 0
                  ? '체중 변화를 선택하세요'
                  : selectedWeight < -10
                  ? '얼굴 라인이 날카로워지고 V라인 효과'
                  : selectedWeight < -5
                  ? '광대가 두드러지고 얼굴이 작아 보임'
                  : selectedWeight < 0
                  ? '약간의 얼굴 윤곽 개선 효과'
                  : selectedWeight > 10
                  ? '볼살과 턱선이 많이 부어 보임'
                  : selectedWeight > 5
                  ? '전체적으로 둥글둥글해 보임'
                  : '약간의 볼살 증가'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {myBasePhoto && (
          <div className="space-y-3">
            <button
              onClick={runSimulation}
              disabled={isProcessing || selectedWeight === 0}
              className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                isProcessing || selectedWeight === 0
                  ? 'bg-white/10 text-white/40'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
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
                  {selectedWeight === 0 ? '체중 변화를 선택하세요' : '시뮬레이션 보기'}
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

      <style>{`
        .slider-weight::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F59E0B, #EA580C);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.5);
        }
        .slider-weight::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F59E0B, #EA580C);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.5);
        }
      `}</style>
    </div>
  );
}
