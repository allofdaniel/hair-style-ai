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
import { useI18n, type TranslationKey } from '../i18n/useI18n';
import Toast from '../components/Toast';

interface ProcessingResult {
  styleId: string;
  styleName: string;
  resultImage: string;
  backViewImage?: string;
}

const AI_TIPS_KEYS = [
  { icon: '✨', key: 'ai_tip_analyzing' },
  { icon: '🎨', key: 'ai_tip_applying' },
  { icon: '💇', key: 'ai_tip_quality' },
  { icon: '🪄', key: 'ai_tip_almost' },
  { icon: '📸', key: 'ai_tip_finalizing' },
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
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRetryButton, setShowRetryButton] = useState(false);
  const processingRef = useRef(false);
  const cancelRef = useRef(false);

  // 취소 버튼 핸들러
  const handleCancel = () => {
    cancelRef.current = true;
    setIsProcessing(false);
    navigate('/');
  };

  // 재시도 버튼 핸들러
  const handleRetry = () => {
    setShowRetryButton(false);
    setShowErrorToast(false);
    setErrorMessage('');
    setProgress(0);
    processingRef.current = false;
    cancelRef.current = false;
    // 페이지 리로드로 재시도
    window.location.reload();
  };

  // Tip rotation
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % AI_TIPS_KEYS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    if (!userPhoto || processingRef.current) {
      if (!userPhoto) navigate('/');
      return;
    }

    processingRef.current = true;

    let styleIds: string[] = [];
    try {
      const savedStyleIds = localStorage.getItem('selectedStyleIds');
      if (savedStyleIds) {
        try { styleIds = JSON.parse(savedStyleIds); } catch { styleIds = selectedStyle ? [selectedStyle.id] : []; }
      } else if (selectedStyle) {
        styleIds = [selectedStyle.id];
      }
    } catch (storageErr) {
      console.warn('Failed to read selectedStyleIds from localStorage:', storageErr);
      if (selectedStyle) styleIds = [selectedStyle.id];
    }

    if (styleIds.length === 0) { navigate('/'); return; }
    setTotalStyles(styleIds.length);

    let isCancelled = false;

    const processAllStyles = async () => {
      setIsProcessing(true);
      const processedResults: ProcessingResult[] = [];

      for (let i = 0; i < styleIds.length; i++) {
        if (isCancelled || cancelRef.current) return;

        const styleId = styleIds[i];
        const style = hairStyles.find(s => s.id === styleId);
        if (!style) continue;

        setCurrentStyleIndex(i);
        setCurrentStyleName(style.nameKo);

        const baseProgress = (i / styleIds.length) * 100;
        setProgress(baseProgress + 10);

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

        try {
          console.log('>>> Starting applyHairOverlay...');
          const result = await applyHairOverlay({ userPhoto, style, settings: hairSettings });
          console.log('>>> applyHairOverlay returned:', result.success);

          clearInterval(progressInterval);
          console.log('>>> Interval cleared');

          if (isCancelled || cancelRef.current) return;
          console.log('>>> Setting progress to 95%');
          setProgress(baseProgress + 95);

          if (result.success && result.resultImage) {
            console.log('>>> Result success, resultImage length:', result.resultImage.length);
            processedResults.push({
              styleId: style.id,
              styleName: style.nameKo,
              resultImage: result.resultImage,
              backViewImage: result.backViewImage,
            });

            try {
              if (isCancelled || cancelRef.current) return;
              console.log('>>> Compressing original...');
              const compressedOriginal = await compressImage(userPhoto, 600, 0.8);
              if (isCancelled || cancelRef.current) return;
              console.log('>>> Original compressed, length:', compressedOriginal.length);
              console.log('>>> Compressing result...');
              const compressedResult = await compressImage(result.resultImage, 600, 0.8);
              if (isCancelled || cancelRef.current) return;
              console.log('>>> Result compressed, length:', compressedResult.length);
              console.log('>>> Saving history...');
              await saveHistory({
                original: compressedOriginal,
                result: compressedResult,
                styleName: style.name,
                styleNameKo: style.nameKo,
                date: new Date().toISOString(),
              });
              if (isCancelled || cancelRef.current) return;
              console.log('>>> History saved!');
            } catch (storageError) {
              console.warn('>>> History save failed:', storageError);
            }
            console.log('>>> Style processing complete!');
          } else {
            console.error(`Style ${style.name} failed:`, result.error);
            setErrorMessage(result.error || '이미지 생성 실패');
            setShowErrorToast(true);
            setShowRetryButton(true);
          }
        } catch (error) {
          console.error(`Error processing style ${style.name}:`, error);
          setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류');
          setShowErrorToast(true);
          setShowRetryButton(true);
        } finally {
          clearInterval(progressInterval);
        }

        setProgress(Math.min(((i + 1) / styleIds.length) * 100, 100));
      }

      if (isCancelled) return;

      console.log('>>> All styles processed. Results count:', processedResults.length);
      if (processedResults.length > 0) {
        console.log('>>> Setting result image and navigating...');
        setResultImage(processedResults[0].resultImage);
        try {
          localStorage.setItem('multiResults', JSON.stringify(processedResults));
          localStorage.removeItem('selectedStyleIds');
        } catch (storageErr) {
          console.warn('Failed to save results to localStorage:', storageErr);
        }
        console.log('>>> Navigating to /result');
        navigate('/result');
      } else {
        console.log('>>> No results, showing error');
        setShowErrorToast(true);
        setTimeout(() => navigate('/'), 2000);
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
              {AI_TIPS_KEYS[currentTip].icon}
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
          {t(AI_TIPS_KEYS[currentTip].key as TranslationKey)}
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

      {/* Bottom Buttons */}
      <div className="absolute bottom-8 flex flex-col items-center gap-3 safe-area-bottom">
        {showRetryButton ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl bg-[var(--color-fill-secondary)] text-[var(--color-label-secondary)] font-medium transition-all active:scale-95"
            >
              {t('cancel') || '취소'}
            </button>
            <button
              onClick={handleRetry}
              className="px-6 py-3 rounded-xl bg-[var(--color-blue)] text-white font-medium transition-all active:scale-95"
            >
              {t('retry') || '다시 시도'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-footnote text-[var(--color-label-tertiary)]">
              {t('please_wait') || '잠시만 기다려주세요...'}
            </p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-footnote text-[var(--color-label-tertiary)] underline transition-opacity hover:opacity-70"
            >
              {t('cancel') || '취소'}
            </button>
          </>
        )}
      </div>

      {/* Error Toast */}
      <Toast
        message={errorMessage || t('generation_failed')}
        type="error"
        visible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
      />
    </div>
  );
}
