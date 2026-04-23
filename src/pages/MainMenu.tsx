/**
 * MainMenu - Modern AR Hair Fitting Camera UI
 *
 * Design: Stitch-generated glassmorphism style
 * - Full-screen camera with gradient overlays
 * - Horizontal style carousel with glow effects
 * - Glassmorphism controls with backdrop blur
 */

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAppStore, type HairStyle } from '../stores/useAppStore';
import { getStylesByCategory } from '../data/hairStyles';
import { hairColors } from '../data/hairColors';
import ConsentModal from '../components/ConsentModal';
import { useI18n, type TranslationKey } from '../i18n/useI18n';
import { getAssetUrl } from '../config/assetConfig';

// Hair Color Presets - Organized by category for easy selection
const HAIR_COLOR_PRESETS = [
  // 기본 & 자연색
  { id: 'natural', name: '자연색', hex: null, category: 'natural' },
  { id: 'black', name: '블랙', hex: '#1a1a1a', category: 'natural' },
  { id: 'soft-black', name: '소프트블랙', hex: '#2d2d2d', category: 'natural' },
  { id: 'blue-black', name: '청흑색', hex: '#1c2331', category: 'natural' },

  // 브라운 계열
  { id: 'dark-brown', name: '다크브라운', hex: '#3d2314', category: 'brown' },
  { id: 'chocolate', name: '초콜릿', hex: '#4a3728', category: 'brown' },
  { id: 'brown', name: '브라운', hex: '#6b4423', category: 'brown' },
  { id: 'chestnut', name: '밤색', hex: '#8b4513', category: 'brown' },
  { id: 'caramel', name: '카라멜', hex: '#9b6b43', category: 'brown' },
  { id: 'light-brown', name: '라이트브라운', hex: '#a67b5b', category: 'brown' },
  { id: 'honey', name: '허니브라운', hex: '#b8860b', category: 'brown' },
  { id: 'mocha', name: '모카', hex: '#7b5544', category: 'brown' },

  // 금발 & 베이지 계열
  { id: 'dark-blonde', name: '다크블론드', hex: '#a08050', category: 'blonde' },
  { id: 'golden-blonde', name: '골든블론드', hex: '#d4a76a', category: 'blonde' },
  { id: 'ash-blonde', name: '애쉬블론드', hex: '#c9b896', category: 'blonde' },
  { id: 'platinum', name: '플래티넘', hex: '#e5e4e2', category: 'blonde' },
  { id: 'beige', name: '베이지', hex: '#d4c4a8', category: 'blonde' },
  { id: 'champagne', name: '샴페인', hex: '#f7e7ce', category: 'blonde' },

  // 레드 & 오렌지 계열
  { id: 'auburn', name: '오번', hex: '#a52a2a', category: 'red' },
  { id: 'copper', name: '코퍼', hex: '#b87333', category: 'red' },
  { id: 'ginger', name: '진저', hex: '#b06500', category: 'red' },
  { id: 'red', name: '레드', hex: '#8b0000', category: 'red' },
  { id: 'burgundy', name: '버건디', hex: '#722f37', category: 'red' },
  { id: 'wine', name: '와인', hex: '#5e2129', category: 'red' },
  { id: 'cherry', name: '체리레드', hex: '#9b111e', category: 'red' },
  { id: 'mahogany', name: '마호가니', hex: '#6e3b3b', category: 'red' },

  // 애쉬 & 그레이 계열
  { id: 'ash-gray', name: '애쉬그레이', hex: '#8a8d8f', category: 'ash' },
  { id: 'silver', name: '실버', hex: '#c0c0c0', category: 'ash' },
  { id: 'charcoal', name: '차콜', hex: '#4a4a4a', category: 'ash' },
  { id: 'steel-gray', name: '스틸그레이', hex: '#71797e', category: 'ash' },
  { id: 'pearl-gray', name: '펄그레이', hex: '#b9bbb6', category: 'ash' },

  // 패션 컬러
  { id: 'pink', name: '핑크', hex: '#e75480', category: 'fashion' },
  { id: 'rose-gold', name: '로즈골드', hex: '#b76e79', category: 'fashion' },
  { id: 'lavender', name: '라벤더', hex: '#9d8cb8', category: 'fashion' },
  { id: 'purple', name: '퍼플', hex: '#6b3fa0', category: 'fashion' },
  { id: 'violet', name: '바이올렛', hex: '#8b008b', category: 'fashion' },
  { id: 'blue', name: '블루', hex: '#4169e1', category: 'fashion' },
  { id: 'navy', name: '네이비', hex: '#1e3a5f', category: 'fashion' },
  { id: 'teal', name: '틸', hex: '#008080', category: 'fashion' },
  { id: 'mint', name: '민트', hex: '#6eb5a0', category: 'fashion' },
  { id: 'green', name: '그린', hex: '#228b22', category: 'fashion' },
];

