/**
 * CameraStylePicker - 메인 페이지
 *
 * 카메라가 크게 나오고 하단에 스타일 선택 (커스텀 포함)
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type HairStyle, type Gender } from '../stores/useAppStore';
import { hairStyles, getCategories } from '../data/hairStyles';
import { colorCategories, getColorsByCategory } from '../data/hairColors';

export default function CameraStylePicker() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    setUserPhoto,
    setSelectedStyle,
    gender,
    setGender,
    setUseCustomMode,
    selectedHairColor,
    setSelectedHairColor,
    addUploadedReference,
    uploadedReferenceImages,
  } = useAppStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'photo'>('camera');
  const [customSelected, setCustomSelected] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorCategory, setSelectedColorCategory] = useState('natural');
  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // 현재 성별에 맞는 스타일만 필터링
  const filteredStyles = hairStyles.filter(s => s.gender === gender);
  const categories = getCategories(gender);

  // 선택된 카테고리의 스타일만
  const displayStyles = selectedCategory
    ? filteredStyles.filter(s => s.category === selectedCategory)
    : filteredStyles;

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStream(newStream);
    } catch (error) {
      console.error('카메라 접근 실패:', error);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, mode]);

  // 카메라 전환
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // 성별 전환
  const toggleGender = () => {
    const newGender: Gender = gender === 'male' ? 'female' : 'male';
    setGender(newGender);
    setSelectedCategory(null);
    setSelectedStyles([]);
    setCustomSelected(false);
  };

  // 스타일 토글 (멀티 선택)
  const handleStyleToggle = (style: HairStyle) => {
    // 커스텀 선택 해제
    setCustomSelected(false);

    setSelectedStyles(prev => {
      if (prev.includes(style.id)) {
        return prev.filter(id => id !== style.id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, style.id];
    });
  };

  // 커스텀 선택
  const handleCustomSelect = () => {
    setCustomSelected(true);
    setSelectedStyles([]); // 다른 스타일 선택 해제
  };

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedPhoto(result);
      setMode('photo');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // 카메라 모드로 전환
  const switchToCamera = () => {
    setUploadedPhoto(null);
    setMode('camera');
  };

  // 레퍼런스 이미지 업로드
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      addUploadedReference(result);
      setShowReferencePicker(false);
    };
    reader.readAsDataURL(file);
  };

  // 촬영 및 처리 시작
  const captureAndProcess = async () => {
    const hasSelection = selectedStyles.length > 0 || customSelected;
    if (!hasSelection) return;

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
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.9);
      } else {
        throw new Error('No photo source available');
      }

      setUserPhoto(photoData);

      if (customSelected) {
        // 커스텀 모드
        setUseCustomMode(true);
        navigate('/custom');
      } else {
        // 스타일 모드
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
      alert('사진 촬영에 실패했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  const canProcess = selectedStyles.length > 0 || customSelected;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 카메라/사진 영역 - 상단 대부분 차지 */}
      <div className="relative flex-1" style={{ minHeight: '55vh' }}>
        {mode === 'camera' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : uploadedPhoto ? (
          <div className="absolute inset-0 bg-black">
            <img
              src={uploadedPhoto}
              alt="업로드된 사진"
              className="w-full h-full object-contain"
            />
          </div>
        ) : null}

        {/* 상단 헤더 */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          {/* 성별 전환 */}
          <button
            onClick={toggleGender}
            className="h-11 px-4 rounded-full bg-black/50 backdrop-blur text-white font-medium flex items-center gap-2"
          >
            <span className="text-lg">{gender === 'male' ? '👨' : '👩'}</span>
            <span>{gender === 'male' ? '남성' : '여성'}</span>
          </button>

          <div className="flex gap-2">
            {/* 카메라 전환 */}
            {mode === 'camera' && (
              <button
                onClick={toggleCamera}
                className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* 갤러리 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 설정 */}
            <button
              onClick={() => navigate('/settings')}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 사진 모드일 때 카메라로 돌아가기 버튼 */}
        {mode === 'photo' && (
          <button
            onClick={switchToCamera}
            className="absolute bottom-4 left-4 z-20 h-10 px-4 rounded-full bg-black/70 text-white font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            카메라
          </button>
        )}

        {/* 선택된 스타일 미리보기 */}
        {selectedStyles.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            {selectedStyles.slice(0, 3).map((styleId, idx) => {
              const style = hairStyles.find(s => s.id === styleId);
              if (!style) return null;
              return (
                <div key={styleId} className="relative">
                  <img
                    src={style.thumbnail}
                    alt={style.nameKo}
                    className="w-12 h-16 object-cover rounded-lg border-2 border-white shadow-lg"
                  />
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
            {selectedStyles.length > 3 && (
              <div className="w-12 h-16 bg-black/50 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                +{selectedStyles.length - 3}
              </div>
            )}
          </div>
        )}

        {/* 커스텀 선택됨 표시 */}
        {customSelected && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="h-10 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center gap-2 text-white font-medium">
              <span>✨</span>
              <span>직접 설정</span>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 하단 컨트롤 영역 */}
      <div className="bg-gradient-to-t from-black via-black to-transparent">
        {/* 선택 상태 표시 */}
        {(selectedStyles.length > 0 || customSelected) && (
          <div className="text-center py-2">
            {customSelected ? (
              <span className="text-purple-400 font-bold">직접 설정 선택됨</span>
            ) : (
              <>
                <span className="text-blue-400 font-bold">{selectedStyles.length}개 선택됨</span>
                <span className="text-white/40 ml-2">(최대 5개)</span>
              </>
            )}
          </div>
        )}

        {/* 카테고리 탭 */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60'
            }`}
          >
            전체
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {cat.nameKo}
            </button>
          ))}
        </div>

        {/* 추가 옵션 바 (염색, 레퍼런스) */}
        <div className="flex px-4 py-2 gap-2">
          {/* 염색 버튼 */}
          <button
            onClick={() => setShowColorPicker(true)}
            className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all ${
              selectedHairColor
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                : 'bg-white/10 text-white/70'
            }`}
          >
            <span className="text-lg">🎨</span>
            <span className="text-sm font-medium">
              {selectedHairColor ? '염색 적용됨' : '염색하기'}
            </span>
            {selectedHairColor && (
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: selectedHairColor }}
              />
            )}
          </button>

          {/* 레퍼런스 업로드 버튼 */}
          <button
            onClick={() => setShowReferencePicker(true)}
            className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all ${
              uploadedReferenceImages.length > 0
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                : 'bg-white/10 text-white/70'
            }`}
          >
            <span className="text-lg">📷</span>
            <span className="text-sm font-medium">
              {uploadedReferenceImages.length > 0
                ? `레퍼런스 ${uploadedReferenceImages.length}개`
                : '이런 머리로!'}
            </span>
          </button>
        </div>

        {/* 스타일 그리드 */}
        <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {/* 커스텀 옵션 - 맨 앞에 */}
            <button
              onClick={handleCustomSelect}
              className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden relative ${
                customSelected ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex flex-col items-center justify-center">
                <span className="text-3xl mb-1">✨</span>
                <span className="text-white text-xs font-bold">직접 설정</span>
              </div>
              {customSelected && (
                <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                  <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>

            {/* 스타일 목록 */}
            {displayStyles.map(style => {
              const isSelected = selectedStyles.includes(style.id);
              const selectionIndex = selectedStyles.indexOf(style.id);
              return (
                <button
                  key={style.id}
                  onClick={() => handleStyleToggle(style)}
                  className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden relative ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {style.thumbnail ? (
                    <img
                      src={style.thumbnail}
                      alt={style.nameKo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <span className="text-2xl">✂️</span>
                    </div>
                  )}
                  {/* 선택 표시 */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {selectionIndex + 1}
                      </div>
                    </div>
                  )}
                  {/* 스타일명 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="text-white text-[10px] font-medium truncate text-center">{style.nameKo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="p-4 pb-8">
          <button
            onClick={captureAndProcess}
            disabled={!canProcess || isCapturing}
            className={`w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canProcess && !isCapturing
                ? customSelected
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-white/30'
            }`}
          >
            {isCapturing ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : customSelected ? (
              <>
                <span>✨</span>
                <span>직접 설정으로 변환</span>
              </>
            ) : selectedStyles.length > 0 ? (
              <span>{selectedStyles.length}개 스타일 적용</span>
            ) : (
              '스타일을 선택하세요'
            )}
          </button>
        </div>
      </div>

      {/* 염색 색상 선택 모달 */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full bg-[#1a1a2e] rounded-t-3xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">염색 색상 선택</h3>
              <button
                onClick={() => setShowColorPicker(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 카테고리 탭 */}
            <div className="flex px-4 py-3 gap-2 overflow-x-auto scrollbar-hide">
              {colorCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedColorCategory(cat.id)}
                  className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all ${
                    selectedColorCategory === cat.id
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {cat.nameKo}
                </button>
              ))}
            </div>

            {/* 색상 그리드 */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-4 gap-3">
                {/* 색상 없음 옵션 */}
                <button
                  onClick={() => {
                    setSelectedHairColor(null);
                    setShowColorPicker(false);
                  }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 ${
                    !selectedHairColor ? 'ring-2 ring-white' : 'bg-white/10'
                  }`}
                >
                  <span className="text-2xl">🚫</span>
                  <span className="text-white/60 text-[10px]">없음</span>
                </button>

                {getColorsByCategory(selectedColorCategory).map(color => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedHairColor(color.hex);
                      setShowColorPicker(false);
                    }}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedHairColor === color.hex ? 'ring-2 ring-white scale-105' : ''
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-white text-[10px] font-medium drop-shadow-lg text-center px-1">
                      {color.nameKo}
                    </span>
                    {selectedHairColor === color.hex && (
                      <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 레퍼런스 이미지 선택 모달 */}
      {showReferencePicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full bg-[#1a1a2e] rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">이런 머리스타일로!</h3>
                <p className="text-white/50 text-sm">원하는 스타일 이미지를 업로드하세요</p>
              </div>
              <button
                onClick={() => setShowReferencePicker(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {/* 업로드된 레퍼런스 이미지들 */}
              {uploadedReferenceImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/60 text-sm mb-2">업로드된 레퍼런스 ({uploadedReferenceImages.length}/5)</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {uploadedReferenceImages.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img
                          src={img}
                          alt={`레퍼런스 ${idx + 1}`}
                          className="w-20 h-28 object-cover rounded-xl"
                        />
                        <button
                          onClick={() => {
                            const { removeUploadedReference } = useAppStore.getState();
                            removeUploadedReference(idx);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 업로드 버튼 */}
              <button
                onClick={() => referenceInputRef.current?.click()}
                disabled={uploadedReferenceImages.length >= 5}
                className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                  uploadedReferenceImages.length >= 5
                    ? 'border-white/10 text-white/30'
                    : 'border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                <span className="text-4xl">📷</span>
                <span className="font-medium">
                  {uploadedReferenceImages.length >= 5 ? '최대 5개까지' : '사진 추가하기'}
                </span>
                <span className="text-sm text-white/50">인터넷에서 원하는 헤어스타일 사진을 저장해서 올려주세요</span>
              </button>

              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />

              {/* 확인 버튼 */}
              <button
                onClick={() => setShowReferencePicker(false)}
                className="w-full h-14 mt-4 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold"
              >
                {uploadedReferenceImages.length > 0 ? '적용하기' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
