import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import NetworkStatus from './components/NetworkStatus';
import SkipLink from './components/SkipLink';
import { trackPageView } from './services/analytics';
import { initPageSEO } from './services/seo';
import { useI18n } from './i18n/useI18n';
import { initializeRevenueCat } from './services/revenuecat';


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


// 지연 로딩 적용 - 핵심 기능만
const MainMenu = lazy(() => import('./pages/MainMenu'));
const Processing = lazy(() => import('./pages/Processing'));
const ProcessingCustom = lazy(() => import('./pages/ProcessingCustom'));
const CustomStyle = lazy(() => import('./pages/CustomStyle'));
const Result = lazy(() => import('./pages/Result'));
const Settings = lazy(() => import('./pages/Settings'));
const History = lazy(() => import('./pages/History'));
const GrowthSimulation = lazy(() => import('./pages/GrowthSimulation'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

// 앱 상태 변경 핸들러 (백그라운드 -> 포그라운드)
function AppStateHandler() {
  useEffect(() => {
    const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // 앱이 포그라운드로 돌아올 때 WebView 강제 repaint
        document.body.style.display = 'none';
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';

        // 비디오 요소들 재시작 시도
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          if (video.srcObject) {
            video.play().catch(() => {});
          }
        });
      }
    });

    return () => {
      stateListener.then((listener: { remove: () => void }) => listener.remove());
    };
  }, []);

  return null;
}

// Android 뒤로 버튼 핸들러
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackButton = useCallback(() => {
    // 메인 페이지에서 뒤로가기 시 앱 종료
    if (location.pathname === '/') {
      CapacitorApp.exitApp();
    } else {
      // 다른 페이지에서는 이전 페이지로 이동
      navigate(-1);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        handleBackButton();
      }
    });

    return () => {
      backButtonListener.then((listener: { remove: () => void }) => listener.remove());
    };
  }, [handleBackButton]);

  return null;
}

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
  useEffect(() => {
    // 이전 버전의 백그라운드 큐 데이터 정리
    localStorage.removeItem('hair-processing-queue');
    localStorage.removeItem('background-tasks');

    initializeRevenueCat();
  }, []);

  return (
    <BrowserRouter>
      {/* 접근성: 스킵 링크 */}
      <SkipLink />

      {/* 네트워크 상태 표시 */}
      <NetworkStatus />

      {/* 페이지 추적 */}
      <PageTracker />

      {/* Android 뒤로 버튼 처리 */}
      <BackButtonHandler />

      {/* 앱 상태 변경 처리 (백그라운드 복귀 시) */}
      <AppStateHandler />

      {/* 메인 컨텐츠 */}
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* 메인 (헤어스타일 + 카메라) */}
            <Route path="/" element={<MainMenu />} />

            {/* 헤어스타일 시뮬레이션 */}
            <Route path="/processing" element={<Processing />} />
            <Route path="/processing-custom" element={<ProcessingCustom />} />
            <Route path="/custom" element={<CustomStyle />} />
            <Route path="/result" element={<Result />} />

            {/* 머리 성장 시뮬레이션 */}
            <Route path="/growth" element={<GrowthSimulation />} />

            {/* 설정 및 기록 */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* 404 페이지 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

    </BrowserRouter>
  );
}

export default App;
