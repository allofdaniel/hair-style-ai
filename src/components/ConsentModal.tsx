import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const navigate = useNavigate();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [faceDataChecked, setFaceDataChecked] = useState(false);

  const allChecked = termsChecked && privacyChecked && ageChecked && faceDataChecked;

  const handleCheckAll = () => {
    const newValue = !allChecked;
    setTermsChecked(newValue);
    setPrivacyChecked(newValue);
    setAgeChecked(newValue);
    setFaceDataChecked(newValue);
  };

  const CheckIcon = ({ checked }: { checked: boolean }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
      checked ? 'bg-gray-900' : 'border-2 border-gray-300'
    }`}>
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">서비스 이용 동의</h2>
          <p className="text-sm text-gray-500">LookSim 이용을 위해 약관에 동의해주세요</p>
        </div>

        {/* Consent Items */}
        <div className="px-6 pb-4">
          {/* Check All */}
          <button
            onClick={handleCheckAll}
            className="w-full flex items-center gap-3 py-4 border-b border-gray-100"
          >
            <CheckIcon checked={allChecked} />
            <span className="text-base font-semibold text-gray-900">전체 동의</span>
          </button>

          <div className="py-2 space-y-1">
            {/* Terms */}
            <button
              onClick={() => setTermsChecked(!termsChecked)}
              className="w-full flex items-center gap-3 py-3"
            >
              <CheckIcon checked={termsChecked} />
              <span className="text-sm text-gray-700 flex-1 text-left">[필수] 이용약관 동의</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/terms'); }}
                className="text-gray-400 text-xs hover:text-gray-600"
              >
                보기
              </button>
            </button>

            {/* Privacy */}
            <button
              onClick={() => setPrivacyChecked(!privacyChecked)}
              className="w-full flex items-center gap-3 py-3"
            >
              <CheckIcon checked={privacyChecked} />
              <span className="text-sm text-gray-700 flex-1 text-left">[필수] 개인정보처리방침 동의</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/privacy'); }}
                className="text-gray-400 text-xs hover:text-gray-600"
              >
                보기
              </button>
            </button>

            {/* Age */}
            <button
              onClick={() => setAgeChecked(!ageChecked)}
              className="w-full flex items-center gap-3 py-3"
            >
              <CheckIcon checked={ageChecked} />
              <span className="text-sm text-gray-700 flex-1 text-left">[필수] 만 14세 이상입니다</span>
            </button>

            {/* Face Data */}
            <button
              onClick={() => setFaceDataChecked(!faceDataChecked)}
              className="w-full flex items-center gap-3 py-3"
            >
              <CheckIcon checked={faceDataChecked} />
              <span className="text-sm text-gray-700 flex-1 text-left">[필수] 얼굴 사진 AI 처리 동의</span>
            </button>
          </div>

          {/* Face Data Notice */}
          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              업로드하신 사진은 AI 시뮬레이션을 위해 일시적으로 처리되며,
              서버에 영구 저장되지 않습니다.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-6 pt-4 space-y-2">
          <button
            onClick={onAccept}
            disabled={!allChecked}
            className={`w-full h-12 rounded-xl font-medium transition-all ${
              allChecked
                ? 'bg-gray-900 text-white active:bg-gray-800'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            동의하고 시작하기
          </button>
          <button
            onClick={onDecline}
            className="w-full h-10 rounded-xl text-gray-500 text-sm active:bg-gray-50"
          >
            동의하지 않음
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
