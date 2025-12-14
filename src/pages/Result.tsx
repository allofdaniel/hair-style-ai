import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { addWatermark } from '../services/watermark';

type ViewMode = 'result' | 'compare' | 'slider';

export default function Result() {
  const navigate = useNavigate();
  const { userPhoto, resultImage, selectedStyle, reset, isPremium, referenceAnalysis, useReferenceMode } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('result');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Apply watermark for free users
  useEffect(() => {
    if (resultImage && !isPremium()) {
      setIsLoading(true);
      addWatermark(resultImage)
        .then(watermarkedImage => {
          setDisplayImage(watermarkedImage);
          setIsLoading(false);
        })
        .catch(() => {
          setDisplayImage(resultImage);
          setIsLoading(false);
        });
    } else {
      setDisplayImage(resultImage);
    }
  }, [resultImage, isPremium]);

  const showWatermarkBanner = !isPremium();
  const styleName = useReferenceMode ? referenceAnalysis?.styleNameKo : selectedStyle?.nameKo;
  const styleNameEn = useReferenceMode ? referenceAnalysis?.styleName : selectedStyle?.name;

  const handleNewStyle = () => navigate('/style-select');
  const handleStartOver = () => { reset(); navigate('/'); };

  const handleSave = async () => {
    if (!displayImage) return;
    try {
      const link = document.createElement('a');
      link.href = displayImage;
      link.download = `hairstyle-${styleName || 'result'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!displayImage) return;
    try {
      if (navigator.share) {
        const response = await fetch(displayImage);
        const blob = await response.blob();
        const file = new File([blob], 'hairstyle.png', { type: 'image/png' });
        await navigator.share({
          title: 'My New Hairstyle',
          text: `Check out my ${styleName} style! Made with HairStyle AI`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText('Check out HairStyle AI for amazing hairstyle previews!');
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Touch slider handling
  const handleSliderTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  if (!resultImage || !userPhoto || !displayImage || isLoading) {
    if (!resultImage || !userPhoto) {
      navigate('/');
      return null;
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Preparing your result...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] flex flex-col safe-area-top safe-area-bottom">
      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-2 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Saved successfully!
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <button
          onClick={handleStartOver}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Your Transformation</h1>
        <button
          onClick={handleShare}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
        </button>
      </header>

      {/* View Mode Tabs */}
      <div className="px-5 pb-4">
        <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
          {[
            { id: 'result', label: 'Result', icon: '✨' },
            { id: 'compare', label: 'Compare', icon: '⚡' },
            { id: 'slider', label: 'Slider', icon: '↔' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as ViewMode)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5 ${
                viewMode === mode.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-5 pb-4">
        {viewMode === 'result' && (
          <div className="h-full">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 relative shadow-2xl">
              <img src={displayImage} alt="Result" className="w-full h-full object-cover" />
              {showWatermarkBanner && (
                <div className="absolute top-3 left-3 right-3">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                      <span className="text-white text-sm font-medium">Remove watermark</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="h-full flex gap-3">
            <div className="flex-1">
              <div className="bg-white/5 rounded-t-xl px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-xs text-white/60 font-medium">Before</p>
              </div>
              <div className="aspect-[3/4] rounded-b-2xl overflow-hidden bg-white/5">
                <img src={userPhoto} alt="Before" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-t-xl px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-xs text-white font-medium">After</p>
              </div>
              <div className="aspect-[3/4] rounded-b-2xl overflow-hidden bg-white/5 ring-2 ring-purple-500/30">
                <img src={displayImage} alt="After" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'slider' && (
          <div className="h-full">
            <div
              ref={sliderRef}
              className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 shadow-2xl cursor-ew-resize touch-none"
              onMouseDown={(e) => {
                handleSliderTouch(e);
                const handleMove = (ev: MouseEvent) => handleSliderTouch(ev as unknown as React.MouseEvent);
                const handleUp = () => {
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
              onTouchStart={handleSliderTouch}
              onTouchMove={handleSliderTouch}
            >
              {/* Before image (full) */}
              <img src={userPhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover" />

              {/* After image (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img src={displayImage} alt="After" className="w-full h-full object-cover" />
              </div>

              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a12" strokeWidth="2.5">
                    <path d="M18 8l4 4-4 4M6 8l-4 4 4 4"/>
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white/90 font-medium">
                Before
              </div>
              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white font-medium">
                After
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Style Info Card */}
      {(selectedStyle || (useReferenceMode && referenceAnalysis)) && (
        <div className="px-5 pb-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 mb-0.5">Applied Style</p>
                <p className="text-white font-semibold truncate">{styleName}</p>
                <p className="text-white/50 text-xs truncate">{styleNameEn}</p>
              </div>
              {selectedStyle?.celebrities && selectedStyle.celebrities.length > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <p className="text-amber-400 text-xs">{selectedStyle.celebrities[0]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-5 space-y-3 safe-area-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Save
          </button>
          <button
            onClick={handleNewStyle}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-[0.98]"
          >
            <span>✨</span>
            Try Another
          </button>
        </div>
        <button
          onClick={handleStartOver}
          className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
