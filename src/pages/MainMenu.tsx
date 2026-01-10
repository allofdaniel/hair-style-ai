/**
 * MainMenu - Apple Human Interface Guidelines
 *
 * Design Principles:
 * 1. Clarity: Clean, readable text and intuitive icons
 * 2. Deference: Content-focused UI that stays out of the way
 * 3. Depth: Visual layers and realistic motion
 */

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type HairStyle } from '../stores/useAppStore';
import { useProcessingQueue } from '../stores/useProcessingQueue';
import { getStylesByCategory } from '../data/hairStyles';
import { colorCategories, getColorsByCategory } from '../data/hairColors';
import ConsentModal from '../components/ConsentModal';
import { useI18n } from '../i18n/useI18n';
import { getAssetUrl } from '../config/assetConfig';

// Apple HIG: Minimum 44pt touch targets
const StyleItem = memo(({ style, isSelected, index, onToggle }: {
  style: HairStyle;
  isSelected: boolean;
  index: number;
  onToggle: (style: HairStyle) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const hasGif = !!style.gif;
  const showGif = hasGif && !isSelected;

  return (
    <button
      onClick={() => onToggle(style)}
      className={`flex-shrink-0 w-20 h-[100px] rounded-2xl overflow-hidden relative
        transition-transform duration-200 active:scale-95
        ${isSelected
          ? 'ring-2 ring-[var(--color-blue)] ring-offset-2 dark:ring-offset-black'
          : 'ring-1 ring-black/5 dark:ring-white/10'}`}
      style={{ minWidth: '80px', minHeight: '100px' }}
    >
      {/* Skeleton */}
      {!imageLoaded && !gifLoaded && (
        <div className="absolute inset-0 bg-[var(--color-gray-6)] dark:bg-[var(--color-gray-5)] animate-pulse" />
      )}

      {/* GIF */}
      {hasGif && (
        <img
          src={getAssetUrl(style.gif!)}
          alt={style.nameKo}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${showGif ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setGifLoaded(true)}
        />
      )}

      {/* Thumbnail */}
      {style.thumbnail && (
        <img
          src={getAssetUrl(style.thumbnail)}
          alt={style.nameKo}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${!showGif ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {!style.thumbnail && !hasGif && (
        <div className="w-full h-full bg-[var(--color-gray-6)] dark:bg-[var(--color-gray-5)]" />
      )}

      {/* 360° Badge */}
      {hasGif && showGif && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded text-[10px] font-medium text-label">
          360°
        </div>
      )}

      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[var(--color-blue)] rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-semibold">{index + 1}</span>
        </div>
      )}

      {/* Title Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6">
        <p className="text-white text-[11px] font-medium truncate">{style.nameKo}</p>
      </div>
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
    setUseCustomMode, selectedHairColor, setSelectedHairColor,
    addUploadedReference, uploadedReferenceImages,
    hasConsented, setHasConsented,
    hairSettings,
  } = useAppStore();
  const { addToQueue, queue } = useProcessingQueue();

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'photo'>('camera');
  const [customSelected, setCustomSelected] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorCategory, setSelectedColorCategory] = useState('natural');
  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!hasConsented) setShowConsentModal(true);
  }, [hasConsented]);

  const displayStyles = useMemo(() =>
    getStylesByCategory(gender, 'all')
  , [gender]);

  // 카메라 시작 함수
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      // 기존 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraReady(false);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // play() 호출 전에 비디오가 로드될 때까지 대기
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
          }).catch(err => {
            console.error('Video play failed:', err);
          });
        };
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  }, []);

  // 카메라 정리 함수
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // 카메라 모드 변경 시 카메라 시작/정지
  useEffect(() => {
    if (mode === 'camera') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [facingMode, mode, startCamera, stopCamera]);

  const handleStyleToggle = (style: HairStyle) => {
    setCustomSelected(false);
    setSelectedStyles(prev => {
      if (prev.includes(style.id)) return prev.filter(id => id !== style.id);
      if (prev.length >= 5) return prev;
      return [...prev, style.id];
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPhoto(event.target?.result as string);
      setMode('photo');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addUploadedReference(event.target?.result as string);
      setShowReferencePicker(false);
    };
    reader.readAsDataURL(file);
  };

  const captureAndProcess = async () => {
    if (selectedStyles.length === 0 && !customSelected) return;
    setIsCapturing(true);
    try {
      let photoData: string;
      if (mode === 'photo' && uploadedPhoto) {
        photoData = uploadedPhoto;
      } else if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.9);
      } else throw new Error('No photo source');

      setUserPhoto(photoData);
      if (customSelected) {
        setUseCustomMode(true);
        navigate('/custom');
      } else {
        addToQueue(
          selectedStyles.map(styleId => ({
            styleId,
            userPhoto: photoData,
            hairSettings,
          }))
        );
        setSelectedStyles([]);
        setShowAddedToast(true);
        setTimeout(() => setShowAddedToast(false), 2500);
      }
    } catch (error) {
      console.error('Capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const canProcess = selectedStyles.length > 0 || customSelected;

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Camera View */}
      <div className="relative flex-1 min-h-0">
        {mode === 'camera' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* 카메라 로딩 중 표시 */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-white/60 text-sm">카메라 로딩 중...</p>
              </div>
            )}
          </>
        ) : uploadedPhoto && (
          <img src={uploadedPhoto} alt="" className="w-full h-full object-contain bg-black" />
        )}

        {/* Top Bar - Apple HIG: Clean, minimal controls */}
        <div className="absolute top-0 inset-x-0 safe-area-top">
          <div className="flex justify-between items-center px-4 h-11">
            {/* Menu Button - 44pt minimum */}
            <button
              onClick={() => setShowMenu(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md active:bg-black/40 transition-colors"
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>

            {/* Title */}
            <span className="text-white text-headline font-semibold drop-shadow-sm">{t('app_name')}</span>

            {/* Gallery Button - 44pt minimum */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md active:bg-black/40 transition-colors"
              aria-label="Photo Library"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        {/* Bottom Camera Controls */}
        <div className="absolute bottom-4 inset-x-4">
          <div className="flex justify-between items-center">
            {mode === 'photo' ? (
              <button
                onClick={() => { setUploadedPhoto(null); setMode('camera'); }}
                className="h-9 px-4 flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full active:bg-black/50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                <span className="text-white text-subheadline font-medium">{t('back_to_camera')}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                {/* Mirror Toggle */}
                <button
                  onClick={() => setIsMirrored(m => !m)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md active:scale-95 transition-all ${
                    isMirrored ? 'bg-white/30' : 'bg-black/30'
                  }`}
                  aria-label="Mirror"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3"/>
                    <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3"/>
                    <path d="M12 3v18" strokeDasharray="2 2"/>
                  </svg>
                </button>

                {/* Camera Flip */}
                <button
                  onClick={() => {
                    const newMode = facingMode === 'user' ? 'environment' : 'user';
                    setFacingMode(newMode);
                    setIsMirrored(newMode === 'user');
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full active:scale-95 transition-transform"
                  aria-label="Flip Camera"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M20 16v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4"/>
                    <path d="M4 8V4a2 2 0 012-2h12a2 2 0 012 2v4"/>
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                    <path d="M16 3l-4 4-4-4"/>
                    <path d="M16 21l-4-4-4 4"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Gender Toggle - Apple Segmented Control Style */}
            <div className="flex bg-black/30 backdrop-blur-md rounded-full p-0.5">
              <button
                onClick={() => { setGender('male'); setSelectedStyles([]); }}
                className={`px-4 py-1.5 text-footnote font-semibold rounded-full transition-all ${
                  gender === 'male' ? 'bg-white text-black' : 'text-white/80'
                }`}
              >{t('male')}</button>
              <button
                onClick={() => { setGender('female'); setSelectedStyles([]); }}
                className={`px-4 py-1.5 text-footnote font-semibold rounded-full transition-all ${
                  gender === 'female' ? 'bg-white text-black' : 'text-white/80'
                }`}
              >{t('female')}</button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Panel - Apple HIG: Grouped background with safe area */}
      <div className="bg-[var(--color-bg-grouped)] dark:bg-[var(--color-bg-secondary)] rounded-t-3xl pt-4 safe-area-bottom border-t border-[var(--color-separator)]">
        {/* Style Carousel */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 px-4 scrollbar-hide">
          {/* Custom Button */}
          <button
            onClick={() => { setCustomSelected(true); setSelectedStyles([]); }}
            className={`flex-shrink-0 w-20 h-[100px] rounded-2xl bg-[var(--color-blue)]
              flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
              customSelected ? 'ring-2 ring-[var(--color-blue)] ring-offset-2 dark:ring-offset-black' : ''
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span className="text-white text-caption-1 font-medium">{t('custom_setting')}</span>
          </button>

          {displayStyles.map(style => (
            <StyleItem
              key={style.id}
              style={style}
              isSelected={selectedStyles.includes(style.id)}
              index={selectedStyles.indexOf(style.id)}
              onToggle={handleStyleToggle}
            />
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 pb-2">
          {/* Color Button - 44pt minimum */}
          <button
            onClick={() => setShowColorPicker(true)}
            className="w-14 h-14 rounded-full bg-[var(--color-bg-grouped-secondary)] dark:bg-[var(--color-gray-5)] flex flex-col items-center justify-center active:scale-95 transition-transform shadow-sm"
            aria-label="Hair Color"
          >
            {selectedHairColor ? (
              <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: selectedHairColor }} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-1)" strokeWidth="1.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span className="text-[var(--color-gray-1)] text-caption-2 font-medium mt-0.5">{t('dye')}</span>
              </>
            )}
          </button>

          {/* Shutter Button - Apple Camera Style */}
          <button
            onClick={captureAndProcess}
            disabled={!canProcess || isCapturing}
            className={`w-[72px] h-[72px] rounded-full transition-all active:scale-95 ${
              canProcess
                ? 'bg-[var(--color-blue)]'
                : 'bg-[var(--color-gray-4)] dark:bg-[var(--color-gray-3)]'
            }`}
            aria-label="Capture"
          >
            {isCapturing ? (
              <div className="w-7 h-7 mx-auto border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className={`w-[60px] h-[60px] mx-auto rounded-full border-[3px] transition-all ${
                canProcess ? 'border-white' : 'border-[var(--color-gray-2)]'
              }`} />
            )}
          </button>

          {/* Reference Button - 44pt minimum */}
          <button
            onClick={() => setShowReferencePicker(true)}
            className="w-14 h-14 rounded-full bg-[var(--color-bg-grouped-secondary)] dark:bg-[var(--color-gray-5)] flex flex-col items-center justify-center active:scale-95 transition-transform shadow-sm"
            aria-label="Reference Photo"
          >
            {uploadedReferenceImages.length > 0 ? (
              <span className="text-[var(--color-blue)] text-callout font-bold">{uploadedReferenceImages.length}</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-1)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M12 8v8M8 12h8"/>
                </svg>
                <span className="text-[var(--color-gray-1)] text-caption-2 font-medium mt-0.5">{t('reference')}</span>
              </>
            )}
          </button>
        </div>

        {/* Selection Status */}
        {canProcess && (
          <p className="text-center text-[var(--color-label-secondary)] text-footnote pb-2">
            {customSelected ? t('custom_mode') : `${selectedStyles.length}${t('selected_count')}`}
          </p>
        )}
      </div>

      {/* Side Menu - Apple HIG Sheet Style */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowMenu(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-[var(--color-bg-grouped)] dark:bg-[var(--color-bg-secondary)] animate-slide-in-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="safe-area-top px-5 pt-2 pb-4 border-b border-[var(--color-separator)]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-title-2 text-label font-bold">{t('app_name')}</h2>
                  <p className="text-subheadline text-[var(--color-label-secondary)] mt-0.5">{t('app_desc')}</p>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-fill-secondary)] active:bg-[var(--color-fill-primary)] transition-colors"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-label)" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation - Apple HIG List Style */}
            <nav className="p-2 space-y-0.5">
              {/* Active Item */}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-body font-semibold text-[var(--color-blue)] bg-[var(--color-blue)]/10 rounded-xl"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-9M14 17H5"/>
                  <circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
                </svg>
                {t('hairstyle')}
              </button>

              {/* Menu Items */}
              {[
                { path: '/analysis', icon: 'M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z', label: t('face_analysis') },
                { path: '/weight', icon: 'M12 2v4M6.34 6.34l2.83 2.83M2 12h4M6.34 17.66l2.83-2.83M12 18v4M17.66 17.66l-2.83-2.83M18 12h4M17.66 6.34l-2.83 2.83', label: t('weight_simulation') },
                { path: '/fitness', icon: 'M6.5 6.5h11v11h-11zM4 4h3v3H4zM17 4h3v3h-3zM4 17h3v3H4zM17 17h3v3h-3z', label: t('fitness_simulation') },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { setShowMenu(false); navigate(item.path); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-body text-label rounded-xl hover:bg-[var(--color-fill-quaternary)] active:bg-[var(--color-fill-tertiary)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={item.icon}/>
                  </svg>
                  {item.label}
                </button>
              ))}

              {/* Separator */}
              <div className="h-px bg-[var(--color-separator)] my-2 mx-4" />
              <p className="px-4 py-2 text-caption-1 text-[var(--color-label-tertiary)] font-medium uppercase tracking-wide">{t('beauty_simulations')}</p>

              {/* Beauty Simulations */}
              {[
                { path: '/hair-color', icon: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', label: t('hair_color_simulation') },
                { path: '/hair-volume', icon: 'M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12M2 12c0-2.76 1.12-5.26 2.93-7.07', label: t('hair_volume_simulation') },
                { path: '/skin-treatment', icon: 'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01', label: t('skin_treatment_simulation') },
                { path: '/aging', icon: 'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12 6.48 22 12 22zM12 6v6l4 2', label: t('aging_simulation') },
                { path: '/makeup', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', label: t('makeup_simulation') },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { setShowMenu(false); navigate(item.path); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-subheadline text-label rounded-xl hover:bg-[var(--color-fill-quaternary)] active:bg-[var(--color-fill-tertiary)] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={item.icon}/>
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-2 safe-area-bottom border-t border-[var(--color-separator)]">
              <button
                onClick={() => { setShowMenu(false); navigate('/history'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-subheadline text-[var(--color-label-secondary)] rounded-xl hover:bg-[var(--color-fill-quaternary)] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {t('history')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-subheadline text-[var(--color-label-secondary)] rounded-xl hover:bg-[var(--color-fill-quaternary)] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                {t('settings')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal - Apple HIG Sheet */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowColorPicker(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-[var(--color-bg-grouped)] dark:bg-[var(--color-bg-secondary)] rounded-t-3xl max-h-[70vh] animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-[var(--color-gray-4)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 pb-3 border-b border-[var(--color-separator)]">
              <span className="text-headline text-label font-semibold">{t('hair_color')}</span>
              <button
                onClick={() => setShowColorPicker(false)}
                className="text-body text-[var(--color-blue)] font-medium"
              >
                {t('close')}
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              {colorCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedColorCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-footnote font-semibold transition-all ${
                    selectedColorCategory === cat.id
                      ? 'bg-[var(--color-label)] text-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-fill-secondary)] text-[var(--color-label-secondary)]'
                  }`}
                >{cat.nameKo}</button>
              ))}
            </div>

            {/* Color Grid */}
            <div className="p-4 grid grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto safe-area-bottom">
              <button
                onClick={() => { setSelectedHairColor(null); setShowColorPicker(false); }}
                className={`aspect-square rounded-2xl bg-[var(--color-fill-secondary)] flex items-center justify-center ${
                  !selectedHairColor ? 'ring-2 ring-[var(--color-blue)]' : ''
                }`}
              >
                <span className="text-[var(--color-label-tertiary)] text-caption-2">{t('no_color')}</span>
              </button>
              {getColorsByCategory(selectedColorCategory).map(color => (
                <button
                  key={color.id}
                  onClick={() => { setSelectedHairColor(color.hex); setShowColorPicker(false); }}
                  className={`aspect-square rounded-2xl active:scale-95 transition-transform ${
                    selectedHairColor === color.hex ? 'ring-2 ring-[var(--color-blue)]' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reference Picker Modal */}
      {showReferencePicker && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowReferencePicker(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-[var(--color-bg-grouped)] dark:bg-[var(--color-bg-secondary)] rounded-t-3xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-[var(--color-gray-4)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 pb-3 border-b border-[var(--color-separator)]">
              <div>
                <p className="text-headline text-label font-semibold">{t('reference_images')}</p>
                <p className="text-footnote text-[var(--color-label-secondary)] mt-0.5">{t('reference_desc')}</p>
              </div>
              <button
                onClick={() => setShowReferencePicker(false)}
                className="text-body text-[var(--color-blue)] font-medium"
              >
                {t('close')}
              </button>
            </div>

            {/* Content */}
            <div className="p-4 safe-area-bottom">
              {uploadedReferenceImages.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {uploadedReferenceImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={img} alt="" className="w-16 h-20 object-cover rounded-xl" />
                      <button
                        onClick={() => useAppStore.getState().removeUploadedReference(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-red)] text-white rounded-full text-caption-2 font-bold flex items-center justify-center"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => referenceInputRef.current?.click()}
                disabled={uploadedReferenceImages.length >= 5}
                className="w-full py-4 border-2 border-dashed border-[var(--color-separator)] rounded-2xl text-subheadline text-[var(--color-label-tertiary)] active:bg-[var(--color-fill-quaternary)] transition-colors disabled:opacity-50"
              >
                {t('add_photo')}
              </button>
              <input ref={referenceInputRef} type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
            </div>
          </div>
        </div>
      )}

      {showConsentModal && (
        <ConsentModal
          onAccept={() => { setHasConsented(true); setShowConsentModal(false); }}
          onDecline={() => alert('서비스 이용을 위해서는 약관 동의가 필요합니다.')}
        />
      )}

      {/* Toast - Apple HIG Style */}
      {showAddedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-[var(--color-green)] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span className="font-semibold text-body">백그라운드에서 생성 중!</span>
          </div>
        </div>
      )}

      {/* Queue Indicator */}
      {queue.length > 0 && (
        <div className="fixed top-4 right-4 z-40 safe-area-top">
          <div className="bg-[var(--color-blue)] text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-footnote font-semibold">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {queue.length}개 생성 중
          </div>
        </div>
      )}
    </div>
  );
}
