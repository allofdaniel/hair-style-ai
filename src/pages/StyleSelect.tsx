import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import type { HairStyle } from '../stores/useAppStore';
import { getCategories, getStylesByCategory, hairColors } from '../data/hairStyles';
import { analyzeReferencePhoto } from '../services/gemini';

type TabMode = 'preset' | 'custom';

// Image component with loading state
function StyleImage({ style, gender }: { style: HairStyle; gender: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [style.thumbnail]);

  if (hasError || !style.thumbnail) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
        <span className="text-5xl opacity-30">{gender === 'male' ? '👨' : '👩'}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={style.thumbnail}
        alt={style.nameKo}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </>
  );
}

export default function StyleSelect() {
  const navigate = useNavigate();
  const {
    gender, userPhoto, selectedStyle, setSelectedStyle,
    hairSettings, updateHairSettings, credits,
    referencePhoto, setReferencePhoto,
    referenceAnalysis, setReferenceAnalysis,
    useReferenceMode, setUseReferenceMode,
  } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tabMode, setTabMode] = useState<TabMode>('preset');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const refInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first category on load
  useEffect(() => {
    const categories = getCategories(gender);
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [gender, activeCategory]);

  const categories = getCategories(gender);
  const stylesInCategory = activeCategory ? getStylesByCategory(gender, activeCategory) : [];

  const handleStyleSelect = (style: HairStyle) => {
    setSelectedStyle(style);
    setUseReferenceMode(false);
  };

  const handleContinue = () => {
    if ((selectedStyle || (useReferenceMode && referencePhoto)) && credits > 0) {
      navigate('/processing');
    }
  };

  const handleReferenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setReferencePhoto(base64);
      setIsAnalyzing(true);

      try {
        const result = await analyzeReferencePhoto(base64);
        if (result.success && result.analysis) {
          setReferenceAnalysis(result.analysis);
          setUseReferenceMode(true);
          setSelectedStyle(null);
        } else {
          alert(result.error || 'Failed to analyze the photo');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        alert('Failed to analyze the reference photo');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearReference = () => {
    setReferencePhoto(null);
    setReferenceAnalysis(null);
    setUseReferenceMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] flex flex-col safe-area-top safe-area-bottom">
      {/* Compact Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => navigate('/camera')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            {viewMode === 'grid' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showSettings ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Photo & Credits Bar */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
        <div className="w-12 h-14 rounded-lg overflow-hidden bg-white/5 ring-2 ring-amber-500/30 flex-shrink-0">
          {userPhoto && <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />}
        </div>

        {referencePhoto && (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-500/50 flex-shrink-0">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-white/5 ring-2 ring-purple-500/30 flex-shrink-0">
              <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
              <button
                onClick={clearReference}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-[10px] text-white">×</span>
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Credits</p>
          <p className="text-xl font-light text-amber-400">{credits}</p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="px-4 py-2">
        <div className="flex bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setTabMode('preset')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              tabMode === 'preset'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            프리셋 스타일
          </button>
          <button
            onClick={() => setTabMode('custom')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              tabMode === 'custom'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            레퍼런스 업로드
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 pb-3 animate-in slide-in-from-top duration-300">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-white/10">
            <div>
              <label className="text-xs text-white/60 block mb-2">
                헤어 컬러
              </label>
              <div className="flex flex-wrap gap-1.5">
                {hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateHairSettings({ color: color.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      hairSettings.color === color.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {color.nameKo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-2">볼륨</label>
              <div className="flex gap-2">
                {[{ id: 'flat', label: '납작' }, { id: 'natural', label: '자연' }, { id: 'voluminous', label: '볼륨' }].map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => updateHairSettings({ volume: vol.id as 'flat' | 'natural' | 'voluminous' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      hairSettings.volume === vol.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {vol.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={refInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReferenceUpload}
      />

      {/* Preset Mode Content */}
      {tabMode === 'preset' && (
        <>
          {/* Category Tabs - Scrollable */}
          <div className="px-4 pb-2">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    activeCategory === category.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {category.nameKo}
                </button>
              ))}
            </div>
          </div>

          {/* Style Grid/List */}
          <main className="flex-1 overflow-y-auto px-4 pb-28">
            {activeCategory ? (
              viewMode === 'grid' ? (
                // Large Grid View
                <div className="grid grid-cols-2 gap-3">
                  {stylesInCategory.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style)}
                      className={`group relative bg-white/5 rounded-2xl overflow-hidden text-left transition-all duration-300 active:scale-[0.98] ${
                        selectedStyle?.id === style.id && !useReferenceMode
                          ? 'ring-3 ring-amber-500 shadow-xl shadow-amber-500/30'
                          : 'border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Large Thumbnail */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <StyleImage style={style} gender={gender} />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                        {/* Selection Check */}
                        {selectedStyle?.id === style.id && !useReferenceMode && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-bold text-base mb-0.5 drop-shadow-lg">{style.nameKo}</h3>
                        <p className="text-white/60 text-xs">{style.name}</p>
                        {style.celebrities && style.celebrities.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            <p className="text-amber-400/80 text-[10px] truncate">
                              {style.celebrities.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // List View - Larger items for easier selection
                <div className="space-y-2">
                  {stylesInCategory.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 active:scale-[0.99] ${
                        selectedStyle?.id === style.id && !useReferenceMode
                          ? 'bg-amber-500/20 ring-2 ring-amber-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        <StyleImage style={style} gender={gender} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-white font-bold text-lg">{style.nameKo}</h3>
                        <p className="text-white/50 text-sm mb-1">{style.name}</p>
                        {style.celebrities && style.celebrities.length > 0 && (
                          <div className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            <p className="text-amber-400/70 text-xs truncate">
                              {style.celebrities.join(', ')}
                            </p>
                          </div>
                        )}
                        <p className="text-white/40 text-xs mt-1 line-clamp-2">{style.description}</p>
                      </div>

                      {/* Selection indicator */}
                      {selectedStyle?.id === style.id && !useReferenceMode ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-white/40 text-center">
                  위에서 카테고리를<br />선택해주세요
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* Custom Reference Mode Content */}
      {tabMode === 'custom' && (
        <main className="flex-1 overflow-y-auto px-4 pb-28">
          <div className="py-4">
            <p className="text-white/50 text-sm text-center mb-4">
              원하는 헤어스타일 사진을 업로드하세요.<br />
              AI가 분석해서 적용해드립니다.
            </p>

            {!referencePhoto ? (
              <button
                onClick={() => refInputRef.current?.click()}
                className="w-full aspect-[4/3] max-w-sm mx-auto rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <p className="text-purple-400 font-medium mb-1">레퍼런스 사진 업로드</p>
                <p className="text-white/40 text-xs">연예인 사진, 원하는 헤어스타일 사진</p>
              </button>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 max-w-sm mx-auto border border-white/10">
                {isAnalyzing ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400 animate-spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                    <p className="text-white/80">헤어스타일 분석 중...</p>
                  </div>
                ) : referenceAnalysis ? (
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                        <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-purple-400 mb-0.5 uppercase tracking-wider">Detected Style</p>
                        <p className="text-white font-bold text-lg leading-tight">{referenceAnalysis.styleNameKo}</p>
                        <p className="text-white/40 text-sm">{referenceAnalysis.styleName}</p>
                      </div>
                    </div>

                    <p className="text-white/60 text-sm mb-3 leading-relaxed">{referenceAnalysis.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {referenceAnalysis.characteristics.slice(0, 4).map((char, i) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded-md text-xs text-white/70">
                          {char}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => refInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 transition-colors"
                    >
                      다른 사진 선택
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/98 to-transparent pt-8 pb-5 px-4 safe-area-bottom">
        {/* Selected style preview */}
        {(selectedStyle || (useReferenceMode && referenceAnalysis)) && (
          <div className="mb-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              {useReferenceMode && referencePhoto ? (
                <img src={referencePhoto} alt="Selected" className="w-full h-full object-cover" />
              ) : selectedStyle?.thumbnail ? (
                <img src={selectedStyle.thumbnail} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg opacity-30">{gender === 'male' ? '👨' : '👩'}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Selected</p>
              <p className="text-white font-medium truncate">
                {useReferenceMode ? referenceAnalysis?.styleNameKo : selectedStyle?.nameKo}
              </p>
            </div>
            <button
              onClick={() => {
                if (useReferenceMode) {
                  clearReference();
                } else {
                  setSelectedStyle(null);
                }
              }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={(!selectedStyle && !useReferenceMode) || credits === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            (selectedStyle || useReferenceMode) && credits > 0
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-[0.98]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {credits === 0 ? '크레딧 없음' : '변환하기 ✨'}
        </button>
      </div>
    </div>
  );
}
