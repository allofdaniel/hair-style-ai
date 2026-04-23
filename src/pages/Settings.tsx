import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useI18n, type TranslationKey } from '../i18n/useI18n';
import { languages } from '../i18n/translations';
import { getHistoryCount, clearAllHistory } from '../services/storage';

// Arrow Icon Component
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 opacity-40">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Settings Row Component
const SettingsRow = ({
  label,
  value,
  badge,
  onClick,
  danger = false
}: {
  label: string;
  value?: string;
  badge?: string;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-2.5 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
  >
    <span className={`text-[15px] font-medium ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
      {label}
    </span>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="text-[13px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
          {badge}
        </span>
      )}
      {value && (
        <span className="text-[15px] text-gray-500 dark:text-gray-400">{value}</span>
      )}
      {!danger && <ArrowIcon />}
    </div>
  </button>
);

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const {
    myBasePhoto,
    setMyBasePhoto,
    myHairProfile,
    updateMyHairProfile,
    referralInfo,
    applyReferralCode,
  } = useAppStore();

  const [historyCount, setHistoryCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showHairProfileModal, setShowHairProfileModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistoryCount = useCallback(async () => {
    try {
      const count = await getHistoryCount();
      setHistoryCount(count);
    } catch {
      setHistoryCount(0);
    }
  }, []);

  useEffect(() => {
    loadHistoryCount();
  }, [loadHistoryCount]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMyBasePhoto(event.target?.result as string);
      setShowPhotoModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setMyBasePhoto(null);
    setShowPhotoModal(false);
  };

  const handleClearHistory = async () => {
    try {
      await clearAllHistory();
      setHistoryCount(0);
      setShowClearConfirm(false);
    } catch {
      console.error('Failed to clear history');
    }
  };

  const handleApplyReferralCode = () => {
    const code = referralCodeInput.toUpperCase().trim();
    if (!code) {
      setReferralMessage(t('enter_referral_code'));
      return;
    }
    const success = applyReferralCode(code);
    setReferralMessage(success ? t('referral_applied') : t('referral_invalid'));
    if (success) setReferralCodeInput('');
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
    { value: 'straight', labelKey: 'texture_straight' },
    { value: 'wavy', labelKey: 'texture_wavy' },
    { value: 'curly', labelKey: 'texture_curly' },
    { value: 'coily', labelKey: 'texture_coily' },
  ];

  const densityOptions = [
    { value: 'sparse', labelKey: 'density_sparse' },
    { value: 'normal', labelKey: 'density_normal' },
    { value: 'dense', labelKey: 'density_dense' },
  ];

  const currentLang = languages.find(l => l.code === language);
  const textureKey = `texture_${myHairProfile.texture}` as TranslationKey;
  const densityKey = `density_${myHairProfile.density}` as TranslationKey;
  const hairProfileText = `${t(textureKey)} · ${t(densityKey)}`;

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans">
      {/* Header - iOS Style */}
      <header className="sticky top-0 z-20 flex justify-between items-center px-4 py-3 bg-[#F2F2F7]/90 dark:bg-black/90 backdrop-blur-md border-b border-transparent">
        <h1 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-[16px] font-normal text-blue-500 hover:opacity-70 transition-opacity"
        >
          {t('close')}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
        {/* 앱 설정 Section */}
        <div className="mb-5">
          <h2 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-3 uppercase tracking-wide font-normal">
            {t('app_settings') || '앱 설정'}
          </h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
            <SettingsRow
              label={t('language')}
              value={currentLang?.nativeName}
              onClick={() => setShowLanguageModal(true)}
            />
            <SettingsRow
              label={t('my_hair_features')}
              value={hairProfileText}
              onClick={() => setShowHairProfileModal(true)}
            />
          </div>
        </div>

        {/* 사용자 콘텐츠 Section */}
        <div className="mb-5">
          <h2 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-3 uppercase tracking-wide font-normal">
            {t('user_content') || '사용자 콘텐츠'}
          </h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
            <SettingsRow
              label={t('register_photo')}
              onClick={() => setShowPhotoModal(true)}
            />
            <SettingsRow
              label={t('my_conversion_history')}
              value={`${historyCount}${t('history_count')}`}
              onClick={() => navigate('/history')}
            />
            {historyCount > 0 && (
              <SettingsRow
                label={t('delete_history') || '기록 삭제'}
                onClick={() => setShowClearConfirm(true)}
                danger
              />
            )}
          </div>
        </div>

        {/* 지원 Section */}
        <div className="mb-6">
          <h2 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-3 uppercase tracking-wide font-normal">
            {t('support') || '지원'}
          </h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
            <SettingsRow
              label={t('invite_friends')}
              badge={t('token_reward') || '5토큰 보상'}
              onClick={() => setShowReferralModal(true)}
            />
            <SettingsRow
              label={t('privacy')}
              onClick={() => navigate('/privacy')}
            />
            <SettingsRow
              label={t('terms')}
              onClick={() => navigate('/terms')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase opacity-70">
            BeforeCut
          </p>
          <p className="text-[10px] text-gray-400/60 dark:text-gray-500/60 mt-0.5">
            Version 1.0.0
          </p>
        </div>
      </main>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowLanguageModal(false)}>
          <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('language')}</span>
              <button onClick={() => setShowLanguageModal(false)} className="text-blue-500 font-medium">
                {t('close')}
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLanguageModal(false); }}
                  className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-colors ${
                    language === lang.code
                      ? 'bg-blue-500/10 dark:bg-blue-500/20'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div>
                    <p className={`text-[16px] font-medium ${language === lang.code ? 'text-blue-500' : 'text-gray-900 dark:text-white'}`}>
                      {lang.nativeName}
                    </p>
                    <p className="text-[14px] text-gray-500 dark:text-gray-400">{lang.name}</p>
                  </div>
                  {language === lang.code && <span className="text-blue-500 text-lg">✓</span>}
                </button>
              ))}
            </div>
            <div className="p-4 pb-8 safe-area-bottom">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[16px] font-medium text-gray-900 dark:text-white"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">{t('delete_history_confirm')}</h3>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">{t('delete_history_warning')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-medium"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowPhotoModal(false)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-4">
              {myBasePhoto ? t('manage_photo') : t('register_photo_title')}
            </h3>
            {myBasePhoto && (
              <div className="mb-4 flex justify-center">
                <img src={myBasePhoto} alt={t('my_photo')} className="w-24 h-24 rounded-2xl object-cover" />
              </div>
            )}
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">
              {myBasePhoto ? t('photo_registered_desc') : t('photo_register_desc')}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 rounded-xl bg-blue-500 text-white font-medium"
              >
                {myBasePhoto ? t('select_another_photo') : t('register_photo')}
              </button>
              {myBasePhoto && (
                <button onClick={handleRemovePhoto} className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 font-medium">
                  {t('delete_photo')}
                </button>
              )}
              <button onClick={() => setShowPhotoModal(false)} className="w-full h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium">
                {t('close')}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>
      )}

      {/* Hair Profile Modal */}
      {showHairProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowHairProfileModal(false)}>
          <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-t-3xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('my_hair_features')}</span>
              <button onClick={() => setShowHairProfileModal(false)} className="text-blue-500 font-medium">
                {t('close')}
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <label className="text-[14px] text-gray-500 dark:text-gray-400 mb-2 block">{t('hair_texture')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {textureOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateMyHairProfile({ texture: opt.value as never })}
                      className={`h-11 rounded-xl font-medium transition-all ${
                        myHairProfile.texture === opt.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t(opt.labelKey as TranslationKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] text-gray-500 dark:text-gray-400 mb-2 block">{t('hair_density')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {densityOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateMyHairProfile({ density: opt.value as never })}
                      className={`h-11 rounded-xl font-medium text-sm transition-all ${
                        myHairProfile.density === opt.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t(opt.labelKey as TranslationKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] text-gray-500 dark:text-gray-400 mb-2 block">
                  {t('current_length')}: {myHairProfile.currentLength}cm
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={myHairProfile.currentLength}
                  onChange={(e) => updateMyHairProfile({ currentLength: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-blue-500"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
              <button
                onClick={() => setShowHairProfileModal(false)}
                className="w-full h-14 rounded-2xl bg-blue-500 text-white font-semibold"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => { setShowReferralModal(false); setReferralMessage(''); }}>
          <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-t-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('invite_friends')}</span>
              <button onClick={() => { setShowReferralModal(false); setReferralMessage(''); }} className="text-blue-500 font-medium">
                {t('close')}
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl p-4">
                <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-2">{t('my_referral_code')}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-[20px] font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                      {referralInfo.myCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyReferralCode}
                    className={`h-12 px-5 rounded-xl font-medium transition-all ${
                      copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}
                  >
                    {copied ? t('copied') : t('copy')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{t('invited_friends')}</p>
                  <p className="text-[24px] font-bold text-gray-900 dark:text-white">{referralInfo.referredCount}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{t('earned_tokens')}</p>
                  <p className="text-[24px] font-bold text-blue-500">{referralInfo.earnedTokens}</p>
                </div>
              </div>

              <div>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-2">{t('referral_code_input')}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="HAIRXXXXXX"
                    maxLength={10}
                    className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-gray-900 dark:text-white placeholder-gray-400 font-mono uppercase"
                  />
                  <button onClick={handleApplyReferralCode} className="h-12 px-5 rounded-xl bg-blue-500 text-white font-medium">
                    {t('apply')}
                  </button>
                </div>
                {referralMessage && (
                  <p className={`mt-2 text-[14px] ${referralMessage === t('referral_applied') ? 'text-green-500' : 'text-red-500'}`}>
                    {referralMessage}
                  </p>
                )}
              </div>

              <button
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: 'BeforeCut',
                      text: `${t('share_invite_text')} ${referralInfo.myCode}`,
                      url: 'https://beforecut.app',
                    });
                  } else {
                    handleCopyReferralCode();
                  }
                }}
                className="w-full h-14 rounded-2xl bg-blue-500 text-white font-semibold"
              >
                {t('share_with_friends')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
