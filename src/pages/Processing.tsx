/**
 * Processing 페이지 - iOS/토스 스타일
 * - 부드러운 애니메이션
 * - 백그라운드로 전환 가능
 * - 사용자 경험 최적화
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { applyHairOverlay } from '../services/hairOverlayService';
import { hairStyles } from '../data/hairStyles';
import { saveHistory, compressImage } from '../services/storage';
import { useI18n } from '../i18n/useI18n';

interface ProcessingResult {
  styleId: string;
  styleName: string;
  resultImage: string;
  backViewImage?: string;  // 뒷머리 이미지
}

// AI 생성 중 표시할 팁들
const AI_TIPS = [
  { icon: '✨', text: 'AI가 당신의 얼굴 특징을 분석하고 있어요' },
  { icon: '🎨', text: '선택한 헤어스타일을 자연스럽게 적용 중이에요' },
  { icon: '💇', text: '머리카락 결과 디테일을 조정하고 있어요' },
  { icon: '🪄', text: '마무리 터치를 더하는 중이에요' },
  { icon: '📸', text: '최상의 결과를 위해 조금만 기다려주세요' },
];

export default function Processing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { userPhoto, hairSettings, setResultImage, setIsProcessing, selectedStyle } = useAppStore();

  const [progress, setProgress] = useState(0);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [currentStyleName, setCurrentStyleName] = useState('');
  const [totalStyles, setTotalStyles] = useState(1);
  const [currentTip, setCurrentTip] = useState(0);
  const processingRef = useRef(false);

  // 팁 로테이션
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % AI_TIPS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);


  useEffect(() => {
    if (!userPhoto || processingRef.current) {
      if (!userPhoto) navigate('/');
      return;
    }

    processingRef.current = true;

    const savedStyleIds = localStorage.getItem('selectedStyleIds');
    let styleIds: string[] = [];
    if (savedStyleIds) {
      try { styleIds = JSON.parse(savedStyleIds); } catch { styleIds = selectedStyle ? [selectedStyle.id] : []; }
    } else if (selectedStyle) {
      styleIds = [selectedStyle.id];
    }

    if (styleIds.length === 0) { navigate('/'); return; }
    setTotalStyles(styleIds.length);

    let isCancelled = false;

    const processAllStyles = async () => {
      setIsProcessing(true);
      const processedResults: ProcessingResult[] = [];

      for (let i = 0; i < styleIds.length; i++) {
        if (isCancelled) return;

        const styleId = styleIds[i];
        const style = hairStyles.find(s => s.id === styleId);
        if (!style) continue;

        setCurrentStyleIndex(i);
        setCurrentStyleName(style.nameKo);

        const baseProgress = (i / styleIds.length) * 100;
        setProgress(baseProgress + 10);

        try {
          // 진행률 시뮬레이션
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              const maxProgress = baseProgress + 85;
              if (prev >= maxProgress) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + Math.random() * 5;
            });
          }, 500);

          const result = await applyHairOverlay({ userPhoto, style, settings: hairSettings });

          clearInterval(progressInterval);

          if (isCancelled) return;
          setProgress(baseProgress + 95);

          if (result.success && result.resultImage) {
            processedResults.push({
              styleId: style.id,
              styleName: style.nameKo,
              resultImage: result.resultImage,
              backViewImage: result.backViewImage,  // 뒷머리 이미지 추가
            });

            try {
              const compressedOriginal = await compressImage(userPhoto, 600, 0.8);
              const compressedResult = await compressImage(result.resultImage, 600, 0.8);
              await saveHistory({
                original: compressedOriginal,
                result: compressedResult,
                styleName: style.name,
                styleNameKo: style.nameKo,
                date: new Date().toISOString(),
              });
            } catch (storageError) {
              console.warn('히스토리 저장 실패:', storageError);
            }
          }
        } catch (error) {
          console.error(`Error processing style ${style.name}:`, error);
        }

        setProgress(((i + 1) / styleIds.length) * 100);
      }

      if (isCancelled) return;

      if (processedResults.length > 0) {
        setResultImage(processedResults[0].resultImage);
        localStorage.setItem('multiResults', JSON.stringify(processedResults));
        localStorage.removeItem('selectedStyleIds');
        navigate('/result');
      } else {
        alert(t('generation_failed'));
        navigate('/');
      }

      setIsProcessing(false);
    };

    processAllStyles();
    return () => { isCancelled = true; };
  }, []);


  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
      {/* 메인 콘텐츠 */}
      <div className="w-full max-w-sm text-center">
        {/* 애니메이션 로더 */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* 외부 링 */}
          <svg className="w-32 h-32 -rotate-90 animate-spin" style={{ animationDuration: '3s' }}>
            <circle
              cx="64" cy="64" r="56"
              fill="none"
              stroke="#f2f4f6"
              strokeWidth="8"
            />
            <circle
              cx="64" cy="64" r="56"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${progress * 3.52} 352`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3182f6" />
                <stop offset="100%" stopColor="#6b5ce7" />
              </linearGradient>
            </defs>
          </svg>

          {/* 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl animate-pulse transition-all duration-500">
              {AI_TIPS[currentTip].icon}
            </div>
          </div>
        </div>

        {/* 진행률 */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {totalStyles > 1 && (
              <span className="text-[13px] font-medium text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-full">
                {currentStyleIndex + 1}/{totalStyles}
              </span>
            )}
            <span className="text-[28px] font-bold bg-gradient-to-r from-[#3182f6] to-[#6b5ce7] bg-clip-text text-transparent">
              {Math.round(progress)}%
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div className="h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3182f6] to-[#6b5ce7] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 현재 스타일 */}
        {currentStyleName && (
          <p className="text-[17px] font-semibold text-[#191f28] mb-2 animate-fade-in">
            {currentStyleName}
          </p>
        )}

        {/* AI 팁 */}
        <p className="text-[14px] text-[#8b95a1] min-h-[40px] transition-all duration-500 animate-fade-in" key={currentTip}>
          {AI_TIPS[currentTip].text}
        </p>

        {/* 멀티 스타일 인디케이터 */}
        {totalStyles > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalStyles }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx < currentStyleIndex
                    ? 'bg-[#00c471] scale-100'
                    : idx === currentStyleIndex
                    ? 'bg-[#3182f6] scale-125 animate-pulse'
                    : 'bg-[#e5e8eb] scale-100'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <p className="absolute bottom-8 text-[13px] text-[#b0b8c1]">
        {t('please_wait') || '잠시만 기다려주세요...'}
      </p>
    </div>
  );
}
