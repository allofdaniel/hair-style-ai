/**
 * 헤어스타일 미세 조정 패널
 * 슬라이더로 옆머리 길이, 볼륨, 머리 올림 등 조절
 */

import { useState } from 'react';
import { refinementOptions, refineHairstyle, type RefinementOption } from '../services/hairRefinement';

interface HairRefinementPanelProps {
  resultImage: string;
  userPhoto: string;
  styleName: string;
  onRefinementComplete: (newImage: string) => void;
  onClose: () => void;
  language?: 'ko' | 'en';
}

export default function HairRefinementPanel({
  resultImage,
  userPhoto,
  styleName,
  onRefinementComplete,
  onClose,
  language = 'ko',
}: HairRefinementPanelProps) {
  const [adjustments, setAdjustments] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    refinementOptions.forEach(opt => {
      initial[opt.id] = opt.default || 0;
    });
    return initial;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSliderChange = (optionId: string, value: number) => {
    setAdjustments(prev => ({ ...prev, [optionId]: value }));
  };

  const handleApply = async () => {
    // 변경된 조정값만 필터링
    const changedAdjustments: Record<string, number> = {};
    for (const [key, value] of Object.entries(adjustments)) {
      if (value !== 0) {
        changedAdjustments[key] = value;
      }
    }

    if (Object.keys(changedAdjustments).length === 0) {
      setError(language === 'ko' ? '조정할 항목을 선택해주세요' : 'Please select adjustments');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const result = await refineHairstyle({
      resultImage,
      userPhoto,
      adjustments: changedAdjustments,
      styleName,
    });

    setIsProcessing(false);

    if (result.success && result.resultImage) {
      onRefinementComplete(result.resultImage);
    } else {
      setError(result.error || (language === 'ko' ? '미세 조정에 실패했습니다' : 'Refinement failed'));
    }
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    refinementOptions.forEach(opt => {
      initial[opt.id] = opt.default || 0;
    });
    setAdjustments(initial);
    setError(null);
  };

  const hasChanges = Object.values(adjustments).some(v => v !== 0);

  const getLabel = (opt: RefinementOption) => language === 'ko' ? opt.labelKo : opt.labelEn;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
      <div className="w-full max-h-[85vh] bg-gradient-to-b from-[#1a1a24] to-[#0f0f1a] rounded-t-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1a24] to-transparent z-10 px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="text-white/60 text-[15px]"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
            <h2 className="text-[17px] font-semibold text-white">
              {language === 'ko' ? '미세 조정' : 'Fine Tuning'}
            </h2>
            <button
              onClick={handleReset}
              className="text-purple-400 text-[15px]"
            >
              {language === 'ko' ? '초기화' : 'Reset'}
            </button>
          </div>

          {/* Preview Images */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs text-white/40 text-center mb-2">
                {language === 'ko' ? '현재' : 'Current'}
              </p>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5">
                <img src={resultImage} alt="Current" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-40">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/40 text-center mb-2">
                {language === 'ko' ? '조정 후' : 'After'}
              </p>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-xs text-white/40">{language === 'ko' ? '생성 중...' : 'Generating...'}</p>
                  </div>
                ) : (
                  <p className="text-xs text-white/30 text-center px-3">
                    {language === 'ko' ? '아래 슬라이더로 조정 후\n적용 버튼을 눌러주세요' : 'Adjust sliders below\nand tap Apply'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="px-5 pb-5 overflow-y-auto max-h-[40vh]">
          <div className="space-y-5">
            {refinementOptions.map((option) => (
              <div key={option.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-medium text-white">{getLabel(option)}</span>
                  <span className={`text-[13px] ${adjustments[option.id] !== 0 ? 'text-purple-400' : 'text-white/40'}`}>
                    {adjustments[option.id] !== 0 ? `${adjustments[option.id] > 0 ? '+' : ''}${adjustments[option.id]}` : (language === 'ko' ? '기본' : 'Default')}
                  </span>
                </div>

                {/* Slider Bar */}
                <div className="relative">
                  <div className="h-10 bg-white/10 rounded-lg relative overflow-hidden">
                    {/* Center indicator */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />

                    {/* Fill bar */}
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
                      style={{
                        left: adjustments[option.id] < 0 ? `${50 + adjustments[option.id]}%` : '50%',
                        width: `${Math.abs(adjustments[option.id])}%`,
                      }}
                    />

                    {/* Labels - 각 옵션에 맞는 라벨 사용 */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-[12px] text-white/40">
                      <span>{option.minLabel ? option.minLabel[language] : (language === 'ko' ? '적게' : 'Less')}</span>
                      <span>{option.maxLabel ? option.maxLabel[language] : (language === 'ko' ? '많게' : 'More')}</span>
                    </div>
                  </div>

                  {/* Slider input */}
                  <input
                    type="range"
                    min={option.min}
                    max={option.max}
                    value={adjustments[option.id]}
                    onChange={(e) => handleSliderChange(option.id, parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 pb-3">
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="p-5 safe-area-bottom">
          <button
            onClick={handleApply}
            disabled={!hasChanges || isProcessing}
            className={`w-full h-14 rounded-2xl font-semibold text-[16px] transition-all flex items-center justify-center gap-2 ${
              hasChanges && !isProcessing
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-white/40'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {language === 'ko' ? '조정 중...' : 'Refining...'}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18M3 12h18" />
                </svg>
                {language === 'ko' ? '미세 조정 적용하기' : 'Apply Refinements'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
