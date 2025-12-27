import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import NetworkStatus from './components/NetworkStatus';
import SkipLink from './components/SkipLink';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CookieConsent from './components/CookieConsent';
import OnboardingTutorial, { hasCompletedOnboarding } from './components/OnboardingTutorial';
import BackgroundTaskIndicator from './components/BackgroundTaskIndicator';
import { trackPageView } from './services/analytics';
import { initPageSEO } from './services/seo';
import { useI18n } from './i18n/useI18n';

// 온보딩 상태 관리 컴포넌트
function OnboardingManager() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 첫 방문 사용자에게 온보딩 표시
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  if (!showOnboarding) return null;

  return <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />;
}

// iOS 스타일 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center" role="status" aria-label="페이지 로딩 중">
    <div className="text-center">
      <div className="relative w-12 h-12 mx-auto mb-4">
        <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24">
          <circle
            cx="12" cy="12" r="10"
            stroke="#f2f4f6"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="12" cy="12" r="10"
            stroke="#3182f6"
            strokeWidth="3"
            fill="none"
            strokeDasharray="30 70"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  </div>
);


// 지연 로딩 적용
const MainMenu = lazy(() => import('./pages/MainMenu'));
const Camera = lazy(() => import('./pages/Camera'));
const Processing = lazy(() => import('./pages/Processing'));
const ProcessingCustom = lazy(() => import('./pages/ProcessingCustom'));
const CustomStyle = lazy(() => import('./pages/CustomStyle'));
const Result = lazy(() => import('./pages/Result'));
const Settings = lazy(() => import('./pages/Settings'));
const History = lazy(() => import('./pages/History'));
const FaceAnalysis = lazy(() => import('./pages/FaceAnalysis'));
const WeightSimulation = lazy(() => import('./pages/WeightSimulation'));
const FitnessSimulation = lazy(() => import('./pages/FitnessSimulation'));
const HairColorSimulation = lazy(() => import('./pages/HairColorSimulation'));
const HairVolumeSimulation = lazy(() => import('./pages/HairVolumeSimulation'));
const SkinTreatmentSimulation = lazy(() => import('./pages/SkinTreatmentSimulation'));
const AgingSimulation = lazy(() => import('./pages/AgingSimulation'));
const MakeupSimulation = lazy(() => import('./pages/MakeupSimulation'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Admin = lazy(() => import('./pages/Admin'));

// 페이지 추적 및 SEO 컴포넌트
function PageTracker() {
  const location = useLocation();
  const { language } = useI18n();

  useEffect(() => {
    // 페이지 변경 시 Analytics 트래킹
    trackPageView({
      page_path: location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });

    // SEO 메타태그 업데이트
    const pageName = location.pathname === '/' ? 'home' : location.pathname.slice(1);
    initPageSEO({
      page: pageName,
      language,
      path: location.pathname,
    });
  }, [location, language]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      {/* 접근성: 스킵 링크 */}
      <SkipLink />

      {/* 네트워크 상태 표시 */}
      <NetworkStatus />

      {/* 페이지 추적 */}
      <PageTracker />

      {/* 메인 컨텐츠 */}
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* 메인 (헤어스타일 + 카메라) */}
            <Route path="/" element={<MainMenu />} />

            {/* 헤어스타일 시뮬레이션 */}
            <Route path="/camera" element={<Camera />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/processing-custom" element={<ProcessingCustom />} />
            <Route path="/custom" element={<CustomStyle />} />
            <Route path="/result" element={<Result />} />

            {/* 추가 기능 (햄버거 메뉴에서 접근) */}
            <Route path="/analysis" element={<FaceAnalysis />} />
            <Route path="/weight" element={<WeightSimulation />} />
            <Route path="/fitness" element={<FitnessSimulation />} />
            <Route path="/hair-color" element={<HairColorSimulation />} />
            <Route path="/hair-volume" element={<HairVolumeSimulation />} />
            <Route path="/skin-treatment" element={<SkinTreatmentSimulation />} />
            <Route path="/aging" element={<AgingSimulation />} />
            <Route path="/makeup" element={<MakeupSimulation />} />

            {/* 설정 및 기록 */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* 관리자 페이지 */}
            <Route path="/admin" element={<Admin />} />

            {/* 404 페이지 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* 온보딩 튜토리얼 (첫 방문 사용자) */}
      <OnboardingManager />

      {/* 백그라운드 작업 표시기 */}
      <BackgroundTaskIndicator />

      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />

      {/* GDPR/CCPA 쿠키 동의 배너 */}
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