// Compact Color Picker - Large preview with color grid (like screenshot)
const ColorPicker = memo(({
  onSelectColor,
  onClose,
  selectedColor,
  t
}: {
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
  selectedColor: string | null;
  t: (key: TranslationKey) => string;
}) => {
  const [currentColor, setCurrentColor] = useState<{ id: string; name: string; hex: string | null } | null>(
    selectedColor ? HAIR_COLOR_PRESETS.find(c => c.hex === selectedColor) || null : null
  );

  const handleColorSelect = (color: typeof HAIR_COLOR_PRESETS[0]) => {
    setCurrentColor(color);
    onSelectColor(color.hex);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 bg-[#1C1C1E]/95 backdrop-blur-xl rounded-t-[28px] shadow-2xl border-t border-white/10 max-h-[85vh] safe-area-bottom flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle & Close */}
        <div className="flex-shrink-0">
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="flex justify-end px-5">
            <button
              onClick={onClose}
              className="text-pink-500 hover:text-pink-400 font-semibold text-[15px] transition-colors active:opacity-70"
            >
              {t('close')}
            </button>
          </div>
        </div>

        {/* Large Preview Circle */}
        <div className="flex-shrink-0 flex flex-col items-center py-4">
          <span className="text-white/50 text-xs font-medium mb-1">Current Choice</span>
          <span className="text-white text-lg font-bold mb-3">{currentColor?.name || '자연색'}</span>
          <div
            className="w-24 h-24 rounded-full border-4 transition-all duration-300"
            style={{
              backgroundColor: currentColor?.hex || 'transparent',
              borderColor: currentColor?.hex ? `${currentColor.hex}88` : 'rgba(255,255,255,0.2)',
              boxShadow: currentColor?.hex ? `0 0 30px ${currentColor.hex}66, 0 0 60px ${currentColor.hex}33` : 'none'
            }}
          />
        </div>

        {/* Color Grid - Compact without category labels */}
        <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          <div className="bg-[#2C2C2E] rounded-2xl p-4">
            <div className="grid grid-cols-5 gap-3">
              {HAIR_COLOR_PRESETS.map((color) => {
                const isSelected = currentColor?.id === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 min-w-[44px] min-h-[44px] ${
                      isSelected
                        ? 'border-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.6)] scale-105'
                        : 'border-transparent hover:border-white/20'
                    }`}
                    style={{ backgroundColor: color.hex || '#2C2C2E' }}
                  >
                    {color.hex === null && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Growth Simulation Modal - Bottom sheet style with live camera
const GrowthSimulationModal = memo(({
  onClose,
  t,
  userPhoto,
  gender,
  videoRef,
  isMirrored,
}: {
  onClose: () => void;
  t: (key: TranslationKey) => string;
  userPhoto: string | null;
  gender: 'male' | 'female';
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMirrored: boolean;
}) => {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState(4);
  const [photo, setPhoto] = useState<string | null>(userPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);

  // Korean hair growth rates (mm per day)
  const GROWTH_RATES = {
    male: { min: 0.300, max: 0.319, avg: 0.310 },
    female: { min: 0.289, max: 0.327, avg: 0.308 },
  };

  const growthCm = ((GROWTH_RATES[gender].avg * weeks * 7) / 10).toFixed(1);
  const sliderPercent = ((weeks - 1) / (26 - 1)) * 100;

  const getWeekLabel = (w: number): string => {
    if (w < 4) return `${w}주`;
    const months = Math.round(w / 4.33);
    if (months <= 0) return `${w}주`;
    return `${w}주 (약 ${months}개월)`;
  };

  const handleGalleryPick = async () => {
    try {
      const result = await Camera.pickImages({ quality: 90, limit: 1 });
      if (result.photos?.[0]?.webPath) {
        setPhoto(result.photos[0].webPath);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('cancel') || errorMsg.includes('Cancel')) return;
      try {
        const image = await Camera.getPhoto({
          quality: 90, allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (image.dataUrl) setPhoto(image.dataUrl);
      } catch {
        fileInputRef.current?.click();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setPhoto(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Capture current frame from video
  const captureFromCamera = () => {
    if (videoRef.current && localCanvasRef.current) {
      const video = videoRef.current;
      const canvas = localCanvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhoto(dataUrl);
    }
  };

  const handleStartSimulation = () => {
    // If no photo selected, capture from camera first
    let finalPhoto = photo;
    if (!finalPhoto && videoRef.current && localCanvasRef.current) {
      const video = videoRef.current;
      const canvas = localCanvasRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
          ctx.drawImage(video, 0, 0);
          finalPhoto = canvas.toDataURL('image/jpeg', 0.9);
        }
      }
    }

    if (finalPhoto) {
      useAppStore.getState().setUserPhoto(finalPhoto);
      localStorage.setItem('growthWeeks', String(weeks));
      onClose();
      navigate('/growth');
    }
  };

  const hasCamera = videoRef.current?.srcObject;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 bg-[#181114]/98 backdrop-blur-xl rounded-t-[28px] shadow-2xl border-t border-white/10 max-h-[80vh] safe-area-bottom flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle & Header */}
        <div className="flex-shrink-0">
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="flex justify-between items-center px-5 pb-3">
            <h2 className="text-lg font-bold text-white">{t('length_simulation' as TranslationKey) || '머리 길이 시뮬레이션'}</h2>
            <button
              onClick={onClose}
              className="text-pink-500 hover:text-pink-400 font-semibold text-[15px] transition-colors active:opacity-70"
            >
              {t('close')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Photo Preview Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Current Photo - Shows camera or selected photo */}
            <div className="flex flex-col gap-1.5">
              <div
                onClick={photo ? () => setPhoto(null) : captureFromCamera}
                className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#2a1d24] cursor-pointer active:scale-[0.98] transition-transform"
              >
                {photo ? (
                  <img src={photo} alt="Current" className="w-full h-full object-cover" />
                ) : hasCamera ? (
                  <video
                    ref={el => {
                      if (el && videoRef.current?.srcObject) {
                        el.srcObject = videoRef.current.srcObject;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay playsInline muted
                    className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-[11px] text-white/40">카메라 없음</span>
                  </div>
                )}
                {/* Gallery button overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleGalleryPick(); }}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </button>
              </div>
              <span className="text-white text-sm font-medium text-center">{t('before' as TranslationKey) || '현재'}</span>
            </div>

            {/* Result Placeholder */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-white/10 bg-[#2a1d24] flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  {/* Hair growth icon instead of + */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/20">
                    <path d="M12 22V8" strokeLinecap="round"/>
                    <path d="M5 12l7-10 7 10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 17c0-2 2-3 4-3s4 1 4 3" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] text-white/30">{t('after' as TranslationKey) || '변화 후'}</span>
                </div>
              </div>
              <span className="text-white text-sm font-medium text-center">{t('after' as TranslationKey) || '변화 후'}</span>
            </div>
          </div>

          {/* Growth Period Card - Reduced padding */}
          <div className="p-3 rounded-2xl border border-[#E91E63]/20 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white/60 text-xs font-medium mb-0.5">{t('growth_period' as TranslationKey) || '성장 기간'} · {t('expected_growth' as TranslationKey) || '예상 성장량'}</p>
                <p className="text-white text-base font-bold">{getWeekLabel(weeks)}</p>
              </div>
              <div className="text-right">
                <span className="text-[#E91E63] text-2xl font-bold">+{growthCm}</span>
                <span className="text-[#E91E63] text-sm font-medium ml-1">cm</span>
                <p className="text-white/40 text-[10px]">평균 기준</p>
              </div>
            </div>

            {/* Slider - More touch area */}
            <div className="relative flex w-full items-center h-10 mb-1">
              <div className="flex h-2 flex-1 rounded-full bg-[#392830]">
                <div
                  className="h-full rounded-full bg-[#E91E63] relative transition-all duration-150"
                  style={{ width: `${sliderPercent}%` }}
                >
                  <div className="absolute -right-3 -top-[10px] size-7 rounded-full bg-white shadow-lg border-4 border-[#E91E63]" />
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="26"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="flex w-full items-center justify-between text-white/40 text-[10px]">
              <span>1주</span>
              <span>성장 목표</span>
            </div>
          </div>

          <p className="text-[10px] text-white/30 text-center mb-4">
            * {gender === 'male' ? '한국 남성' : '한국 여성'} 평균 성장률 {GROWTH_RATES[gender].avg}mm/일 기준
          </p>

          {/* CTA Button - Inside scroll area, not fixed */}
          <button
            onClick={handleStartSimulation}
            className="w-full h-14 rounded-2xl text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(to right, #E91E63, #7c3aed)', boxShadow: '0 8px 24px rgba(238,43,140,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
            </svg>
            <span>{t('simulate_length' as TranslationKey) || '길이 시뮬레이션 시작'}</span>
          </button>
        </div>

        <canvas ref={localCanvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
});

// Style Card Component with glow effect on selection
const StyleCard = memo(({ style, isSelected, onToggle }: {
  style: HairStyle;
  isSelected: boolean;
  onToggle: (style: HairStyle) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasGif = !!style.gif;

  // GIF가 있으면 GIF 사용, 없으면 thumbnail 사용
  const imageUrl = hasGif ? style.gif! : style.thumbnail;

  return (
    <button
      onClick={() => onToggle(style)}
      className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0"
    >
      <div className={`relative w-[85px] h-[110px] rounded-[20px] overflow-hidden backdrop-blur-sm transition-all duration-300 active:scale-95 ${
        isSelected
          ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(238,43,173,0.3)]'
          : 'border border-white/10 bg-white/5 hover:bg-white/10'
      }`}>
        {/* Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}

        {/* Image - GIF 우선 표시 (360° 회전) */}
        {imageUrl && (
          <img
            src={getAssetUrl(imageUrl)}
            alt={style.nameKo}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* 360° Badge */}
        {hasGif && (
          <div className="absolute top-1.5 left-1.5 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 border border-white/10">
            <span className="text-[8px] font-bold text-white">360°</span>
          </div>
        )}

        {/* Selection Badge - Checkmark for single selection */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
      </div>
      <span className={`text-[10px] font-medium transition-colors ${
        isSelected ? 'text-pink-500' : 'text-white/70'
      }`}>
        {style.nameKo}
      </span>
    </button>
  );
});

export default function MainMenu() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const {
    setUserPhoto, gender, setGender,
    selectedHairColor, setSelectedHairColor,
    addUploadedReference, uploadedReferenceImages,
    hasConsented, setHasConsented,
    hairSettings, updateHairSettings,
  } = useAppStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'photo'>('camera');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!hasConsented) setShowConsentModal(true);
  }, [hasConsented]);

  // Scroll lock when modals are open
  useEffect(() => {
    if (showColorPicker || showGrowthModal || showReferencePicker) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [showColorPicker, showGrowthModal, showReferencePicker]);

  const displayStyles = useMemo(() =>
    getStylesByCategory(gender, 'all')
  , [gender]);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      // 기존 스트림 정지
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // 카메라 권한 확인
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      if (!hasCamera) {
        setErrorMessage(t('camera_not_found') || '카메라를 찾을 수 없습니다.');
        setShowErrorToast(true);
        setMode('photo');
        return;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
      setShowErrorToast(false);
    } catch (error) {
      console.error('Camera access failed:', error);
      const errorName = error instanceof Error ? error.name : '';
      const errorMsg = error instanceof Error ? error.message : '';

      if (errorName === 'NotAllowedError' || errorMsg.includes('Permission')) {
        setErrorMessage(t('camera_permission_denied') || '카메라 접근 권한이 거부되었습니다.');
      } else if (errorName === 'NotFoundError' || errorName === 'OverconstrainedError') {
        // 후면 카메라가 없으면 전면으로 재시도
        if (facing === 'environment') {
          console.log('Retrying with front camera...');
          setFacingMode('user');
          setIsMirrored(true);
          return;
        }
        setErrorMessage(t('camera_not_found') || '카메라를 찾을 수 없습니다.');
      } else {
        setErrorMessage(t('camera_error') || '카메라를 시작할 수 없습니다.');
      }
      setShowErrorToast(true);
      setMode('photo');
    }
  }, [stream, t]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera(facingMode);
    }
    return () => {
      // cleanup에서 stream을 직접 참조하지 않고 videoRef를 사용
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode, mode]);

  // Single selection mode - only one style at a time
  const handleStyleToggle = useCallback((style: HairStyle) => {
    setSelectedStyles(prev => {
      // If already selected, deselect it
      if (prev.includes(style.id)) return [];
      // Otherwise, select only this one
      return [style.id];
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPhoto(event.target?.result as string);
      setMode('photo');
      if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
    };
    reader.onerror = () => {
      setErrorMessage(t('photo_load_failed') || '사진을 불러오는데 실패했습니다.');
      setShowErrorToast(true);
    };
    reader.readAsDataURL(file);
  };

  // 권한 요청 및 갤러리에서 사진 선택
  const handleGalleryPick = async () => {
    try {
      // pickImages를 먼저 시도
      const result = await Camera.pickImages({
        quality: 90,
        limit: 1,
      });

      if (result.photos && result.photos.length > 0) {
        const photo = result.photos[0];
        // webPath를 사용하여 이미지 로드
        if (photo.webPath) {
          setUploadedPhoto(photo.webPath);
          setMode('photo');
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        }
      }
    } catch (error: unknown) {
      console.error('Gallery pick error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      // 사용자가 취소한 경우는 무시
      if (errorMsg.includes('cancel') || errorMsg.includes('Cancel') || errorMsg.includes('User cancelled')) {
        return;
      }
      // getPhoto로 다시 시도
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (image.dataUrl) {
          setUploadedPhoto(image.dataUrl);
          setMode('photo');
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback gallery pick error:', fallbackError);
        // 웹 환경에서는 file input fallback
        fileInputRef.current?.click();
      }
    }
  };

  // 참고이미지용 갤러리 선택
  const handleReferenceGalleryPick = async () => {
    try {
      // pickImages를 먼저 시도
      const result = await Camera.pickImages({
        quality: 90,
        limit: 1,
      });

      if (result.photos && result.photos.length > 0) {
        const photo = result.photos[0];
        if (photo.webPath) {
          addUploadedReference(photo.webPath);
          setShowReferencePicker(false);
        }
      }
    } catch (error: unknown) {
      console.error('Reference gallery pick error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      // 사용자가 취소한 경우는 무시
      if (errorMsg.includes('cancel') || errorMsg.includes('Cancel') || errorMsg.includes('User cancelled')) {
        return;
      }
      // getPhoto로 다시 시도
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (image.dataUrl) {
          addUploadedReference(image.dataUrl);
          setShowReferencePicker(false);
        }
      } catch (fallbackError) {
        console.error('Fallback reference pick error:', fallbackError);
        // 웹 환경에서는 file input fallback
        referenceInputRef.current?.click();
      }
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addUploadedReference(event.target?.result as string);
      setShowReferencePicker(false);
    };
    reader.onerror = () => {
      setErrorMessage(t('reference_load_failed') || '레퍼런스 이미지를 불러오는데 실패했습니다.');
      setShowErrorToast(true);
    };
    reader.readAsDataURL(file);
  };

  const captureAndProcess = async () => {
    if (selectedStyles.length === 0) return;
    setIsCapturing(true);
    try {
      let photoData: string;
      if (mode === 'photo' && uploadedPhoto) {
        photoData = uploadedPhoto;
      } else if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) throw new Error('Video not ready');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');
        if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.9);
      } else throw new Error('No photo source');

      setUserPhoto(photoData);
      let updatedHairSettings = hairSettings;
        if (selectedHairColor) {
          // HAIR_COLOR_PRESETS에서 먼저 찾기 (더 많은 색상 지원)
          const colorPreset = HAIR_COLOR_PRESETS.find(c => c.hex === selectedHairColor);
          if (colorPreset && colorPreset.hex) {
            updatedHairSettings = { ...hairSettings, color: colorPreset.id };
          } else {
            // 폴백: hairColors.ts에서 찾기
            const colorMatch = hairColors.find(c => c.hex === selectedHairColor);
            if (colorMatch) {
              updatedHairSettings = { ...hairSettings, color: colorMatch.id };
            }
          }
        }
        localStorage.setItem('selectedStyleIds', JSON.stringify(selectedStyles));
      updateHairSettings(updatedHairSettings);
      navigate('/processing');
    } catch (error) {
      console.error('Capture error:', error);
      setErrorMessage(error instanceof Error ? error.message : '사진 캡처에 실패했습니다.');
      setShowErrorToast(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const canProcess = selectedStyles.length > 0;

  return (
    <div className="h-screen bg-black font-sans overflow-hidden">
      {/* Full Screen Camera/Photo Background */}
      <div className="relative h-full w-full">
        {mode === 'camera' ? (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
          />
        ) : uploadedPhoto ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${uploadedPhoto})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
        )}

        {/* Top Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4 safe-area-top">
          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            aria-label={t('settings')}
            className="flex size-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>

          {/* Spacer for center alignment */}
          <div className="w-9" />

          {/* Camera Switch Button - 전면/후면 전환 */}
          {mode === 'camera' ? (
            <button
              onClick={async () => {
                try {
                  const newFacing = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(newFacing);
                  setIsMirrored(newFacing === 'user');
                } catch (err) {
                  console.error('Camera switch error:', err);
                }
              }}
              aria-label={facingMode === 'user' ? '후면 카메라로 전환' : '전면 카메라로 전환'}
              className="flex size-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
            >
              {/* 전면/후면 전환 아이콘 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M16 3h5v5M4 20L21 3"/>
                <path d="M21 16v5h-5M3 4l17 17"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={() => { setUploadedPhoto(null); setMode('camera'); }}
              aria-label="카메라로 전환"
              className="flex size-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bottom Panel with Gradient */}
        <div className="absolute bottom-0 left-0 right-0 z-20 w-full flex flex-col pt-20 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">

          {/* Gender Toggle - Simple Underline Style */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-4 text-sm font-medium">
              <button
                onClick={() => { setGender('male'); setSelectedStyles([]); }}
                className={`transition-all pb-0.5 ${
                  gender === 'male'
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >{t('male')}</button>
              <button
                onClick={() => { setGender('female'); setSelectedStyles([]); }}
                className={`transition-all pb-0.5 ${
                  gender === 'female'
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >{t('female')}</button>
            </div>
          </div>

          {/* Style Carousel */}
          <div className="w-full overflow-x-auto scrollbar-hide px-4 mb-8">
            <div className="flex items-start gap-2 min-w-max pb-2">
              {displayStyles.map(style => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isSelected={selectedStyles.includes(style.id)}
                  onToggle={handleStyleToggle}
                />
              ))}
            </div>
          </div>

          {/* Bottom Controls Row - 모든 버튼 같은 라인에 정렬 */}
          <div className="flex items-end justify-center gap-3 pb-8 safe-area-bottom">
            {/* Left - Gallery Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleGalleryPick}
                className="flex size-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </button>
              <span className="text-white text-[9px] font-medium">{t('gallery') || '갤러리'}</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            {/* Hair Color */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowColorPicker(true)}
                className="flex size-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
              >
                {selectedHairColor ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: selectedHairColor }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-400">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                  </svg>
                )}
              </button>
              <span className="text-white text-[9px] font-medium">{t('dye')}</span>
            </div>

            {/* Growth Simulation */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowGrowthModal(true)}
                className="flex size-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-green-400">
                  <path d="M7 2c0 4-3 6-3 10s3 6 3 10" />
                  <path d="M12 2c0 4-3 6-3 10s3 6 3 10" />
                  <path d="M17 2c0 4-3 6-3 10s3 6 3 10" />
                </svg>
              </button>
              <span className="text-white text-[9px] font-medium">{t('growth' as TranslationKey) || '길이'}</span>
            </div>

            {/* Center Shutter Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={captureAndProcess}
                disabled={!canProcess || isCapturing}
                className="relative flex items-center justify-center size-[76px] rounded-full border-[3px] border-white/30 bg-white/5 backdrop-blur-sm active:scale-90 transition-all disabled:opacity-50"
              >
                {isCapturing ? (
                  <div className="size-[64px] rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className={`size-[64px] rounded-full border-2 border-black/10 transition-colors ${
                    canProcess ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </button>
            </div>

            {/* Reference Photos */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowReferencePicker(true)}
                className="flex size-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
              >
                {uploadedReferenceImages.length > 0 ? (
                  <span className="text-pink-500 text-sm font-bold">{uploadedReferenceImages.length}</span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>
                )}
              </button>
              <span className="text-white text-[9px] font-medium">{t('reference')}</span>
            </div>

            {/* History */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => navigate('/history')}
                className="flex size-[44px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <span className="text-white text-[9px] font-medium">{t('history')}</span>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Color Picker Modal - Large Preview with Grid */}
      {showColorPicker && (
        <ColorPicker
          onSelectColor={(color) => setSelectedHairColor(color)}
          onClose={() => setShowColorPicker(false)}
          selectedColor={selectedHairColor}
          t={t}
        />
      )}

      {/* Growth Simulation Modal - Bottom Sheet */}
      {showGrowthModal && (
        <GrowthSimulationModal
          onClose={() => setShowGrowthModal(false)}
          t={t}
          userPhoto={uploadedPhoto}
          gender={gender}
          videoRef={videoRef}
          isMirrored={isMirrored}
        />
      )}

      {/* Reference Picker Modal - Stitch Design */}
      {showReferencePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowReferencePicker(false)}>
          <div
            className="absolute bottom-0 inset-x-0 h-[65vh] rounded-t-[28px] flex flex-col shadow-2xl animate-slide-up"
            style={{ background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex flex-col px-6 pt-2 pb-4 flex-shrink-0">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-white tracking-tight">{t('reference_images')}</h2>
                <button
                  onClick={() => setShowReferencePicker(false)}
                  className="text-pink-500 hover:text-pink-400 font-semibold text-[15px] transition-colors active:opacity-70"
                >
                  {t('close')}
                </button>
              </div>
              <p className="text-gray-400 text-sm font-normal">{t('reference_desc')}</p>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="grid grid-cols-3 gap-3">
                {/* Preset Reference Images by Gender */}
                {(gender === 'male' ? [
                  { id: 'm-comma-hair', src: '/hair-references/m-comma-hair.png', alt: '콤마펌' },
                  { id: 'm-gail-perm', src: '/hair-references/m-gail-perm.png', alt: '가일펌' },
                  { id: 'm-pomade-down', src: '/hair-references/m-pomade-down.png', alt: '포마드다운' },
                  { id: 'm-natural-down', src: '/hair-references/m-natural-down.png', alt: '내추럴다운' },
                  { id: 'm-dandy-cut', src: '/hair-references/m-dandy-cut.png', alt: '댄디컷' },
                  { id: 'm-two-block-basic', src: '/hair-references/m-two-block-basic.png', alt: '투블럭' },
                  { id: 'm-ash-perm', src: '/hair-references/m-ash-perm.png', alt: '애쉬펌' },
                  { id: 'm-garma-perm', src: '/hair-references/m-garma-perm.png', alt: '가르마펌' },
                  { id: 'm-undercut', src: '/hair-references/m-undercut.png', alt: '언더컷' },
                  { id: 'm-low-fade', src: '/hair-references/m-low-fade.png', alt: '로우페이드' },
                  { id: 'm-mid-fade', src: '/hair-references/m-mid-fade.png', alt: '미드페이드' },
                  { id: 'm-high-fade', src: '/hair-references/m-high-fade.png', alt: '하이페이드' },
                ] : [
                  { id: 'f-pixie-cut', src: '/hair-references/f-pixie-cut.png', alt: '픽시컷' },
                  { id: 'f-bob-cut', src: '/hair-references/f-bob-cut.png', alt: '보브컷' },
                  { id: 'f-hush-cut', src: '/hair-references/f-hush-cut.png', alt: '허쉬컷' },
                  { id: 'f-c-curl', src: '/hair-references/f-c-curl.png', alt: 'C컬' },
                  { id: 'f-lob-cut', src: '/hair-references/f-lob-cut.png', alt: '롱보브' },
                  { id: 'f-wave-perm', src: '/hair-references/f-wave-perm.png', alt: '웨이브펌' },
                  { id: 'f-long-straight', src: '/hair-references/f-long-straight.png', alt: '롱스트레이트' },
                  { id: 'f-long-layered', src: '/hair-references/f-long-layered.png', alt: '레이어드컷' },
                  { id: 'f-see-through-bangs', src: '/hair-references/f-see-through-bangs.png', alt: '시스루뱅' },
                  { id: 'f-full-bangs', src: '/hair-references/f-full-bangs.png', alt: '풀뱅' },
                  { id: 'f-body-perm', src: '/hair-references/f-body-perm.png', alt: '바디펌' },
                  { id: 'f-glam-perm', src: '/hair-references/f-glam-perm.png', alt: '글램펌' },
                ]).map((ref) => {
                  const isSelected = uploadedReferenceImages.includes(ref.src);
                  return (
                    <div
                      key={ref.id}
                      onClick={() => {
                        if (isSelected) {
                          const idx = uploadedReferenceImages.indexOf(ref.src);
                          if (idx !== -1) useAppStore.getState().removeUploadedReference(idx);
                        } else {
                          addUploadedReference(ref.src);
                        }
                      }}
                      className={`aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(255,64,129,0.3)]'
                          : 'border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={ref.src}
                        alt={ref.alt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-pink-500 w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* User Uploaded Images */}
                {uploadedReferenceImages
                  .filter(img => !img.startsWith('/hair-references/'))
                  .map((img, idx) => (
                    <div
                      key={`user-${idx}`}
                      className="aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer border-2 border-pink-500 shadow-[0_0_15px_rgba(255,64,129,0.3)]"
                    >
                      <img
                        src={img}
                        alt="사용자 참고 이미지"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const realIdx = uploadedReferenceImages.indexOf(img);
                          if (realIdx !== -1) useAppStore.getState().removeUploadedReference(realIdx);
                        }}
                        className="absolute top-2 right-2 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute top-2 left-2 bg-pink-500 w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    </div>
                  ))}

                {/* Empty placeholder for more uploads */}
                <div
                  onClick={handleReferenceGalleryPick}
                  className="aspect-[3/4] rounded-xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-gray-500 gap-1 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="absolute bottom-0 left-0 w-full p-6 pt-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/90 to-transparent safe-area-bottom">
              <button
                onClick={handleReferenceGalleryPick}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform hover:bg-gray-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[16px]">{t('add_photo')}</span>
              </button>
            </div>
            <input ref={referenceInputRef} type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <ConsentModal
          onAccept={() => { setHasConsented(true); setShowConsentModal(false); }}
          onDecline={() => {
            setErrorMessage(t('consent_required'));
            setShowErrorToast(true);
          }}
        />
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in"
          onClick={() => setShowErrorToast(false)}
        >
          <div className="bg-red-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 backdrop-blur-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            <span className="font-semibold text-sm">{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
