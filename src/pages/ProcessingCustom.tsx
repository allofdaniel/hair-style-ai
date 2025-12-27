import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { generateCustomHairStyle } from '../services/openai';

export default function ProcessingCustom() {
  const navigate = useNavigate();
  const {
    userPhoto,
    customSettings,
    setResultImage,
    setIsProcessing,
    setUseCustomMode,
  } = useAppStore();

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('설정 분석 중...');

  useEffect(() => {
    if (!userPhoto) {
      navigate('/');
      return;
    }

    let isCancelled = false;

    const processCustomStyle = async () => {
      setIsProcessing(true);

      try {
        setProgress(10);
        setStatusText('커스텀 설정 적용 중...');

        await new Promise((r) => setTimeout(r, 500));
        if (isCancelled) return;

        setProgress(30);
        setStatusText('AI 이미지 생성 중...');

        const result = await generateCustomHairStyle({
          userPhoto,
          customSettings,
        });

        if (isCancelled) return;

        setProgress(90);
        setStatusText('마무리 중...');

        if (result.success && result.resultImage) {
          setResultImage(result.resultImage);

          // 결과를 localStorage에 저장
          localStorage.setItem(
            'multiResults',
            JSON.stringify([
              {
                styleId: 'custom',
                styleName: '커스텀 스타일',
                resultImage: result.resultImage,
              },
            ])
          );

          setProgress(100);
          await new Promise((r) => setTimeout(r, 300));

          navigate('/result');
        } else {
          alert(result.error || '스타일 생성에 실패했습니다. 다시 시도해주세요.');
          navigate('/custom');
        }
      } catch (error) {
        console.error('Error processing custom style:', error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
        navigate('/custom');
      } finally {
        setIsProcessing(false);
        setUseCustomMode(false);
      }
    };

    processCustomStyle();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Progress ring */}
        <div className="relative w-52 h-52 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="104" cy="104" r="92" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
            <circle
              cx="104"
              cy="104"
              r="92"
              stroke="url(#progressGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 92}
              strokeDashoffset={2 * Math.PI * 92 * (1 - progress / 100)}
              className="transition-all duration-300 ease-out"
              style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white animate-pulse">
                  <path
                    d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">커스텀 스타일 생성 중</h2>
          <p className="text-white/60">{statusText}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full mb-8">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Settings summary */}
        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-white/80 text-sm font-medium mb-2">적용 설정</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-white/40">앞머리: <span className="text-white/70">{customSettings.frontLength}cm</span></div>
            <div className="text-white/40">옆머리: <span className="text-white/70">{customSettings.sideLength}cm</span></div>
            <div className="text-white/40">윗머리: <span className="text-white/70">{customSettings.topLength}cm</span></div>
            <div className="text-white/40">뒷머리: <span className="text-white/70">{customSettings.backLength}cm</span></div>
            {customSettings.perm.type !== 'none' && (
              <div className="text-white/40 col-span-2">
                펌: <span className="text-purple-400">{customSettings.perm.type}</span>
              </div>
            )}
            {customSettings.undercut.enabled && (
              <div className="text-white/40 col-span-2">
                투블럭: <span className="text-purple-400">{customSettings.undercut.height}mm</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-4 text-xs text-white/30 text-center">
          잠시만 기다려주세요 • 약 15-30초 소요
        </p>
      </div>
    </div>
  );
}
