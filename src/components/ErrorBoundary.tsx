import { Component, type ReactNode } from 'react';
import { captureError } from '../services/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.PROD) {
      captureError(error, {
        errorInfo,
      });
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F0F1A] to-[#1a1a2e] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">문제가 발생했습니다</h1>
            <p className="text-gray-400 mb-6">
              일시적인 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도하거나, 앱을 재시작해 주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full py-3 px-6 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                홈으로 이동
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left" open>
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">오류 상세</summary>
                <pre className="mt-2 p-4 bg-black/50 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
