/**
 * 카메라 페이지 - iOS/토스 스타일
 * - 부드러운 애니메이션
 * - 직관적인 UX
 * - 프리미엄 디자인
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAppStore } from '../stores/useAppStore';
import IOSButton, { IOSIconButton } from '../components/IOSButton';

// 이미지 리사이즈
const resizeImage = (base64: string, maxSize: number = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      if (width === img.width && height === img.height) {
        resolve(base64);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

export default function Camera() {
  const navigate = useNavigate();
  const { setUserPhoto } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewAnimation, setShowPreviewAnimation] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // 전면 카메라
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('카메라 접근 권한이 필요합니다');
    }
  }, []);

  // 카메라 스트림 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // 컴포넌트 마운트시 카메라 시작
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // 프리뷰 상태가 변경되면 카메라 제어
  useEffect(() => {
    if (previewUrl) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [previewUrl, startCamera, stopCamera]);

  const takePhoto = async () => {
    // 실시간 비디오에서 캡처
    if (videoRef.current && canvasRef.current) {
      setIsLoading(true);
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 비디오 크기에 맞춰 캔버스 설정
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 전면 카메라는 미러링되어 보이므로 캡처시 뒤집기
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0);

          const base64Image = canvas.toDataURL('image/jpeg', 0.9);
          const resizedImage = await resizeImage(base64Image, 1024);
          setPreviewUrl(resizedImage);
          setUserPhoto(resizedImage);
          setTimeout(() => setShowPreviewAnimation(true), 50);
        }
      } catch (error) {
        console.error('Capture error:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 폴백: Capacitor Camera 사용
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        const resizedImage = await resizeImage(base64Image, 1024);
        setPreviewUrl(resizedImage);
        setUserPhoto(resizedImage);
        setTimeout(() => setShowPreviewAnimation(true), 50);
      }
    } catch (error) {
      console.error('Camera error:', error);
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (image.base64String) {
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        const resizedImage = await resizeImage(base64Image, 1024);
        setPreviewUrl(resizedImage);
        setUserPhoto(resizedImage);
        setTimeout(() => setShowPreviewAnimation(true), 50);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const resizedImage = await resizeImage(base64, 1024);
        setPreviewUrl(resizedImage);
        setUserPhoto(resizedImage);
        setIsLoading(false);
        setTimeout(() => setShowPreviewAnimation(true), 50);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (previewUrl) {
      navigate('/style-select');
    }
  };

  const handleRetake = () => {
    setShowPreviewAnimation(false);
    setTimeout(() => {
      setPreviewUrl(null);
      setUserPhoto(null);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col safe-area-top safe-area-bottom">
      {/* 헤더 */}
      <header className="relative flex items-center justify-center h-14 px-4">
        <IOSIconButton
          variant="ghost"
          size="md"
          onClick={() => navigate('/')}
          className="absolute left-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </IOSIconButton>
        <h1 className="text-[17px] font-semibold text-[#191f28]">
          사진 촬영
        </h1>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col px-5 pb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {previewUrl ? (
          /* 미리보기 상태 */
          <div className={`flex-1 flex flex-col transition-all duration-500 ${showPreviewAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* 이미지 프리뷰 */}
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl shadow-black/20">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* 체크 배지 */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#00c471] flex items-center justify-center shadow-lg animate-scale-in">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* 확인 메시지 */}
            <div className="text-center mb-6">
              <p className="text-[15px] text-[#4e5968]">
                이 사진을 사용할까요?
              </p>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-3">
              <IOSButton
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleRetake}
              >
                다시 촬영
              </IOSButton>
              <IOSButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                }
                iconPosition="right"
              >
                계속하기
              </IOSButton>
            </div>
          </div>
        ) : (
          /* 촬영 전 상태 - 실시간 카메라 프리뷰 */
          <div className="flex-1 flex flex-col">
            {/* 카메라 영역 */}
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden bg-black">
                {/* 실시간 비디오 프리뷰 */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // 미러링 (셀카처럼)
                />

                {/* 캡처용 숨겨진 캔버스 */}
                <canvas ref={canvasRef} className="hidden" />

                {/* 카메라 에러 표시 */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f2f4f6] to-[#e5e8eb]">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3182f6]/10 to-[#6b5ce7]/10 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#3182f6]">
                        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="17" cy="8" r="1" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-[15px] text-[#6b7684] font-medium text-center px-4">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-4 px-4 py-2 bg-[#3182f6] text-white rounded-lg text-sm font-medium"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {/* 로딩 오버레이 */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-16 h-16">
                      <svg className="w-full h-full animate-spin text-white" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* 가이드 오버레이 */}
                {!cameraError && !isLoading && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 얼굴 가이드 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-64 border-2 border-white/40 rounded-[50%]" />
                    </div>
                    {/* 하단 힌트 */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white/80 text-sm font-medium drop-shadow-lg">
                        얼굴을 가이드 안에 맞춰주세요
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 아이폰 스타일 카메라 버튼 영역 */}
            <div className="flex items-center justify-between px-8 py-4">
              {/* 갤러리 버튼 (왼쪽) */}
              <button
                onClick={selectFromGallery}
                disabled={isLoading}
                className="w-14 h-14 rounded-lg bg-[#1c1c1e] overflow-hidden flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </button>

              {/* 아이폰 스타일 셔터 버튼 (중앙) */}
              <button
                onClick={takePhoto}
                disabled={isLoading}
                className="relative w-20 h-20 rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {/* 외부 링 */}
                <div className="absolute inset-0 rounded-full border-[4px] border-white shadow-lg" />
                {/* 내부 버튼 */}
                <div className="absolute inset-[6px] rounded-full bg-white shadow-inner transition-all duration-150 active:bg-gray-200" />
                {/* 촬영 중 표시 */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>

              {/* 대칭을 위한 오른쪽 공간 */}
              <div className="w-14 h-14" />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
