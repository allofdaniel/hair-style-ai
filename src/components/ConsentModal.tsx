import { useState } from 'react';
import { saveConsentSettings } from './CookieConsent';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const [allChecked, setAllChecked] = useState(false);

  const handleAccept = () => {
    // Save cookie consent as well
    saveConsentSettings({
      analytics: true,
      marketing: true,
      personalization: true,
    });
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Icon & Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">BeforeCut 시작하기</h2>
          <p className="text-sm text-gray-500">서비스 이용을 위해 약관에 동의해주세요</p>
        </div>

        {/* Consent Checkbox */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setAllChecked(!allChecked)}
            className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition-colors"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              allChecked
                ? 'bg-blue-500 shadow-md'
                : 'border-2 border-gray-300'
            }`}>
              {allChecked && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-base font-medium text-gray-900">모든 약관에 동의합니다</span>
          </button>

          {/* Terms List */}
          <div className="mt-3 px-2 space-y-1">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">이용약관 동의 (필수)</span>
              <a href="/terms" className="text-xs text-blue-500">보기</a>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">개인정보처리방침 동의 (필수)</span>
              <a href="/privacy" className="text-xs text-blue-500">보기</a>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">만 14세 이상 확인 (필수)</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">얼굴 사진 AI 처리 동의 (필수)</span>
            </div>
          </div>

          {/* Notice */}
          <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
            사진은 AI 시뮬레이션 후 즉시 삭제되며<br/>서버에 저장되지 않습니다
          </p>
        </div>

        {/* Buttons */}
        <div className="p-4 pt-0">
          <button
            onClick={handleAccept}
            disabled={!allChecked}
            className={`w-full h-14 rounded-2xl font-semibold text-base transition-all ${
              allChecked
                ? 'bg-gray-900 text-white active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            시작하기
          </button>
          <button
            onClick={onDecline}
            className="w-full h-10 mt-2 text-gray-400 text-sm"
          >
            나중에
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
