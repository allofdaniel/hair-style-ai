/**
 * Home 페이지 - iOS/토스 스타일
 * - 깔끔한 화이트 테마
 * - 부드러운 애니메이션
 * - 프리미엄 느낌
 */

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import IOSButton, { IOSIconButton } from '../components/IOSButton';

export default function Home() {
  const navigate = useNavigate();
  const { gender, setGender } = useAppStore();

  const handleStart = () => {
    navigate('/camera');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col safe-area-top safe-area-bottom">
      {/* 헤더 */}
      <header className="px-5 py-4 flex justify-end items-center">
        <IOSIconButton
          variant="secondary"
          size="md"
          onClick={() => navigate('/settings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </IOSIconButton>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* 로고 & 타이틀 */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#3182f6] to-[#6b5ce7] flex items-center justify-center shadow-2xl shadow-[#3182f6]/30">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                <path d="M9 6c-.5-1 0-3 3-3s3.5 2 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-[#00c471] to-[#00d68f] flex items-center justify-center shadow-lg shadow-[#00c471]/30 animate-scale-in">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-[#191f28] mb-2 tracking-tight">
            LookSim
          </h1>
          <p className="text-[#8b95a1] text-[16px]">
            AI 헤어 시뮬레이션
          </p>
        </div>

        {/* 성별 선택 */}
        <div className="w-full max-w-sm mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-center text-[#8b95a1] text-[13px] mb-4 font-medium">
            스타일 유형을 선택하세요
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 py-6 px-4 rounded-2xl font-semibold transition-all duration-300 active:scale-[0.97] ${
                gender === 'male'
                  ? 'bg-[#3182f6] text-white shadow-xl shadow-[#3182f6]/30'
                  : 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  gender === 'male' ? 'bg-white/20' : 'bg-white shadow-sm'
                }`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className={gender === 'male' ? 'text-white' : 'text-[#6b7684]'}>
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z"/>
                  </svg>
                </div>
                <span className="text-[15px]">남성</span>
              </div>
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 py-6 px-4 rounded-2xl font-semibold transition-all duration-300 active:scale-[0.97] ${
                gender === 'female'
                  ? 'bg-[#6b5ce7] text-white shadow-xl shadow-[#6b5ce7]/30'
                  : 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  gender === 'female' ? 'bg-white/20' : 'bg-white shadow-sm'
                }`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className={gender === 'female' ? 'text-white' : 'text-[#6b7684]'}>
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z"/>
                    <path d="M8 7c0-2 1.5-5 4-5s4 3 4 5" strokeWidth="2" stroke="currentColor" fill="none"/>
                  </svg>
                </div>
                <span className="text-[15px]">여성</span>
              </div>
            </button>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="w-full max-w-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
          <IOSButton
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleStart}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            }
          >
            시작하기
          </IOSButton>
        </div>

        {/* 기능 소개 */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#3182f6]/10 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-[13px] text-[#191f28] font-semibold">45+</p>
            <p className="text-[11px] text-[#8b95a1]">스타일</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#6b5ce7]/10 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-[13px] text-[#191f28] font-semibold">K-Pop</p>
            <p className="text-[11px] text-[#8b95a1]">셀럽 스타일</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#00c471]/10 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-[13px] text-[#191f28] font-semibold">100%</p>
            <p className="text-[11px] text-[#8b95a1]">얼굴 보존</p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="p-4">
        <p className="text-center text-[12px] text-[#b0b8c1]">
          얼굴은 그대로, 헤어스타일만 변환됩니다
        </p>
      </footer>
    </div>
  );
}
