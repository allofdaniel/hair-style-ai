/**
 * Processing Page - Apple HIG Style
 *
 * Design Principles:
 * - Clean, minimal interface
 * - Smooth animations
 * - Clear progress indication
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
  backViewImage?: string;
}

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

  // Tip rotation
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
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              const maxProgress = Math.min(baseProgress + 85, 99);
              if (prev >= maxProgress) {
                clearInterval(progressInterval);
                return maxProgress;
              }
              return Math.min(prev + Math.random() * 5, maxProgress);
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
              backViewImage: result.backViewImage,
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
              console.warn('History save failed:', storageError);
            }
          }
        } catch (error) {
          console.error(`Error processing style ${style.name}:`, error);
        }

        setProgress(Math.min(((i + 1) / styleIds.length) * 100, 100));
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
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
      {/* Main Content */}
      <div className="w-full max-w-sm text-center">
        {/* Animated Loader - Apple HIG Style */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Outer Ring */}
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle
              cx="56" cy="56" r="48"
              fill="none"
              stroke="var(--color-gray-5)"
              strokeWidth="6"
            />
            <circle
              cx="56" cy="56" r="48"
              fill="none"
              stroke="var(--color-blue)"
              strokeWidth="6"
              strokeDasharray={`${progress * 3.02} 302`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-pulse transition-all duration-500">
              {AI_TIPS[currentTip].icon}
            </span>
          </div>
        </div>

        {/* Progress Display */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {totalStyles > 1 && (
              <span className="text-caption-1 font-medium text-[var(--color-label-tertiary)] bg-[var(--color-fill-secondary)] px-2 py-1 rounded-full">
                {currentStyleIndex + 1}/{totalStyles}
              </span>
            )}
            <span className="text-title-1 font-bold text-[var(--color-blue)]">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-[var(--color-gray-5)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-blue)] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Style */}
        {currentStyleName && (
          <p className="text-headline font-semibold text-label mb-2 animate-fade-in">
            {currentStyleName}
          </p>
        )}

        {/* AI Tip */}
        <p className="text-subheadline text-[var(--color-label-secondary)] min-h-[40px] transition-all duration-500 animate-fade-in" key={currentTip}>
          {AI_TIPS[currentTip].text}
        </p>

        {/* Multi Style Indicator */}
        {totalStyles > 1 && (
          <div className="flex justify-center gap-1.5 mt-8">
            {Array.from({ length: totalStyles }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx < currentStyleIndex
                    ? 'bg-[var(--color-green)]'
                    : idx === currentStyleIndex
                    ? 'bg-[var(--color-blue)] scale-125'
                    : 'bg-[var(--color-gray-4)]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Notice */}
      <p className="absolute bottom-8 text-footnote text-[var(--color-label-tertiary)] safe-area-bottom">
        {t('please_wait') || '잠시만 기다려주세요...'}
      </p>
    </div>
  );
}
