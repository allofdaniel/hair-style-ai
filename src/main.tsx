import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// Analytics 및 Sentry 초기화
import { initGA } from './services/analytics'
import { initSentry } from './services/sentry'

// Sentry 초기화 (가장 먼저)
initSentry()

// Google Analytics 초기화
initGA()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
