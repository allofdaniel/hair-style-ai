/**
 * 카메라 페이지 - iOS/토스 스타일
 * - 부드러운 애니메이션
 * - 직관적인 UX
 * - 프리미엄 디자인
 */

import { useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePhoto = async () => {
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
          /* 촬영 전 상태 */
          <div className="flex-1 flex flex-col">
            {/* 카메라 영역 */}
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="w-full max-w-sm aspect-[3/4] rounded-[32px] bg-gradient-to-br from-[#f2f4f6] to-[#e5e8eb] flex flex-col items-center justify-center border-2 border-dashed border-[#d1d6db] transition-all duration-300">
                {isLoading ? (
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-4">
                      <svg className="w-full h-full animate-spin text-[#3182f6]" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-[15px] text-[#6b7684] font-medium">불러오는 중...</p>
                  </div>
                ) : (
                  <div className="text-center animate-fade-in">
                    {/* 일러스트 아이콘 */}
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3182f6]/10 to-[#6b5ce7]/10 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#3182f6]">
                        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="17" cy="8" r="1" fill="currentColor"/>
                      </svg>
                    </div>
                    <h2 className="text-[18px] font-bold text-[#191f28] mb-2">
                      정면 사진을 준비해주세요
                    </h2>
                    <p className="text-[14px] text-[#8b95a1] leading-relaxed">
                      얼굴과 머리카락이<br/>
                      잘 보이는 사진이 좋아요
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {/* 메인 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={selectFromGallery}
                  disabled={isLoading}
                  className="flex-1 flex flex-col items-center gap-2 py-5 px-4 bg-[#f2f4f6] rounded-2xl transition-all duration-200 active:scale-[0.97] active:bg-[#e5e8eb] disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7684" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-semibold text-[#4e5968]">앨범에서 선택</span>
                </button>

                <button
                  onClick={takePhoto}
                  disabled={isLoading}
                  className="flex-1 flex flex-col items-center gap-2 py-5 px-4 bg-gradient-to-br from-[#3182f6] to-[#1b64da] rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-[#3182f6]/30"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="2" y="5" width="20" height="14" rx="3"/>
                      <circle cx="12" cy="12" r="3.5"/>
                      <circle cx="17" cy="8" r="1" fill="white"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-semibold text-white">카메라 촬영</span>
                </button>
              </div>
            </div>

            {/* 팁 카드 */}
            <div className="mt-6 bg-gradient-to-r from-[#3182f6]/5 to-[#6b5ce7]/5 rounded-2xl p-4 border border-[#3182f6]/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3182f6]/10 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#191f28] mb-1">촬영 팁</p>
                  <p className="text-[12px] text-[#6b7684] leading-relaxed">
                    밝은 조명에서 정면을 바라보고 촬영하면<br/>
                    더 자연스러운 결과를 얻을 수 있어요
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
