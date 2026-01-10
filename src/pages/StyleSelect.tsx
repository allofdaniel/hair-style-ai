/**
 * 스타일 선택 페이지 - Apple Human Interface Guidelines
 * - 44pt 최소 터치 타겟
 * - 시스템 색상 사용
 * - SF Pro 타이포그래피
 * - 라이트/다크 모드 지원
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useProcessingQueue } from '../stores/useProcessingQueue';
import type { HairStyle } from '../stores/useAppStore';
import { getCategories, getStylesByCategory, getFavoriteStyles, hairColors } from '../data/hairStyles';
import { analyzeReferencePhoto } from '../services/gemini';
// IOSIconButton removed - not used currently

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
      <div className="w-full h-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
        <span className="text-4xl opacity-20">{gender === 'male' ? '👨' : '👩'}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-bg-tertiary)] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--color-gray-4)] border-t-[var(--color-blue)] rounded-full animate-spin" />
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
        className={`w-full h-full object-cover transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </>
  );
}

export default function StyleSelect() {
  const navigate = useNavigate();
  const {
    gender, userPhoto,
    hairSettings, updateHairSettings,
    referencePhoto, setReferencePhoto,
    referenceAnalysis, setReferenceAnalysis,
    useReferenceMode, setUseReferenceMode,
    favoriteStyleIds, toggleFavorite, isFavorite,
  } = useAppStore();
  const { addToQueue, addReferenceToQueue, queue } = useProcessingQueue();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [tabMode, setTabMode] = useState<TabMode>('preset');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const categories = getCategories(gender);
  const stylesInCategory = activeCategory
    ? (activeCategory === 'favorites'
        ? getFavoriteStyles(gender, favoriteStyleIds)
        : getStylesByCategory(gender, activeCategory))
    : [];

  const handleStyleToggle = (style: HairStyle) => {
    setSelectedStyles(prev => {
      if (prev.includes(style.id)) {
        return prev.filter(id => id !== style.id);
      }
      return [...prev, style.id];
    });
    setUseReferenceMode(false);
  };

  const handleStartGeneration = () => {
    if (!userPhoto) return;

    if (selectedStyles.length > 0) {
      addToQueue(
        selectedStyles.map(styleId => ({
          styleId,
          userPhoto,
          hairSettings,
        }))
      );
      setSelectedStyles([]);
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 2500);
    } else if (useReferenceMode && referencePhoto && referenceAnalysis) {
      addReferenceToQueue({
        userPhoto,
        referencePhoto,
        hairSettings,
        styleName: referenceAnalysis.styleName,
        styleNameKo: referenceAnalysis.styleNameKo,
      });
      clearReference();
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 2500);
    }
  };

  const queueCount = queue.length;

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
          setSelectedStyles([]);
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
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col safe-area-top safe-area-bottom">
      {/* 헤더 - Apple Navigation Bar */}
      <header className="relative flex items-center justify-between h-11 px-4 bg-[var(--color-bg-primary)] border-b border-[var(--color-separator)]">
        <button
          onClick={() => navigate('/camera')}
          className="w-11 h-11 flex items-center justify-center -ml-2 active:opacity-60 transition-opacity"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-headline text-[var(--color-label)]">
          스타일 선택
        </h1>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-11 h-11 flex items-center justify-center -mr-2 active:opacity-60 transition-opacity ${
            showSettings ? 'text-[var(--color-blue)]' : 'text-[var(--color-blue)]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </header>

      {/* 사진 미리보기 바 */}
      <div className="px-4 py-3 flex items-center gap-3 bg-[var(--color-bg-secondary)]">
        <div className="w-14 h-16 rounded-xl overflow-hidden bg-[var(--color-fill-tertiary)] ring-2 ring-[var(--color-blue)] flex-shrink-0">
          {userPhoto && <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />}
        </div>

        {referencePhoto && (
          <>
            <div className="w-8 h-8 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-[var(--color-fill-tertiary)] ring-2 ring-[var(--color-purple)] flex-shrink-0">
              <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
              <button
                onClick={clearReference}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-red)] rounded-full flex items-center justify-center"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Segmented Control - Apple HIG */}
      <div className="px-4 py-4">
        <div className="flex bg-[var(--color-fill-tertiary)] rounded-[9px] p-[2px]">
          <button
            onClick={() => setTabMode('preset')}
            className={`flex-1 py-2 rounded-[7px] text-subheadline font-medium transition-all ${
              tabMode === 'preset'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-label)] shadow-sm'
                : 'text-[var(--color-label-secondary)]'
            }`}
          >
            프리셋 스타일
          </button>
          <button
            onClick={() => setTabMode('custom')}
            className={`flex-1 py-2 rounded-[7px] text-subheadline font-medium transition-all ${
              tabMode === 'custom'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-label)] shadow-sm'
                : 'text-[var(--color-label-secondary)]'
            }`}
          >
            레퍼런스 업로드
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 space-y-4">
            <div>
              <label className="text-footnote text-[var(--color-label-secondary)] block mb-3">
                헤어 컬러
              </label>
              <div className="flex flex-wrap gap-2">
                {hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateHairSettings({ color: color.id })}
                    className={`h-9 px-4 rounded-full text-subheadline font-medium transition-all active:scale-95 ${
                      hairSettings.color === color.id
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-[var(--color-fill-tertiary)] text-[var(--color-label)]'
                    }`}
                  >
                    {color.nameKo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-footnote text-[var(--color-label-secondary)] block mb-3">볼륨</label>
              <div className="flex gap-2">
                {[{ id: 'flat', label: '납작' }, { id: 'natural', label: '자연' }, { id: 'voluminous', label: '볼륨' }].map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => updateHairSettings({ volume: vol.id as 'flat' | 'natural' | 'voluminous' })}
                    className={`flex-1 h-11 rounded-xl text-subheadline font-medium transition-all active:scale-95 ${
                      hairSettings.volume === vol.id
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-[var(--color-fill-tertiary)] text-[var(--color-label)]'
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
          {/* 카테고리 필터 - Horizontal Scroll */}
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex-shrink-0 h-9 px-4 rounded-full text-subheadline font-medium transition-all active:scale-95 ${
                    activeCategory === category.id
                      ? 'bg-[var(--color-label)] text-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-fill-tertiary)] text-[var(--color-label)]'
                  }`}
                >
                  {category.nameKo}
                </button>
              ))}
            </div>
          </div>

          {/* 스타일 그리드 */}
          <main className="flex-1 overflow-y-auto px-4 pb-40">
            {activeCategory === 'favorites' && stylesInCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-[var(--color-fill-tertiary)] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-2)" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <p className="text-[var(--color-label-secondary)] text-center text-callout">
                  즐겨찾기한 스타일이 없습니다<br />
                  하트를 눌러 추가해보세요
                </p>
              </div>
            ) : activeCategory ? (
              <div className="grid grid-cols-2 gap-3">
                {stylesInCategory.map((style, index) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleToggle(style)}
                    className={`group relative bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98] ${
                      selectedStyles.includes(style.id)
                        ? 'ring-2 ring-[var(--color-blue)]'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* 썸네일 */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <StyleImage style={style} gender={gender} />

                      {/* 그라데이션 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* 선택 표시 */}
                      {selectedStyles.includes(style.id) && (
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[var(--color-blue)] flex items-center justify-center">
                          <span className="text-white font-semibold text-caption1">
                            {selectedStyles.indexOf(style.id) + 1}
                          </span>
                        </div>
                      )}

                      {/* 즐겨찾기 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(style.id);
                        }}
                        className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                          isFavorite(style.id)
                            ? 'bg-[var(--color-red)]'
                            : 'bg-black/30 backdrop-blur-sm'
                        }`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isFavorite(style.id) ? 'white' : 'none'}
                          stroke="white"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    </div>

                    {/* 정보 */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold text-callout mb-0.5">{style.nameKo}</h3>
                      <p className="text-white/70 text-caption2">{style.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-[var(--color-fill-tertiary)] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-2)" strokeWidth="1.5">
                    <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z"/>
                  </svg>
                </div>
                <p className="text-[var(--color-label-secondary)] text-center text-callout">
                  위에서 카테고리를<br />선택해주세요
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* 레퍼런스 업로드 모드 */}
      {tabMode === 'custom' && (
        <main className="flex-1 overflow-y-auto px-4 pb-40">
          <div className="py-4">
            <p className="text-[var(--color-label-secondary)] text-callout text-center mb-6">
              원하는 헤어스타일 사진을 업로드하세요.<br />
              AI가 분석해서 적용해드립니다.
            </p>

            {!referencePhoto ? (
              <button
                onClick={() => refInputRef.current?.click()}
                className="w-full aspect-[4/3] max-w-sm mx-auto rounded-2xl border-2 border-dashed border-[var(--color-blue)]/40 bg-[var(--color-blue)]/5 flex flex-col items-center justify-center transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <p className="text-[var(--color-blue)] font-semibold text-callout mb-1">레퍼런스 사진 업로드</p>
                <p className="text-[var(--color-label-tertiary)] text-caption1">연예인 사진, 원하는 헤어스타일 사진</p>
              </button>
            ) : (
              <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-4 max-w-sm mx-auto">
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 animate-spin text-[var(--color-blue)]" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-[var(--color-label)] font-medium text-body">헤어스타일 분석 중...</p>
                    <p className="text-[var(--color-label-secondary)] text-caption1 mt-1">잠시만 기다려주세요</p>
                  </div>
                ) : referenceAnalysis ? (
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-[var(--color-purple)]/30">
                        <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-caption2 font-medium text-[var(--color-purple)] mb-1 uppercase tracking-wider">감지된 스타일</p>
                        <p className="text-[var(--color-label)] font-semibold text-body leading-tight">{referenceAnalysis.styleNameKo}</p>
                        <p className="text-[var(--color-label-secondary)] text-caption1">{referenceAnalysis.styleName}</p>
                      </div>
                    </div>

                    <p className="text-[var(--color-label-secondary)] text-caption1 mb-4 leading-relaxed">{referenceAnalysis.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {referenceAnalysis.characteristics.slice(0, 4).map((char, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[var(--color-purple)]/10 rounded-full text-caption2 text-[var(--color-purple)] font-medium">
                          {char}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => refInputRef.current?.click()}
                      className="w-full h-11 rounded-xl bg-[var(--color-fill-tertiary)] text-[var(--color-label)] font-medium text-subheadline active:bg-[var(--color-fill-secondary)] transition-colors"
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

      {/* 토스트 */}
      {showAddedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[var(--color-green)] text-white px-5 py-3 rounded-full flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span className="font-medium text-subheadline">백그라운드에서 생성 중!</span>
          </div>
        </div>
      )}

      {/* 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-separator)] pt-3 safe-area-bottom px-4 pb-4">
        {/* 선택된 스타일 */}
        {selectedStyles.length > 0 && (
          <div className="mb-3 bg-[var(--color-bg-secondary)] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {selectedStyles.slice(0, 3).map((styleId, i) => {
                const style = stylesInCategory.find(s => s.id === styleId) ||
                              getStylesByCategory(gender, 'all').find(s => s.id === styleId);
                return (
                  <div key={styleId} className="w-10 h-12 rounded-lg overflow-hidden bg-[var(--color-fill-tertiary)] border-2 border-[var(--color-bg-primary)]" style={{ zIndex: 3 - i }}>
                    {style?.thumbnail && <img src={style.thumbnail} alt="" className="w-full h-full object-cover" />}
                  </div>
                );
              })}
              {selectedStyles.length > 3 && (
                <div className="w-10 h-12 rounded-lg bg-[var(--color-blue)] border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-white text-caption2 font-semibold">
                  +{selectedStyles.length - 3}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption2 text-[var(--color-label-tertiary)]">선택됨</p>
              <p className="text-[var(--color-label)] font-semibold text-callout">
                {selectedStyles.length}개 스타일
              </p>
            </div>
            <button
              onClick={() => setSelectedStyles([])}
              className="w-9 h-9 rounded-full bg-[var(--color-fill-tertiary)] flex items-center justify-center active:bg-[var(--color-fill-secondary)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-label-secondary)" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* 레퍼런스 모드 */}
        {useReferenceMode && referenceAnalysis && (
          <div className="mb-3 bg-[var(--color-bg-secondary)] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-14 rounded-lg overflow-hidden bg-[var(--color-fill-tertiary)] flex-shrink-0">
              {referencePhoto && <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption2 text-[var(--color-label-tertiary)]">레퍼런스</p>
              <p className="text-[var(--color-label)] font-semibold text-callout truncate">
                {referenceAnalysis.styleNameKo}
              </p>
            </div>
            <button
              onClick={clearReference}
              className="w-9 h-9 rounded-full bg-[var(--color-fill-tertiary)] flex items-center justify-center active:bg-[var(--color-fill-secondary)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-label-secondary)" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* 큐 상태 */}
        {queueCount > 0 && (
          <div className="mb-3 bg-[var(--color-blue)]/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-[var(--color-blue)]/30 border-t-[var(--color-blue)] rounded-full animate-spin" />
            <span className="text-caption1 text-[var(--color-blue)] font-medium">{queueCount}개 생성 중...</span>
          </div>
        )}

        {/* 메인 버튼 */}
        <button
          onClick={handleStartGeneration}
          disabled={selectedStyles.length === 0 && !useReferenceMode}
          className={`w-full h-[50px] rounded-xl font-semibold text-body flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            selectedStyles.length === 0 && !useReferenceMode
              ? 'bg-[var(--color-fill-tertiary)] text-[var(--color-label-tertiary)]'
              : 'bg-[var(--color-blue)] text-white'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {selectedStyles.length > 0
            ? `${selectedStyles.length}개 스타일 생성하기`
            : useReferenceMode
              ? '레퍼런스로 생성하기'
              : '스타일을 선택하세요'}
        </button>
      </div>
    </div>
  );
}
