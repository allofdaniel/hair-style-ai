import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'apple-touch-icon.svg', 'og-image.svg'],
      manifest: {
        name: 'LookSim - AI 외모 시뮬레이션',
        short_name: 'LookSim',
        description: 'AI로 헤어스타일, 체중 변화, 피부 시술 등 외모 변화를 미리 시뮬레이션해보세요.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3182f6',
        orientation: 'portrait-primary',
        categories: ['beauty', 'lifestyle', 'utilities'],
        lang: 'ko',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // 개발 환경에서 SW 비활성화
      },
    }),
  ],
  build: {
    // 소스맵 비활성화 (리버스엔지니어링 방지)
    sourcemap: false,
    // 최소화 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log 제거
        drop_debugger: true, // debugger 제거
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // 특정 함수 제거
      },
      mangle: {
        safari10: true,
        // 프로퍼티 난독화 제거 - zustand/react 호환성 문제 방지
      },
      format: {
        comments: false, // 주석 제거
      },
    },
    // 청크 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand'],
          'vendor-ai': ['openai'],
          'vendor-sentry': ['@sentry/react'],
        },
        // 파일명 해시로 캐싱 최적화
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 청크 크기 경고 한도
    chunkSizeWarningLimit: 500,
    // CSS 코드 분할
    cssCodeSplit: true,
    // 타겟 브라우저
    target: 'es2020',
  },
  // 개발 서버 보안 설정
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  // 프리뷰 서버 보안 설정
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://www.google-analytics.com;",
    },
  },
})
