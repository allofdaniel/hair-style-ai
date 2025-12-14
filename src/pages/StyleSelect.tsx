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
        <span className="text-4xl opacity-30">{gender === 'male' ? '👨' : '👩'}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
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
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
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
      {/* Elegant Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => navigate('/camera')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-lg font-light tracking-wide text-white/90">Select Style</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showSettings ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      {/* Photo Preview Bar */}
      <div className="px-5 py-4 flex items-center gap-4 border-b border-white/5">
        <div className="relative">
          <div className="w-16 h-20 rounded-xl overflow-hidden bg-white/5 ring-2 ring-amber-500/30">
            {userPhoto && <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-[10px] text-black font-bold">YOU</span>
          </div>
        </div>

        {referencePhoto && (
          <>
            <div className="flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-500/50">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="relative">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-white/5 ring-2 ring-purple-500/30">
                <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={clearReference}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <span className="text-xs text-white">×</span>
              </button>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">REF</span>
              </div>
            </div>
          </>
        )}

        <div className="flex-1 text-right">
          <p className="text-xs text-white/40">Credits</p>
          <p className="text-lg font-light text-amber-400">{credits}</p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="px-5 py-3">
        <div className="flex bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => setTabMode('preset')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              tabMode === 'preset'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Preset Styles
          </button>
          <button
            onClick={() => setTabMode('custom')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              tabMode === 'custom'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Custom Reference
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-5 pb-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 space-y-5 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Hair Settings</h3>
              <span className="text-xs text-white/40">Customize your look</span>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-3">
                Hair Length: <span className="text-amber-400">{hairSettings.length.top}cm</span>
              </label>
              <input
                type="range" min="1" max="30" value={hairSettings.length.top}
                onChange={(e) => updateHairSettings({ length: { ...hairSettings.length, top: Number(e.target.value) } })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:to-orange-500 [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-3">Hair Color</label>
              <div className="flex flex-wrap gap-2">
                {hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateHairSettings({ color: color.id })}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
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
              <label className="text-sm text-white/60 block mb-3">Volume</label>
              <div className="flex gap-2">
                {[{ id: 'flat', label: '납작' }, { id: 'natural', label: '자연' }, { id: 'voluminous', label: '볼륨' }].map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => updateHairSettings({ volume: vol.id as 'flat' | 'natural' | 'voluminous' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
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
          {/* Category Pills */}
          <div className="px-5 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                  }`}
                >
                  {category.nameKo}
                </button>
              ))}
            </div>
          </div>

          {/* Style Grid */}
          <main className="flex-1 overflow-y-auto px-5 pb-32">
            {activeCategory ? (
              <div className="grid grid-cols-2 gap-3">
                {stylesInCategory.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    className={`group relative bg-white/5 rounded-2xl overflow-hidden text-left transition-all duration-300 hover:bg-white/10 active:scale-[0.98] ${
                      selectedStyle?.id === style.id && !useReferenceMode
                        ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
                        : 'border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <StyleImage
                        style={style}
                        gender={gender}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                      {/* Selection Indicator */}
                      {selectedStyle?.id === style.id && !useReferenceMode && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Info Section */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold text-sm mb-0.5">{style.nameKo}</h3>
                      <p className="text-white/50 text-xs line-clamp-1">{style.name}</p>
                      {style.celebrities && style.celebrities.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                          <p className="text-amber-400/80 text-xs truncate">
                            {style.celebrities.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <p className="text-white/40 text-center">
                  Select a category above<br />to browse hairstyles
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* Custom Reference Mode Content */}
      {tabMode === 'custom' && (
        <main className="flex-1 overflow-y-auto px-5 pb-32">
          <div className="py-6">
            <p className="text-white/50 text-sm text-center mb-6">
              Upload any hairstyle photo you like.<br />
              AI will analyze and apply it to your photo.
            </p>

            {!referencePhoto ? (
              <button
                onClick={() => refInputRef.current?.click()}
                className="w-full aspect-square max-w-xs mx-auto rounded-3xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <p className="text-purple-400 font-medium mb-1">Upload Reference Photo</p>
                <p className="text-white/40 text-xs">Celebrity or any hairstyle photo</p>
              </button>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 max-w-sm mx-auto border border-white/10">
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400 animate-spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                    <p className="text-white/80">Analyzing hairstyle...</p>
                    <p className="text-white/40 text-sm mt-1">This may take a moment</p>
                  </div>
                ) : referenceAnalysis ? (
                  <div>
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                        <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-400 mb-1">Detected Style</p>
                        <p className="text-white font-semibold text-lg leading-tight">{referenceAnalysis.styleNameKo}</p>
                        <p className="text-white/40 text-sm">{referenceAnalysis.styleName}</p>
                      </div>
                    </div>

                    <p className="text-white/60 text-sm mb-4 leading-relaxed">{referenceAnalysis.description}</p>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {referenceAnalysis.characteristics.slice(0, 4).map((char, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/70">
                          {char}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {[
                        { label: 'Length', value: referenceAnalysis.length },
                        { label: 'Texture', value: referenceAnalysis.texture },
                        { label: 'Volume', value: referenceAnalysis.volume },
                        { label: 'Color', value: referenceAnalysis.color },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/5 rounded-xl p-3">
                          <p className="text-white/40 text-xs mb-0.5">{item.label}</p>
                          <p className="text-white text-sm font-medium capitalize">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => refInputRef.current?.click()}
                      className="w-full py-3 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 transition-colors"
                    >
                      Change Reference Photo
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent pt-10 pb-6 px-5 safe-area-bottom">
        <div className="flex items-center gap-4">
          {(selectedStyle || (useReferenceMode && referenceAnalysis)) && (
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
              <p className="text-xs text-white/40 mb-0.5">
                {useReferenceMode ? 'Reference Style' : 'Selected Style'}
              </p>
              <p className="text-white font-medium truncate">
                {useReferenceMode ? referenceAnalysis?.styleNameKo : selectedStyle?.nameKo}
              </p>
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={(!selectedStyle && !useReferenceMode) || credits === 0}
            className={`py-4 px-8 rounded-2xl font-semibold transition-all duration-300 flex-shrink-0 ${
              (selectedStyle || useReferenceMode) && credits > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {credits === 0 ? 'No Credits' : 'Transform ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}
