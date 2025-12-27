/**
 * 스플래시 스크린 컴포넌트
 * - 앱 로딩 중 표시
 * - 브랜드 로고 및 애니메이션
 * - 다크/라이트 모드 지원
 */

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number; // 최소 표시 시간 (ms)
}

export default function SplashScreen({
  onComplete,
  minDuration = 1500,
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 300); // 페이드 아웃 시간
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#ec4899] flex flex-col items-center justify-center transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 로고 */}
      <div className="relative">
        {/* 글로우 효과 */}
        <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full scale-150 animate-pulse" />

        {/* 로고 아이콘 */}
        <div className="relative w-28 h-28 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-900/50 animate-bounce-slow">
          {/* 헤어 아이콘 */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="animate-float"
          >
            {/* 얼굴 */}
            <circle cx="32" cy="36" r="16" fill="white" fillOpacity="0.9" />
            {/* 헤어 */}
            <path
              d="M16 28C16 16 24 8 32 8C40 8 48 16 48 28C48 32 46 35 44 36C44 32 40 24 32 24C24 24 20 32 20 36C18 35 16 32 16 28Z"
              fill="white"
            />
            {/* 하이라이트 */}
            <path
              d="M22 18C22 18 26 12 32 12C38 12 42 18 42 18"
              stroke="white"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 앱 이름 */}
      <h1 className="mt-8 text-white text-3xl font-bold tracking-tight">
        LookSim
      </h1>
      <p className="mt-2 text-white/70 text-sm font-medium">
        AI Hairstyle Simulation
      </p>

      {/* 로딩 인디케이터 */}
      <div className="mt-12 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* 스타일 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * PWA 스플래시 스크린 설정 가이드
 *
 * manifest.json에 다음 항목 추가:
 * {
 *   "splash_pages": null,
 *   "background_color": "#6366f1",
 *   "theme_color": "#6366f1"
 * }
 *
 * iOS Safari의 경우 index.html에 다음 추가:
 * <meta name="apple-mobile-web-app-capable" content="yes">
 * <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
 * <link rel="apple-touch-startup-image" href="/splash-iphone.png">
 */

/**
 * 앱 아이콘 생성 가이드
 *
 * 필요한 아이콘 사이즈:
 * - 16x16: favicon-16x16.png
 * - 32x32: favicon-32x32.png
 * - 48x48: favicon-48x48.png
 * - 72x72: icon-72x72.png (Android)
 * - 96x96: icon-96x96.png (Android)
 * - 128x128: icon-128x128.png (Android)
 * - 144x144: icon-144x144.png (Android)
 * - 152x152: icon-152x152.png (iOS)
 * - 192x192: icon-192x192.png (Android, PWA)
 * - 384x384: icon-384x384.png (Android)
 * - 512x512: icon-512x512.png (Android, PWA)
 *
 * iOS 스플래시 스크린:
 * - 1125x2436: iPhone X, XS, 11 Pro
 * - 1242x2688: iPhone XS Max, 11 Pro Max
 * - 828x1792: iPhone XR, 11
 * - 1170x2532: iPhone 12, 12 Pro, 13, 13 Pro, 14
 * - 1284x2778: iPhone 12 Pro Max, 13 Pro Max, 14 Plus
 * - 1179x2556: iPhone 14 Pro
 * - 1290x2796: iPhone 14 Pro Max
 * - 1640x2360: iPad Pro 11"
 * - 2048x2732: iPad Pro 12.9"
 */

/**
 * SVG 로고 (벡터 버전)
 * public/logo.svg로 저장하여 사용
 */
export const LogoSVG = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {/* 배경 */}
    <rect width="100" height="100" rx="22" fill="url(#logoGradient)" />
    {/* 얼굴 */}
    <circle cx="50" cy="58" r="20" fill="white" fillOpacity="0.95" />
    {/* 헤어 */}
    <path
      d="M25 42C25 24 37 14 50 14C63 14 75 24 75 42C75 48 72 52 68 54C68 48 62 36 50 36C38 36 32 48 32 54C28 52 25 48 25 42Z"
      fill="white"
    />
    {/* 하이라이트 */}
    <path
      d="M35 28C35 28 42 20 50 20C58 20 65 28 65 28"
      stroke="white"
      strokeOpacity="0.4"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 앱 아이콘 컴포넌트 (미리보기용)
 */
export function AppIconPreview({ size = 192 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-[22%] overflow-hidden shadow-xl"
    >
      <LogoSVG />
    </div>
  );
}
