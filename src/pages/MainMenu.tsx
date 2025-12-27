/**
 * MainMenu - UX 심리학 법칙 적용 디자인
 *
 * 적용된 UX 법칙:
 * 1. 힉의 법칙: 카테고리 6개로 제한, 선택지 단순화
 * 2. 밀러의 법칙: 정보 5-7개 그룹핑, 초기 인기 스타일만 표시
 * 3. 피츠의 법칙: 핵심 버튼(촬영) 72px, 터치 영역 최소 44px
 * 4. 제이콥의 법칙: 표준 아이콘(X, 햄버거, 뒤로가기), 친숙한 패턴
 * 5. 테슬러의 법칙: 기본값 자동 설정, 추천 자동화
 * 6. 도허티 임계값: 400ms 이내 피드백, 스켈레톤 UI
 * 7. 3초 법칙: 이미지 지연 로딩, 즉각적 인터랙션
 */

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type HairStyle } from '../stores/useAppStore';
import { hairStyles, getCategories, getStylesByCategory } from '../data/hairStyles';
import { colorCategories, getColorsByCategory } from '../data/hairColors';
import ConsentModal from '../components/ConsentModal';
import { useI18n } from '../i18n/useI18n';

// 피츠의 법칙: 터치 영역 최소 44x44px 확보
// 도허티 임계값: 즉각적 시각 피드백 (active:scale-95)
const StyleItem = memo(({ style, isSelected, index, onToggle }: {
  style: HairStyle;
  isSelected: boolean;
  index: number;
  onToggle: (style: HairStyle) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      onClick={() => onToggle(style)}
      className={`flex-shrink-0 w-[88px] h-[110px] rounded-2xl overflow-hidden relative
        transition-all duration-150 active:scale-95
        ${isSelected ? 'ring-2 ring-[#3182f6] ring-offset-1 ring-offset-black' : ''}`}
      style={{ minWidth: '88px', minHeight: '110px' }} // 피츠의 법칙: 최소 터치 영역
    >
      {/* 3초 법칙: 스켈레톤 UI로 즉각적 피드백 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-[#2a2a2a] animate-pulse" />
      )}
      {style.thumbnail ? (
        <img
          src={style.thumbnail}
          alt={style.nameKo}
          className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-[#f2f4f6]" />
      )}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#3182f6] rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-[11px] font-bold">{index + 1}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-8">
        <p className="text-white text-[12px] font-medium truncate">{style.nameKo}</p>
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
    setUserPhoto, setSelectedStyle, gender, setGender,
    setUseCustomMode, selectedHairColor, setSelectedHairColor,
    addUploadedReference, uploadedReferenceImages,
    hasConsented, setHasConsented,
  } = useAppStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  // 테슬러의 법칙: 기본값을 '인기'로 설정하여 사용자 결정 부담 감소
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'photo'>('camera');
  const [customSelected, setCustomSelected] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorCategory, setSelectedColorCategory] = useState('natural');
  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    if (!hasConsented) setShowConsentModal(true);
  }, [hasConsented]);

  // 밀러의 법칙: 한 번에 5-7개 정보 그룹으로 제한
  const categories = useMemo(() => getCategories(gender), [gender]);
  // 테슬러의 법칙: 복잡한 필터링을 시스템이 처리
  const displayStyles = useMemo(() =>
    getStylesByCategory(gender, selectedCategory)
  , [gender, selectedCategory]);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
    } catch (error) {
      console.error('카메라 접근 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') startCamera(facingMode);
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [facingMode, mode, startCamera]);

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
      if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
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
        if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.9);
      } else throw new Error('No photo source');

      setUserPhoto(photoData);
      if (customSelected) {
        setUseCustomMode(true);
        navigate('/custom');
      } else {
        setUseCustomMode(false);
        if (selectedStyles.length === 1) {
          const style = hairStyles.find(s => s.id === selectedStyles[0]);
          if (style) setSelectedStyle(style);
        }
        localStorage.setItem('selectedStyleIds', JSON.stringify(selectedStyles));
        navigate('/processing');
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
      {/* 카메라 영역 */}
      <div className="relative flex-1 min-h-0">
        {mode === 'camera' ? (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : uploadedPhoto && (
          <img src={uploadedPhoto} alt="" className="w-full h-full object-contain bg-black" />
        )}

        {/* 상단 - 제이콥의 법칙: 표준 아이콘 사용 (햄버거, 앨범) */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center safe-area-top">
          {/* 피츠의 법칙: 터치 영역 44x44 확보 */}
          <button
            onClick={() => setShowMenu(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:scale-95 transition-transform"
          >
            {/* 표준 햄버거 메뉴 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <span className="text-white text-[17px] font-semibold drop-shadow-lg">{t('app_name')}</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:scale-95 transition-transform"
          >
            {/* 표준 앨범/갤러리 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* 하단 카메라 전환, 사진모드 복귀 - 피츠의 법칙: 버튼 크기 확대 */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between items-center">
          {mode === 'photo' ? (
            <button
              onClick={() => { setUploadedPhoto(null); setMode('camera'); }}
              className="h-10 px-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              <span className="text-white/90 text-[13px] font-medium">{t('back_to_camera')}</span>
            </button>
          ) : (
            <button
              onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
              className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              {/* 표준 카메라 전환 아이콘 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 3h5v5M8 21H3v-5"/>
                <path d="M21 3l-7.5 7.5M3 21l7.5-7.5"/>
              </svg>
            </button>
          )}
          {/* 성별 - 힉의 법칙: 명확한 2개 선택지 */}
          <div className="flex bg-black/30 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => { setGender('male'); setSelectedCategory('popular'); setSelectedStyles([]); }}
              className={`px-5 py-2 text-[13px] font-medium rounded-full transition-all ${
                gender === 'male' ? 'bg-white text-black' : 'text-white/80'
              }`}
            >{t('male')}</button>
            <button
              onClick={() => { setGender('female'); setSelectedCategory('popular'); setSelectedStyles([]); }}
              className={`px-5 py-2 text-[13px] font-medium rounded-full transition-all ${
                gender === 'female' ? 'bg-white text-black' : 'text-white/80'
              }`}
            >{t('female')}</button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 하단 패널 */}
      <div className="bg-[#1a1a1a] rounded-t-3xl pt-5 pb-8 px-4">
        {/* 카테고리 - 힉의 법칙: 6개로 제한, 밀러의 법칙: 그룹핑 */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 h-10 px-4 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 active:bg-white/20'
              }`}
            >
              {'icon' in cat && <span className="text-[14px]">{cat.icon}</span>}
              <span>{cat.nameKo}</span>
            </button>
          ))}
        </div>

        {/* 스타일 목록 - 밀러의 법칙: 인기 카테고리는 5개만, 피츠의 법칙: 터치 영역 확대 */}
        <div className="flex gap-3 overflow-x-auto pb-5 scrollbar-hide">
          {/* 커스텀 버튼 */}
          <button
            onClick={() => { setCustomSelected(true); setSelectedStyles([]); }}
            className={`flex-shrink-0 w-[88px] h-[110px] rounded-2xl bg-gradient-to-br from-[#3182f6] to-[#6366f1]
              flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
              customSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span className="text-white text-[11px] font-medium">{t('custom_setting')}</span>
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

        {/* 하단 액션 - 피츠의 법칙: 핵심 버튼(촬영) 가장 크게, 부가 버튼 충분한 터치 영역 */}
        <div className="flex items-center justify-between px-4">
          {/* 염색 버튼 - 피츠의 법칙: 최소 48x48 */}
          <button
            onClick={() => setShowColorPicker(true)}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            {selectedHairColor ? (
              <div className="w-7 h-7 rounded-full border-2 border-white/30" style={{ backgroundColor: selectedHairColor }} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span className="text-white/50 text-[10px]">{t('dye')}</span>
              </>
            )}
          </button>

          {/* 메인 촬영 버튼 - 피츠의 법칙: 가장 중요한 기능이므로 가장 크게 (80px) */}
          <button
            onClick={captureAndProcess}
            disabled={!canProcess || isCapturing}
            className={`w-20 h-20 rounded-full transition-all active:scale-95 shadow-lg ${
              canProcess ? 'bg-[#3182f6] shadow-[#3182f6]/30' : 'bg-white/20'
            }`}
          >
            {isCapturing ? (
              <div className="w-8 h-8 mx-auto border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className={`w-16 h-16 mx-auto rounded-full border-[3px] transition-all ${
                canProcess ? 'border-white' : 'border-white/30'
              }`} />
            )}
          </button>

          {/* 참고 이미지 버튼 */}
          <button
            onClick={() => setShowReferencePicker(true)}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            {uploadedReferenceImages.length > 0 ? (
              <span className="text-[#3182f6] text-[15px] font-bold">{uploadedReferenceImages.length}</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M12 8v8M8 12h8"/>
                </svg>
                <span className="text-white/50 text-[10px]">{t('reference')}</span>
              </>
            )}
          </button>
        </div>

        {canProcess && (
          <p className="text-center text-white/50 text-[12px] mt-4">
            {customSelected ? t('custom_mode') : `${selectedStyles.length}${t('selected_count')}`}
          </p>
        )}
      </div>

      {/* 사이드 메뉴 - 제이콥의 법칙: 표준 슬라이드 메뉴 패턴 */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-in-left"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 - 제이콥의 법칙: X 버튼으로 닫기 */}
            <div className="flex justify-between items-start p-6 pt-12 safe-area-top">
              <div>
                <h2 className="text-[22px] font-bold text-[#191f28]">{t('app_name')}</h2>
                <p className="text-[14px] text-[#8b95a1] mt-1">{t('app_desc')}</p>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191f28" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* 밀러의 법칙: 메뉴 항목 5개로 그룹화 */}
            <nav className="px-4 space-y-1">
              {/* 메인 기능 그룹 */}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-4 text-[16px] font-medium text-[#191f28] bg-[#f2f4f6] rounded-2xl"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-9M14 17H5"/>
                  <circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
                </svg>
                {t('hairstyle')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/analysis'); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-[16px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M3 21c0-4 3.6-8 8-8h2c4.4 0 8 4 8 8"/>
                </svg>
                {t('face_analysis')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/weight'); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-[16px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M6.34 6.34l2.83 2.83M2 12h4M6.34 17.66l2.83-2.83M12 18v4M17.66 17.66l-2.83-2.83M18 12h4M17.66 6.34l-2.83 2.83"/>
                </svg>
                {t('weight_simulation')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/fitness'); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-[16px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6.5 6.5h11v11h-11z"/>
                  <path d="M4 4h3v3H4zM17 4h3v3h-3zM4 17h3v3H4zM17 17h3v3h-3z"/>
                </svg>
                {t('fitness_simulation')}
              </button>

              {/* 구분선 */}
              <div className="h-px bg-[#f2f4f6] my-2" />
              <p className="px-4 py-2 text-[11px] text-[#8b95a1] font-medium uppercase tracking-wide">{t('beauty_simulations')}</p>

              <button
                onClick={() => { setShowMenu(false); navigate('/hair-color'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                {t('hair_color_simulation')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/hair-volume'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
                  <path d="M2 12c0-2.76 1.12-5.26 2.93-7.07"/>
                </svg>
                {t('hair_volume_simulation')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/skin-treatment'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                {t('skin_treatment_simulation')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/aging'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {t('aging_simulation')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/makeup'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#4e5968] rounded-2xl hover:bg-[#f9fafb] active:bg-[#f2f4f6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {t('makeup_simulation')}
              </button>
            </nav>

            {/* 하단 보조 메뉴 */}
            <div className="absolute bottom-8 left-0 right-0 px-4 space-y-1 safe-area-bottom">
              <button
                onClick={() => { setShowMenu(false); navigate('/history'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#6b7684] rounded-xl hover:bg-[#f9fafb]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {t('history')}
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-[#6b7684] rounded-xl hover:bg-[#f9fafb]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                {t('settings')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 염색 모달 */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowColorPicker(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[70vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#f2f4f6]">
              <span className="text-[17px] font-semibold text-[#191f28]">{t('hair_color')}</span>
              <button onClick={() => setShowColorPicker(false)} className="text-[15px] text-[#8b95a1]">{t('close')}</button>
            </div>
            <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
              {colorCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedColorCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium ${
                    selectedColorCategory === cat.id ? 'bg-[#191f28] text-white' : 'bg-[#f2f4f6] text-[#6b7684]'
                  }`}
                >{cat.nameKo}</button>
              ))}
            </div>
            <div className="p-5 grid grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto">
              <button
                onClick={() => { setSelectedHairColor(null); setShowColorPicker(false); }}
                className={`aspect-square rounded-2xl bg-[#f2f4f6] flex items-center justify-center ${!selectedHairColor ? 'ring-2 ring-[#3182f6]' : ''}`}
              >
                <span className="text-[#b0b8c1] text-[11px]">{t('no_color')}</span>
              </button>
              {getColorsByCategory(selectedColorCategory).map(color => (
                <button
                  key={color.id}
                  onClick={() => { setSelectedHairColor(color.hex); setShowColorPicker(false); }}
                  className={`aspect-square rounded-2xl ${selectedHairColor === color.hex ? 'ring-2 ring-[#3182f6]' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 참고 이미지 모달 */}
      {showReferencePicker && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowReferencePicker(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#f2f4f6]">
              <div>
                <p className="text-[17px] font-semibold text-[#191f28]">{t('reference_images')}</p>
                <p className="text-[13px] text-[#8b95a1] mt-0.5">{t('reference_desc')}</p>
              </div>
              <button onClick={() => setShowReferencePicker(false)} className="text-[15px] text-[#8b95a1]">{t('close')}</button>
            </div>
            <div className="p-5">
              {uploadedReferenceImages.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {uploadedReferenceImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={img} alt="" className="w-20 h-24 object-cover rounded-2xl" />
                      <button
                        onClick={() => useAppStore.getState().removeUploadedReference(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#191f28] text-white rounded-full text-[12px]"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => referenceInputRef.current?.click()}
                disabled={uploadedReferenceImages.length >= 5}
                className="w-full py-4 border-2 border-dashed border-[#e5e8eb] rounded-2xl text-[14px] text-[#8b95a1]"
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
    </div>
  );
}
