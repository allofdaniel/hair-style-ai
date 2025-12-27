import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

// 촬영 환경 설정
const lightingOptions = [
  { id: 'natural-day', name: '자연광 (낮)', icon: '☀️', description: '맑은 날 실외/창가' },
  { id: 'natural-cloudy', name: '자연광 (흐림)', icon: '☁️', description: '흐린 날 실외' },
  { id: 'indoor-warm', name: '실내 (따뜻한 조명)', icon: '💡', description: '백열등, 노란 조명' },
  { id: 'indoor-cool', name: '실내 (시원한 조명)', icon: '💎', description: '형광등, 흰색 조명' },
  { id: 'studio', name: '스튜디오', icon: '📸', description: '전문 촬영 환경' },
  { id: 'night', name: '야간/어두운 곳', icon: '🌙', description: '조명이 부족한 환경' },
];

const timeOfDayOptions = [
  { id: 'morning', name: '오전 (6-11시)', hours: '06:00-11:00' },
  { id: 'noon', name: '정오 (11-14시)', hours: '11:00-14:00' },
  { id: 'afternoon', name: '오후 (14-18시)', hours: '14:00-18:00' },
  { id: 'evening', name: '저녁 (18-21시)', hours: '18:00-21:00' },
  { id: 'night', name: '밤 (21시 이후)', hours: '21:00-06:00' },
];

const cameraTypes = [
  { id: 'iphone-pro', name: 'iPhone Pro', quality: 'high' },
  { id: 'iphone', name: 'iPhone (일반)', quality: 'medium' },
  { id: 'android-flagship', name: '안드로이드 플래그십', quality: 'high' },
  { id: 'android-mid', name: '안드로이드 (중급)', quality: 'medium' },
  { id: 'android-budget', name: '안드로이드 (보급형)', quality: 'low' },
  { id: 'webcam', name: '웹캠', quality: 'low' },
  { id: 'dslr', name: 'DSLR/미러리스', quality: 'professional' },
];

// 퍼스널 컬러 타입
const personalColorTypes = [
  { id: 'spring-warm', name: '봄 웜톤', color: '#FFB6C1', description: '밝고 화사한 색상이 어울림' },
  { id: 'summer-cool', name: '여름 쿨톤', color: '#B0C4DE', description: '부드럽고 시원한 색상이 어울림' },
  { id: 'autumn-warm', name: '가을 웜톤', color: '#DAA520', description: '깊고 따뜻한 색상이 어울림' },
  { id: 'winter-cool', name: '겨울 쿨톤', color: '#4169E1', description: '선명하고 차가운 색상이 어울림' },
];

interface AnalysisResult {
  personalColor: {
    type: string;
    confidence: number;
    subtype?: string;
    bestColors: string[];
    avoidColors: string[];
  };
  hairVolume: {
    level: string;
    score: number;
    description: string;
    recommendation: string;
  };
  faceAge: {
    estimated: number;
    range: string;
    factors: string[];
  };
  skinCondition: {
    overall: string;
    score: number;
    issues: string[];
    strengths: string[];
  };
  faceShape: {
    type: string;
    description: string;
    bestHairstyles: string[];
  };
  photoQuality: {
    lighting: string;
    focus: string;
    resolution: string;
    overall: number;
  };
}

