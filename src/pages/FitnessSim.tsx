import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 운동 기간 및 강도 정의
const fitnessDurations = [
  { id: '1month', label: '1개월', months: 1 },
  { id: '3months', label: '3개월', months: 3 },
  { id: '6months', label: '6개월', months: 6 },
  { id: '1year', label: '1년', months: 12 },
  { id: '2years', label: '2년', months: 24 },
];

const workoutTypes = [
  { id: 'cardio', name: '유산소', icon: '🏃', description: '런닝, 수영, 자전거 등' },
  { id: 'weight', name: '웨이트', icon: '🏋️', description: '근력 운동 위주' },
  { id: 'mixed', name: '복합', icon: '💪', description: '유산소 + 근력' },
  { id: 'yoga', name: '요가/필라테스', icon: '🧘', description: '코어 강화, 유연성' },
];

const intensityLevels = [
  { id: 'light', label: '가볍게', value: 1, description: '주 2-3회, 30분' },
  { id: 'moderate', label: '적당히', value: 2, description: '주 3-4회, 1시간' },
  { id: 'intense', label: '열심히', value: 3, description: '주 5-6회, 1시간+' },
  { id: 'extreme', label: '극강', value: 4, description: '매일, PT 포함' },
];

export default function FitnessSim() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto, gender } = useAppStore();
  const [selectedDuration, setSelectedDuration] = useState('3months');
  const [selectedWorkout, setSelectedWorkout] = useState('mixed');
  const [selectedIntensity, setSelectedIntensity] = useState(2);
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

  const runSimulation = async () => {
    if (!myBasePhoto) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'fitness',
          photo: myBasePhoto,
          duration: selectedDuration,
          workout: selectedWorkout,
          intensity: selectedIntensity,
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

  // 운동 효과 시각화 (예상 변화)
  const getExpectedChanges = () => {
    const duration = fitnessDurations.find(d => d.id === selectedDuration);
    const months = duration?.months || 3;
    const intensity = selectedIntensity;
    const workout = selectedWorkout;

    let fatLoss = 0;
    let muscle = 0;
    let definition = 0;

    // 기간에 따른 기본 효과
    fatLoss = Math.min(months * 0.5 * intensity, 15);

    // 운동 종류에 따른 차이
    if (workout === 'cardio') {
      fatLoss *= 1.3;
      muscle = months * 0.1 * intensity;
    } else if (workout === 'weight') {
      fatLoss *= 0.7;
      muscle = months * 0.3 * intensity;
      definition = months * 0.2 * intensity;
    } else if (workout === 'mixed') {
      muscle = months * 0.2 * intensity;
      definition = months * 0.15 * intensity;
    } else {
      fatLoss *= 0.6;
      definition = months * 0.25 * intensity;
    }

    return {
      fatLoss: Math.min(Math.round(fatLoss), 20),
      muscle: Math.min(Math.round(muscle), 15),
      definition: Math.min(Math.round(definition), 10),
    };
  };

  const changes = getExpectedChanges();
  const currentDuration = fitnessDurations.find(d => d.id === selectedDuration);

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
          <h1 className="text-white font-semibold">운동 효과 시뮬레이션</h1>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">사진을 추가해주세요</p>
              <p className="text-white/50 text-sm mt-1">상반신이 보이는 사진 권장</p>
            </div>
          </button>
        ) : showComparison && resultImage ? (
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
            <img src={myBasePhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
            >
              <img
                src={resultImage}
                alt="After"
                className="w-full h-full object-cover"
                style={{
                  filter: `contrast(${1 + changes.definition * 0.01}) brightness(${1 + changes.muscle * 0.005})`,
                }}
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
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
              <span className="text-white text-sm">{currentDuration?.label} 후</span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
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

      {/* Workout Type */}
      <div className="px-4 mb-4">
        <h3 className="text-white font-semibold mb-3">운동 종류</h3>
        <div className="grid grid-cols-4 gap-2">
          {workoutTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedWorkout(type.id);
                setShowComparison(false);
              }}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedWorkout === type.id
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className="text-2xl block mb-1">{type.icon}</span>
              <span className="text-white text-xs font-medium">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="px-4 mb-4">
        <h3 className="text-white font-semibold mb-3">운동 기간</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {fitnessDurations.map((duration) => (
            <button
              key={duration.id}
              onClick={() => {
                setSelectedDuration(duration.id);
                setShowComparison(false);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedDuration === duration.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="px-4 mb-6">
        <h3 className="text-white font-semibold mb-3">운동 강도</h3>
        <div className="grid grid-cols-4 gap-2">
          {intensityLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => {
                setSelectedIntensity(level.value);
                setShowComparison(false);
              }}
              className={`p-2 rounded-xl text-center transition-all ${
                selectedIntensity === level.value
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className="text-white text-xs font-medium block">{level.label}</span>
              <span className="text-white/40 text-[10px]">{level.description.split(',')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expected Changes */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-white font-medium mb-4">예상 변화</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">체지방 감소</span>
                <span className="text-blue-400">-{changes.fatLoss}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${(changes.fatLoss / 20) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">근육량 증가</span>
                <span className="text-green-400">+{changes.muscle}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${(changes.muscle / 15) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">근육 선명도</span>
                <span className="text-purple-400">+{changes.definition}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${(changes.definition / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {myBasePhoto && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent">
          <button
            onClick={runSimulation}
            disabled={isProcessing}
            className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-white/10 text-white/40'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                시뮬레이션 중...
              </>
            ) : (
              <>
                <span className="text-lg">💪</span>
                {currentDuration?.label} 후 모습 보기
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
