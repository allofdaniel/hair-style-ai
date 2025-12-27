/**
 * 스타일 선택 페이지 - iOS/토스 스타일
 * - 부드러운 애니메이션
 * - 깔끔한 화이트 테마
 * - 직관적인 선택 UX
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import type { HairStyle } from '../stores/useAppStore';
import { getCategories, getStylesByCategory, hairColors } from '../data/hairStyles';
import { analyzeReferencePhoto } from '../services/gemini';
import IOSButton, { IOSIconButton } from '../components/IOSButton';

type TabMode = 'preset' | 'custom';

// 이미지 컴포넌트 with 로딩 상태
function StyleImage({ style, gender }: { style: HairStyle; gender: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [style.thumbnail]);

  if (hasError || !style.thumbnail) {
    return (
      <div className="w-full h-full bg-[#f2f4f6] flex items-center justify-center">
        <span className="text-4xl opacity-20">{gender === 'male' ? '👨' : '👩'}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-[#f2f4f6] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#e5e8eb] border-t-[#3182f6] rounded-full animate-spin" />
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
        className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </>
  );
}

export default function StyleSelect() {
  const navigate = useNavigate();
  const {
    gender, userPhoto, selectedStyle, setSelectedStyle,
    hairSettings, updateHairSettings,
    referencePhoto, setReferencePhoto,
    referenceAnalysis, setReferenceAnalysis,
    useReferenceMode, setUseReferenceMode,
  } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tabMode, setTabMode] = useState<TabMode>('preset');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  // 로드 시 전체 카테고리 선택
  useEffect(() => {
    if (!activeCategory) {
      setActiveCategory('all');
    }
  }, [gender, activeCategory]);

  const categories = getCategories(gender);
  const stylesInCategory = activeCategory ? getStylesByCategory(gender, activeCategory) : [];

  const handleStyleSelect = (style: HairStyle) => {
    setSelectedStyle(style);
    setUseReferenceMode(false);
  };

  const handleContinue = () => {
    if (selectedStyle || (useReferenceMode && referencePhoto)) {
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
          alert(result.error || '사진 분석에 실패했습니다');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        alert('레퍼런스 사진 분석에 실패했습니다');
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
    <div className="min-h-screen bg-white flex flex-col safe-area-top safe-area-bottom">
      {/* 헤더 */}
      <header className="relative flex items-center justify-between h-14 px-4 border-b border-[#f2f4f6]">
        <IOSIconButton
          variant="ghost"
          size="md"
          onClick={() => navigate('/camera')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </IOSIconButton>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#191f28]">
          스타일 선택
        </h1>

        <IOSIconButton
          variant={showSettings ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setShowSettings(!showSettings)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </IOSIconButton>
      </header>

      {/* 사진 바 */}
      <div className="px-4 py-3 flex items-center gap-3 bg-[#f8f9fa]">
        <div className="w-14 h-16 rounded-2xl overflow-hidden bg-[#e5e8eb] ring-2 ring-[#3182f6] shadow-lg flex-shrink-0">
          {userPhoto && <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />}
        </div>

        {referencePhoto && (
          <>
            <div className="w-8 h-8 rounded-full bg-[#3182f6]/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="relative w-14 h-16 rounded-2xl overflow-hidden bg-[#e5e8eb] ring-2 ring-[#6b5ce7] shadow-lg flex-shrink-0">
              <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
              <button
                onClick={clearReference}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff5247] rounded-full flex items-center justify-center shadow-lg"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 모드 탭 */}
      <div className="px-4 py-3">
        <div className="flex bg-[#f2f4f6] rounded-xl p-1">
          <button
            onClick={() => setTabMode('preset')}
            className={`flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 ${
              tabMode === 'preset'
                ? 'bg-white text-[#191f28] shadow-sm'
                : 'text-[#8b95a1]'
            }`}
          >
            프리셋 스타일
          </button>
          <button
            onClick={() => setTabMode('custom')}
            className={`flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 ${
              tabMode === 'custom'
                ? 'bg-white text-[#191f28] shadow-sm'
                : 'text-[#8b95a1]'
            }`}
          >
            레퍼런스 업로드
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="bg-[#f8f9fa] rounded-2xl p-4 space-y-4 border border-[#f2f4f6]">
            <div>
              <label className="text-[12px] font-medium text-[#8b95a1] block mb-3">
                헤어 컬러
              </label>
              <div className="flex flex-wrap gap-2">
                {hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateHairSettings({ color: color.id })}
                    className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 active:scale-95 ${
                      hairSettings.color === color.id
                        ? 'bg-[#3182f6] text-white shadow-lg shadow-[#3182f6]/25'
                        : 'bg-white text-[#4e5968] border border-[#e5e8eb]'
                    }`}
                  >
                    {color.nameKo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#8b95a1] block mb-3">볼륨</label>
              <div className="flex gap-2">
                {[{ id: 'flat', label: '납작' }, { id: 'natural', label: '자연' }, { id: 'voluminous', label: '볼륨' }].map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => updateHairSettings({ volume: vol.id as 'flat' | 'natural' | 'voluminous' })}
                    className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 active:scale-95 ${
                      hairSettings.volume === vol.id
                        ? 'bg-[#3182f6] text-white shadow-lg shadow-[#3182f6]/25'
                        : 'bg-white text-[#4e5968] border border-[#e5e8eb]'
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

      {/* 프리셋 모드 */}
      {tabMode === 'preset' && (
        <>
          {/* 카테고리 탭 */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2.5 rounded-full whitespace-nowrap text-[13px] font-semibold transition-all duration-200 flex-shrink-0 active:scale-95 ${
                    activeCategory === category.id
                      ? 'bg-[#191f28] text-white'
                      : 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]'
                  }`}
                >
                  {category.nameKo}
                </button>
              ))}
            </div>
          </div>

          {/* 스타일 그리드 */}
          <main className="flex-1 overflow-y-auto px-4 pb-32">
            {activeCategory ? (
              <div className="grid grid-cols-2 gap-3">
                {stylesInCategory.map((style, index) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    className={`group relative bg-[#f8f9fa] rounded-3xl overflow-hidden text-left transition-all duration-300 active:scale-[0.97] animate-fade-in ${
                      selectedStyle?.id === style.id && !useReferenceMode
                        ? 'ring-3 ring-[#3182f6] shadow-xl shadow-[#3182f6]/20'
                        : 'hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* 썸네일 */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <StyleImage style={style} gender={gender} />

                      {/* 그라데이션 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                      {/* 선택 체크 */}
                      {selectedStyle?.id === style.id && !useReferenceMode && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#3182f6] flex items-center justify-center shadow-lg animate-scale-in">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-bold text-[15px] mb-0.5 drop-shadow-lg">{style.nameKo}</h3>
                      <p className="text-white/70 text-[11px]">{style.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-[#f2f4f6] flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5">
                    <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z"/>
                  </svg>
                </div>
                <p className="text-[#8b95a1] text-center text-[14px]">
                  위에서 카테고리를<br />선택해주세요
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* 레퍼런스 업로드 모드 */}
      {tabMode === 'custom' && (
        <main className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="py-4">
            <p className="text-[#6b7684] text-[14px] text-center mb-6">
              원하는 헤어스타일 사진을 업로드하세요.<br />
              AI가 분석해서 적용해드립니다.
            </p>

            {!referencePhoto ? (
              <button
                onClick={() => refInputRef.current?.click()}
                className="w-full aspect-[4/3] max-w-sm mx-auto rounded-3xl border-2 border-dashed border-[#3182f6]/30 bg-[#3182f6]/5 flex flex-col items-center justify-center transition-all active:scale-[0.98] group"
              >
                <div className="w-16 h-16 rounded-full bg-[#3182f6]/10 flex items-center justify-center mb-4 group-active:scale-110 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <p className="text-[#3182f6] font-semibold text-[15px] mb-1">레퍼런스 사진 업로드</p>
                <p className="text-[#8b95a1] text-[12px]">연예인 사진, 원하는 헤어스타일 사진</p>
              </button>
            ) : (
              <div className="bg-[#f8f9fa] rounded-3xl p-5 max-w-sm mx-auto border border-[#f2f4f6]">
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#3182f6]/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 animate-spin text-[#3182f6]" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-[#191f28] font-medium">헤어스타일 분석 중...</p>
                    <p className="text-[#8b95a1] text-[13px] mt-1">잠시만 기다려주세요</p>
                  </div>
                ) : referenceAnalysis ? (
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#6b5ce7]/30 shadow-lg">
                        <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[#6b5ce7] mb-1 uppercase tracking-wider">감지된 스타일</p>
                        <p className="text-[#191f28] font-bold text-[18px] leading-tight">{referenceAnalysis.styleNameKo}</p>
                        <p className="text-[#8b95a1] text-[13px]">{referenceAnalysis.styleName}</p>
                      </div>
                    </div>

                    <p className="text-[#6b7684] text-[13px] mb-4 leading-relaxed">{referenceAnalysis.description}</p>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {referenceAnalysis.characteristics.slice(0, 4).map((char, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#6b5ce7]/10 rounded-full text-[12px] text-[#6b5ce7] font-medium">
                          {char}
                        </span>
                      ))}
                    </div>

                    <IOSButton
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={() => refInputRef.current?.click()}
                    >
                      다른 사진 선택
                    </IOSButton>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </main>
      )}

      {/* 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2f4f6] pt-3 pb-5 px-4 safe-area-bottom">
        {/* 선택된 스타일 미리보기 */}
        {(selectedStyle || (useReferenceMode && referenceAnalysis)) && (
          <div className="mb-3 bg-[#f8f9fa] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-14 rounded-xl overflow-hidden bg-[#e5e8eb] flex-shrink-0 shadow-sm">
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
              <p className="text-[11px] text-[#8b95a1] font-medium uppercase tracking-wider">선택됨</p>
              <p className="text-[#191f28] font-semibold text-[15px] truncate">
                {useReferenceMode ? referenceAnalysis?.styleNameKo : selectedStyle?.nameKo}
              </p>
            </div>
            <IOSIconButton
              variant="secondary"
              size="sm"
              onClick={() => {
                if (useReferenceMode) {
                  clearReference();
                } else {
                  setSelectedStyle(null);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </IOSIconButton>
          </div>
        )}

        <IOSButton
          variant="primary"
          size="xl"
          fullWidth
          onClick={handleContinue}
          disabled={!selectedStyle && !useReferenceMode}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          }
          iconPosition="right"
        >
          변환하기
        </IOSButton>
      </div>
    </div>
  );
}
