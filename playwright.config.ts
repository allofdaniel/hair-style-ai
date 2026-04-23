import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * BeforeCut 앱의 주요 사용자 플로우 테스트
 */
export default defineConfig({
  testDir: './e2e',

  // 각 테스트 타임아웃 (30초)
  timeout: 30 * 1000,

  // expect 타임아웃 (5초)
  expect: {
    timeout: 5000,
  },

  // 테스트 실패 시 재시도
  fullyParallel: true,

  // CI에서만 실패 시 재시도
  forbidOnly: !!process.env.CI,

  // 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 병렬 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // 공통 설정
  use: {
    // Base URL
    baseURL: 'http://localhost:5173',

    // 스크린샷 설정 (실패 시만)
    screenshot: 'only-on-failure',

    // 비디오 설정 (실패 시만)
    video: 'retain-on-failure',

    // Trace 설정 (재시도 시만)
    trace: 'on-first-retry',

    // 브라우저 컨텍스트 권한
    permissions: ['camera', 'clipboard-read', 'clipboard-write'],

    // 뷰포트 크기 (모바일 기본)
    viewport: { width: 375, height: 667 },
  },

  // 테스트 전 로컬 서버 시작
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 프로젝트 설정 (다양한 디바이스)
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        permissions: ['camera', 'clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        permissions: ['camera', 'clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        permissions: ['camera', 'clipboard-read', 'clipboard-write'],
      },
    },
  ],

  // 테스트 출력 디렉토리
  outputDir: 'test-results/',
});
