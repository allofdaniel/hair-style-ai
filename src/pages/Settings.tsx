import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useI18n } from '../i18n/useI18n';
import { languages } from '../i18n/translations';

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const {
    history,
    myBasePhoto,
    setMyBasePhoto,
    myHairProfile,
    updateMyHairProfile,
    referralInfo,
    applyReferralCode,
  } = useAppStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showHairProfileModal, setShowHairProfileModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMyBasePhoto(result);
      setShowPhotoModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setMyBasePhoto(null);
    setShowPhotoModal(false);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('hair-style-history');
    window.location.reload();
  };

  const handleApplyReferralCode = () => {
    const code = referralCodeInput.toUpperCase().trim();
    if (!code) {
      setReferralMessage('추천 코드를 입력해주세요.');
      return;
    }
    const success = applyReferralCode(code);
    if (success) {
      setReferralMessage('추천 코드가 적용되었습니다!');
      setReferralCodeInput('');
    } else {
      setReferralMessage('유효하지 않거나 이미 사용된 코드입니다.');
    }
  };

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralInfo.myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = referralInfo.myCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const textureOptions = [
    { value: 'straight', label: '직모' },
    { value: 'wavy', label: '웨이브' },
    { value: 'curly', label: '곱슬' },
    { value: 'coily', label: '강한 곱슬' },
  ];

  const densityOptions = [
    { value: 'sparse', label: '숱이 적음' },
    { value: 'normal', label: '보통' },
    { value: 'dense', label: '숱이 많음' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('settings')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5 space-y-6">
        {/* Language */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">{t('language')}</h2>
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full bg-[#f9fafb] rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[16px] text-[#191f28] font-medium">{currentLang?.nativeName}</p>
              <p className="text-[14px] text-[#8b95a1]">{t('language_desc')}</p>
            </div>
            <span className="text-[#b0b8c1]">→</span>
          </button>
        </section>

        {/* My Photo */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">내 사진</h2>
          <button
            onClick={() => setShowPhotoModal(true)}
            className="w-full bg-[#f9fafb] rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {myBasePhoto ? (
                <img src={myBasePhoto} alt="내 사진" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#e5e8eb] flex items-center justify-center text-[#8b95a1]">
                  +
                </div>
              )}
              <div className="text-left">
                <p className="text-[16px] text-[#191f28]">{myBasePhoto ? '사진 변경' : '사진 등록'}</p>
                <p className="text-[14px] text-[#8b95a1]">커스텀 스타일용</p>
              </div>
            </div>
            <span className="text-[#b0b8c1]">→</span>
          </button>
        </section>

        {/* Hair Profile */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">내 머리 특징</h2>
          <button
            onClick={() => setShowHairProfileModal(true)}
            className="w-full bg-[#f9fafb] rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[16px] text-[#191f28]">머리 특징 설정</p>
              <p className="text-[14px] text-[#8b95a1]">
                {textureOptions.find(o => o.value === myHairProfile.texture)?.label} ·
                {densityOptions.find(o => o.value === myHairProfile.density)?.label}
              </p>
            </div>
            <span className="text-[#b0b8c1]">→</span>
          </button>
        </section>

        {/* History */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">{t('history')}</h2>
          <div className="bg-[#f9fafb] rounded-2xl overflow-hidden">
            <button
              onClick={() => navigate('/history')}
              className="w-full p-4 flex items-center justify-between"
            >
              <span className="text-[16px] text-[#191f28]">내 변환 기록</span>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[#8b95a1]">{history.length}{t('history_count')}</span>
                <span className="text-[#b0b8c1]">→</span>
              </div>
            </button>
            {history.length > 0 && (
              <>
                <div className="h-px bg-[#e5e8eb] mx-4" />
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <span className="text-[16px] text-[#f04452]">{t('delete')}</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Referral */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">친구 추천</h2>
          <button
            onClick={() => setShowReferralModal(true)}
            className="w-full bg-[#f9fafb] rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[16px] text-[#191f28]">친구 초대하기</p>
              <p className="text-[14px] text-[#8b95a1]">친구가 가입하면 서로 5토큰</p>
            </div>
            <span className="text-[#b0b8c1]">→</span>
          </button>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-[13px] text-[#8b95a1] mb-3 px-1">약관</h2>
          <div className="bg-[#f9fafb] rounded-2xl overflow-hidden">
            <button
              onClick={() => navigate('/privacy')}
              className="w-full p-4 flex items-center justify-between"
            >
              <span className="text-[16px] text-[#191f28]">{t('privacy')}</span>
              <span className="text-[#b0b8c1]">→</span>
            </button>
            <div className="h-px bg-[#e5e8eb] mx-4" />
            <button
              onClick={() => navigate('/terms')}
              className="w-full p-4 flex items-center justify-between"
            >
              <span className="text-[16px] text-[#191f28]">{t('terms')}</span>
              <span className="text-[#b0b8c1]">→</span>
            </button>
          </div>
        </section>

        {/* App Info */}
        <div className="text-center py-6">
          <p className="text-[14px] text-[#8b95a1]">{t('app_name')}</p>
          <p className="text-[12px] text-[#b0b8c1]">{t('version')} 1.0.0</p>
        </div>
      </main>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl">
            <div className="p-5 border-b border-[#f2f4f6] flex items-center justify-between">
              <span className="text-[17px] font-semibold text-[#191f28]">{t('language')}</span>
              <button onClick={() => setShowLanguageModal(false)} className="text-[15px] text-[#6b7684]">
                {t('close')}
              </button>
            </div>
            <div className="p-4 space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-4 rounded-2xl text-left flex items-center justify-between ${
                    language === lang.code ? 'bg-[#3182f6]/10' : 'bg-[#f9fafb]'
                  }`}
                >
                  <div>
                    <p className={`text-[16px] font-medium ${language === lang.code ? 'text-[#3182f6]' : 'text-[#191f28]'}`}>
                      {lang.nativeName}
                    </p>
                    <p className="text-[14px] text-[#8b95a1]">{lang.name}</p>
                  </div>
                  {language === lang.code && (
                    <span className="text-[#3182f6] text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 pb-8">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-full h-14 bg-[#f2f4f6] rounded-2xl text-[16px] font-medium text-[#191f28]"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-[18px] font-semibold text-[#191f28] mb-2">기록을 삭제하시겠습니까?</h3>
            <p className="text-[14px] text-[#8b95a1] mb-6">모든 변환 기록이 영구적으로 삭제됩니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-12 rounded-xl bg-[#f2f4f6] text-[#191f28] font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 h-12 rounded-xl bg-[#f04452] text-white font-medium"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-[18px] font-semibold text-[#191f28] mb-4">
              {myBasePhoto ? '내 사진 관리' : '내 사진 등록'}
            </h3>
            {myBasePhoto && (
              <div className="mb-4 flex justify-center">
                <img src={myBasePhoto} alt="내 사진" className="w-24 h-24 rounded-2xl object-cover" />
              </div>
            )}
            <p className="text-[14px] text-[#8b95a1] mb-6">
              {myBasePhoto ? '등록된 사진은 커스텀 스타일 생성 시 사용됩니다.' : '얼굴이 잘 보이는 정면 사진을 등록해주세요.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 rounded-xl bg-[#3182f6] text-white font-medium"
              >
                {myBasePhoto ? '다른 사진 선택' : '사진 선택'}
              </button>
              {myBasePhoto && (
                <button onClick={handleRemovePhoto} className="w-full h-12 rounded-xl bg-[#f04452]/10 text-[#f04452] font-medium">
                  사진 삭제
                </button>
              )}
              <button onClick={() => setShowPhotoModal(false)} className="w-full h-12 rounded-xl bg-[#f2f4f6] text-[#191f28] font-medium">
                {t('close')}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>
      )}

      {/* Hair Profile Modal */}
      {showHairProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-[#f2f4f6] flex items-center justify-between">
              <span className="text-[17px] font-semibold text-[#191f28]">내 머리 특징</span>
              <button onClick={() => setShowHairProfileModal(false)} className="text-[15px] text-[#6b7684]">
                {t('close')}
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <label className="text-[14px] text-[#8b95a1] mb-2 block">모질</label>
                <div className="grid grid-cols-2 gap-2">
                  {textureOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateMyHairProfile({ texture: opt.value as never })}
                      className={`h-11 rounded-xl font-medium transition-all ${
                        myHairProfile.texture === opt.value ? 'bg-[#3182f6] text-white' : 'bg-[#f2f4f6] text-[#4e5968]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] text-[#8b95a1] mb-2 block">머리숱</label>
                <div className="grid grid-cols-3 gap-2">
                  {densityOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateMyHairProfile({ density: opt.value as never })}
                      className={`h-11 rounded-xl font-medium text-sm transition-all ${
                        myHairProfile.density === opt.value ? 'bg-[#3182f6] text-white' : 'bg-[#f2f4f6] text-[#4e5968]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] text-[#8b95a1] mb-2 block">현재 길이: {myHairProfile.currentLength}cm</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={myHairProfile.currentLength}
                  onChange={(e) => updateMyHairProfile({ currentLength: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#e5e8eb] rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#3182f6]"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[#f2f4f6]">
              <button
                onClick={() => setShowHairProfileModal(false)}
                className="w-full h-14 rounded-2xl bg-[#3182f6] text-white font-semibold"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-[#f2f4f6] flex items-center justify-between">
              <span className="text-[17px] font-semibold text-[#191f28]">친구 초대</span>
              <button
                onClick={() => { setShowReferralModal(false); setReferralMessage(''); }}
                className="text-[15px] text-[#6b7684]"
              >
                {t('close')}
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="bg-[#3182f6]/10 rounded-2xl p-4">
                <p className="text-[14px] text-[#8b95a1] mb-2">내 추천 코드</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white rounded-xl px-4 py-3">
                    <span className="text-[20px] font-mono font-bold text-[#191f28] tracking-wider">
                      {referralInfo.myCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyReferralCode}
                    className={`h-12 px-5 rounded-xl font-medium transition-all ${
                      copied ? 'bg-[#00c471] text-white' : 'bg-[#3182f6] text-white'
                    }`}
                  >
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9fafb] rounded-xl p-4 text-center">
                  <p className="text-[13px] text-[#8b95a1]">초대한 친구</p>
                  <p className="text-[24px] font-bold text-[#191f28]">{referralInfo.referredCount}</p>
                </div>
                <div className="bg-[#f9fafb] rounded-xl p-4 text-center">
                  <p className="text-[13px] text-[#8b95a1]">획득 토큰</p>
                  <p className="text-[24px] font-bold text-[#3182f6]">{referralInfo.earnedTokens}</p>
                </div>
              </div>

              <div>
                <p className="text-[14px] text-[#8b95a1] mb-2">추천 코드 입력</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="HAIRXXXXXX"
                    maxLength={10}
                    className="flex-1 h-12 bg-[#f9fafb] rounded-xl px-4 text-[#191f28] placeholder-[#b0b8c1] font-mono uppercase"
                  />
                  <button onClick={handleApplyReferralCode} className="h-12 px-5 rounded-xl bg-[#3182f6] text-white font-medium">
                    적용
                  </button>
                </div>
                {referralMessage && (
                  <p className={`mt-2 text-[14px] ${referralMessage.includes('적용') ? 'text-[#00c471]' : 'text-[#f04452]'}`}>
                    {referralMessage}
                  </p>
                )}
              </div>

              <button
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: 'LookSim',
                      text: `LookSim에서 다양한 헤어스타일을 체험해보세요! 추천코드: ${referralInfo.myCode}`,
                      url: 'https://looksim.app',
                    });
                  } else {
                    handleCopyReferralCode();
                  }
                }}
                className="w-full h-14 rounded-2xl bg-[#3182f6] text-white font-semibold"
              >
                친구에게 공유하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