export default function FaceAnalysis() {
  const navigate = useNavigate();
  const { myBasePhoto, setMyBasePhoto } = useAppStore();
  const [selectedLighting, setSelectedLighting] = useState('natural-day');
  const [selectedTime, setSelectedTime] = useState('afternoon');
  const [selectedCamera, setSelectedCamera] = useState('iphone-pro');
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMyBasePhoto(event.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI 분석 실행
  const runAnalysis = async () => {
    if (!myBasePhoto) return;

    setIsAnalyzing(true);

    try {
      // 실제로는 AI API를 호출하지만, 여기서는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 촬영 환경에 따른 분석 결과 보정
      const lighting = lightingOptions.find(l => l.id === selectedLighting);
      const camera = cameraTypes.find(c => c.id === selectedCamera);

      // 시뮬레이션된 분석 결과
      const result: AnalysisResult = {
        personalColor: {
          type: 'spring-warm',
          confidence: 78,
          subtype: '브라이트 스프링',
          bestColors: ['#FFB6C1', '#FFA07A', '#98FB98', '#FFDAB9', '#FFE4B5'],
          avoidColors: ['#000000', '#4B0082', '#2F4F4F', '#8B4513'],
        },
        hairVolume: {
          level: 'normal',
          score: 72,
          description: '평균 수준의 머리숱',
          recommendation: '현재 상태 유지를 위해 두피 관리 권장',
        },
        faceAge: {
          estimated: 28,
          range: '26-30세',
          factors: ['피부 탄력 양호', '눈가 미세 주름', '전체적으로 건강한 피부'],
        },
        skinCondition: {
          overall: 'good',
          score: 75,
          issues: ['T존 피지', '미세 모공'],
          strengths: ['균일한 피부톤', '양호한 탄력'],
        },
        faceShape: {
          type: '타원형',
          description: '이상적인 얼굴형으로 대부분의 스타일이 어울림',
          bestHairstyles: ['레이어드컷', '투블럭', '가르마펌'],
        },
        photoQuality: {
          lighting: lighting?.id.includes('natural') ? 'excellent' : 'good',
          focus: 'good',
          resolution: camera?.quality === 'professional' ? 'excellent' : camera?.quality === 'high' ? 'good' : 'fair',
          overall: 85,
        },
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderOverviewTab = () => {
    if (!analysisResult) return null;

    return (
      <div className="space-y-4">
        {/* Personal Color */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full"
              style={{ background: personalColorTypes.find(p => p.id === analysisResult.personalColor.type)?.color }}
            />
            <div>
              <h4 className="text-white font-semibold">퍼스널 컬러</h4>
              <p className="text-purple-400 text-sm">
                {personalColorTypes.find(p => p.id === analysisResult.personalColor.type)?.name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-2xl font-bold text-white">{analysisResult.personalColor.confidence}%</span>
              <p className="text-white/40 text-xs">신뢰도</p>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="text-white/60 text-xs">추천 색상:</span>
            {analysisResult.personalColor.bestColors.slice(0, 5).map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Face Age */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-semibold">추정 피부 나이</h4>
            <span className="text-3xl font-bold text-white">{analysisResult.faceAge.estimated}세</span>
          </div>
          <p className="text-white/50 text-sm">{analysisResult.faceAge.range} 범위로 추정</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {analysisResult.faceAge.factors.map((factor, i) => (
              <span key={i} className="px-2 py-1 bg-white/10 rounded text-white/70 text-xs">
                {factor}
              </span>
            ))}
          </div>
        </div>

        {/* Hair Volume */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">머리숱 분석</h4>
            <span className="text-xl font-bold text-white">{analysisResult.hairVolume.score}/100</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
              style={{ width: `${analysisResult.hairVolume.score}%` }}
            />
          </div>
          <p className="text-white/50 text-sm">{analysisResult.hairVolume.description}</p>
          <p className="text-purple-400 text-xs mt-1">{analysisResult.hairVolume.recommendation}</p>
        </div>

        {/* Skin Condition */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">피부 상태</h4>
            <span className="text-xl font-bold text-white">{analysisResult.skinCondition.score}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-white/40 text-xs mb-1">개선 필요</p>
              <div className="space-y-1">
                {analysisResult.skinCondition.issues.map((issue, i) => (
                  <span key={i} className="block px-2 py-1 bg-red-500/20 rounded text-red-300 text-xs">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">장점</p>
              <div className="space-y-1">
                {analysisResult.skinCondition.strengths.map((strength, i) => (
                  <span key={i} className="block px-2 py-1 bg-green-500/20 rounded text-green-300 text-xs">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Face Shape */}
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-white font-semibold mb-2">얼굴형</h4>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-white font-medium">{analysisResult.faceShape.type}</p>
              <p className="text-white/50 text-xs">{analysisResult.faceShape.description}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {analysisResult.faceShape.bestHairstyles.map((style, i) => (
              <span key={i} className="px-2 py-1 bg-purple-500/20 rounded text-purple-300 text-xs">
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* Photo Quality Warning */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-yellow-400 font-medium mb-1">촬영 품질 참고</h4>
              <p className="text-white/60 text-xs">
                {selectedLighting === 'natural-day' || selectedLighting === 'studio'
                  ? '좋은 조명 환경에서 촬영되어 분석 정확도가 높습니다.'
                  : '조명 환경에 따라 퍼스널 컬러 분석이 다소 부정확할 수 있습니다. 자연광 환경에서 재촬영을 권장합니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <h1 className="text-white font-semibold">얼굴 종합 진단</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-4 bg-white/5 border-b border-white/10">
          <h3 className="text-white font-semibold mb-3">촬영 환경 설정</h3>

          {/* Lighting */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2">조명 환경</p>
            <div className="grid grid-cols-3 gap-2">
              {lightingOptions.slice(0, 6).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedLighting(option.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedLighting === option.id
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-lg block">{option.icon}</span>
                  <span className="text-white text-[10px]">{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2">촬영 시간</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {timeOfDayOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedTime(option.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                    selectedTime === option.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Camera */}
          <div>
            <p className="text-white/60 text-xs mb-2">카메라 종류</p>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              {cameraTypes.map((camera) => (
                <option key={camera.id} value={camera.id} className="bg-gray-800">
                  {camera.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Photo Section */}
      <div className="p-4">
        {!myBasePhoto ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 bg-white/5"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-lg">사진을 추가해주세요</p>
              <p className="text-white/50 text-sm mt-1">정면 얼굴 사진이 정확한 분석에 좋아요</p>
            </div>
          </button>
        ) : (
          <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
            <img src={myBasePhoto} alt="My photo" className="w-full h-full object-cover" />

            {/* Scanning Animation */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4 mx-auto" />
                  <p className="text-white font-medium">AI 분석 중...</p>
                  <p className="text-white/50 text-sm">잠시만 기다려주세요</p>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" />
                </div>
              </div>
            )}

            {/* Change Photo Button */}
            {!isAnalyzing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Analysis Button or Results */}
        {myBasePhoto && !analysisResult && !isAnalyzing && (
          <button
            onClick={runAnalysis}
            className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl text-white font-medium flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔬</span>
            종합 분석 시작
          </button>
        )}

        {/* Results Tabs */}
        {analysisResult && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { id: 'overview', name: '종합', icon: '📊' },
                { id: 'color', name: '퍼스널컬러', icon: '🎨' },
                { id: 'hair', name: '머리숱', icon: '💇' },
                { id: 'skin', name: '피부', icon: '✨' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && renderOverviewTab()}

            {/* Re-analyze Button */}
            <button
              onClick={() => {
                setAnalysisResult(null);
              }}
              className="w-full mt-4 py-3 bg-white/10 rounded-xl text-white/60 font-medium"
            >
              다시 분석하기
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
