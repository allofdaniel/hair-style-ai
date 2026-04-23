import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type CustomHairSettings } from '../stores/useAppStore';
import { useI18n } from '../i18n/useI18n';
import Toast from '../components/Toast';

export default function CustomStyle() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    myBasePhoto,
    setMyBasePhoto,
    customSettings,
    updateCustomSettings,
    setUserPhoto,
    setUseCustomMode,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<'length' | 'thinning' | 'perm' | 'undercut'>('length');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 파일 업로드 검증 및 핸들러
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const MAX_DIMENSION = 4096;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif)$/)) {
      setToastMessage(t('unsupported_file_format') || '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)');
      setShowToast(true);
      e.target.value = ''; // Reset input
      return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setToastMessage(t('file_too_large') || '파일 크기는 10MB 이하여야 합니다.');
      setShowToast(true);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      // 이미지 크기 검증
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          setToastMessage(t('image_too_large') || '이미지 해상도가 너무 큽니다. (최대 4096px)');
          setShowToast(true);
          return;
        }
        setMyBasePhoto(result);
      };
      img.onerror = () => {
        setToastMessage(t('invalid_image') || '유효하지 않은 이미지 파일입니다.');
        setShowToast(true);
      };
      img.src = result;
    };
    reader.onerror = () => {
      console.error('FileReader error in handlePhotoUpload');
      setToastMessage(t('photo_load_failed') || '사진을 불러오는데 실패했습니다.');
      setShowToast(true);
    };
    reader.readAsDataURL(file);
  };

  // 길이 설정 슬라이더
  const LengthSlider = ({
    label,
    value,
    onChange,
    min = 0,
    max = 20,
    unit = 'cm',
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    unit?: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/80 text-sm">{label}</span>
        <span className="text-purple-400 font-semibold">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-gradient-to-r
          [&::-webkit-slider-thumb]:from-purple-500
          [&::-webkit-slider-thumb]:to-pink-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-lg"
      />
      <div className="flex justify-between text-xs text-white/40 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  // 토글 버튼
  const ToggleButton = ({
    label,
    active,
    onChange,
  }: {
    label: string;
    active: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!active)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
          : 'bg-white/5 border border-white/10 text-white/50'
      }`}
    >
      {label}
    </button>
  );

  // 커스텀 스타일 적용하기
  const handleApplyCustom = () => {
    if (!myBasePhoto) {
      setToastMessage(t('please_register_photo'));
      setShowToast(true);
      return;
    }

    setUserPhoto(myBasePhoto);
    setUseCustomMode(true);
    navigate('/processing-custom');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">커스텀 스타일</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* 내 사진 등록 */}
        <section className="mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">1</span>
            내 사진 등록
          </h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all ${
              myBasePhoto
                ? 'ring-2 ring-purple-500'
                : 'bg-white/5 border-2 border-dashed border-white/20 hover:border-purple-500/50'
            }`}
          >
            {myBasePhoto ? (
              <>
                <img src={myBasePhoto} alt="My photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">다른 사진으로 변경</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span className="mt-2 text-sm">사진 등록하기</span>
                <span className="mt-1 text-xs text-white/30">머리 전체가 보이는 사진</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </section>

        {/* 섹션 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: 'length', label: '길이', icon: '📏' },
            { id: 'thinning', label: '숱치기', icon: '✂️' },
            { id: 'perm', label: '펌', icon: '🌀' },
            { id: 'undercut', label: '투블럭/페이드', icon: '💈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 길이 설정 */}
        {activeSection === 'length' && (
          <section className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">머리 길이 조절</h3>
            <LengthSlider
              label="앞머리"
              value={customSettings.frontLength}
              onChange={(val) => updateCustomSettings({ frontLength: val })}
              max={15}
            />
            <LengthSlider
              label="옆머리"
              value={customSettings.sideLength}
              onChange={(val) => updateCustomSettings({ sideLength: val })}
              max={15}
            />
            <LengthSlider
              label="윗머리"
              value={customSettings.topLength}
              onChange={(val) => updateCustomSettings({ topLength: val })}
              max={25}
            />
            <LengthSlider
              label="뒷머리"
              value={customSettings.backLength}
              onChange={(val) => updateCustomSettings({ backLength: val })}
              max={20}
            />
          </section>
        )}

        {/* 숱치기 설정 */}
        {activeSection === 'thinning' && (
          <section className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">숱치기</h3>

            <div className="mb-4">
              <p className="text-white/60 text-sm mb-3">숱칠 부위 선택</p>
              <div className="flex flex-wrap gap-2">
                <ToggleButton
                  label="윗머리"
                  active={customSettings.thinning.top}
                  onChange={(val) =>
                    updateCustomSettings({
                      thinning: { ...customSettings.thinning, top: val },
                    })
                  }
                />
                <ToggleButton
                  label="옆머리"
                  active={customSettings.thinning.sides}
                  onChange={(val) =>
                    updateCustomSettings({
                      thinning: { ...customSettings.thinning, sides: val },
                    })
                  }
                />
                <ToggleButton
                  label="뒷머리"
                  active={customSettings.thinning.back}
                  onChange={(val) =>
                    updateCustomSettings({
                      thinning: { ...customSettings.thinning, back: val },
                    })
                  }
                />
              </div>
            </div>

            {(customSettings.thinning.top || customSettings.thinning.sides || customSettings.thinning.back) && (
              <div>
                <p className="text-white/60 text-sm mb-3">숱치기 정도</p>
                <div className="flex gap-2">
                  {(['light', 'medium', 'heavy'] as const).map((amount) => (
                    <button
                      key={amount}
                      onClick={() =>
                        updateCustomSettings({
                          thinning: { ...customSettings.thinning, amount },
                        })
                      }
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        customSettings.thinning.amount === amount
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/5 border border-white/10 text-white/50'
                      }`}
                    >
                      {amount === 'light' && '살짝'}
                      {amount === 'medium' && '보통'}
                      {amount === 'heavy' && '많이'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 펌 설정 */}
        {activeSection === 'perm' && (
          <section className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">펌 스타일</h3>

            <div className="mb-4">
              <p className="text-white/60 text-sm mb-3">펌 종류</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: '없음' },
                  { id: 'down', label: '다운펌' },
                  { id: 'volume', label: '볼륨펌' },
                  { id: 'wave', label: '웨이브펌' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() =>
                      updateCustomSettings({
                        perm: { ...customSettings.perm, type: type.id as CustomHairSettings['perm']['type'] },
                      })
                    }
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      customSettings.perm.type === type.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 border border-white/10 text-white/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {customSettings.perm.type !== 'none' && (
              <div>
                <p className="text-white/60 text-sm mb-3">펌 부위 선택</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleButton
                    label="옆뒤 다운펌"
                    active={customSettings.perm.areas.sideBack}
                    onChange={(val) =>
                      updateCustomSettings({
                        perm: {
                          ...customSettings.perm,
                          areas: { ...customSettings.perm.areas, sideBack: val },
                        },
                      })
                    }
                  />
                  <ToggleButton
                    label="옆만 다운펌"
                    active={customSettings.perm.areas.sideOnly}
                    onChange={(val) =>
                      updateCustomSettings({
                        perm: {
                          ...customSettings.perm,
                          areas: { ...customSettings.perm.areas, sideOnly: val },
                        },
                      })
                    }
                  />
                  <ToggleButton
                    label="윗머리"
                    active={customSettings.perm.areas.top}
                    onChange={(val) =>
                      updateCustomSettings({
                        perm: {
                          ...customSettings.perm,
                          areas: { ...customSettings.perm.areas, top: val },
                        },
                      })
                    }
                  />
                  <ToggleButton
                    label="앞머리"
                    active={customSettings.perm.areas.bangs}
                    onChange={(val) =>
                      updateCustomSettings({
                        perm: {
                          ...customSettings.perm,
                          areas: { ...customSettings.perm.areas, bangs: val },
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* 투블럭/페이드 설정 */}
        {activeSection === 'undercut' && (
          <section className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">투블럭 / 페이드</h3>

            <div className="mb-4">
              <ToggleButton
                label={customSettings.undercut.enabled ? '투블럭 ON' : '투블럭 OFF'}
                active={customSettings.undercut.enabled}
                onChange={(val) =>
                  updateCustomSettings({
                    undercut: { ...customSettings.undercut, enabled: val },
                  })
                }
              />
            </div>

            {customSettings.undercut.enabled && (
              <>
                <LengthSlider
                  label="밀어올리는 높이"
                  value={customSettings.undercut.height}
                  onChange={(val) =>
                    updateCustomSettings({
                      undercut: { ...customSettings.undercut, height: val },
                    })
                  }
                  min={0}
                  max={50}
                  unit="mm"
                />

                <div className="mt-4">
                  <p className="text-white/60 text-sm mb-3">페이드 종류</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: '없음' },
                      { id: 'low', label: '로우' },
                      { id: 'mid', label: '미드' },
                      { id: 'high', label: '하이' },
                      { id: 'skin', label: '스킨' },
                    ].map((fade) => (
                      <button
                        key={fade.id}
                        onClick={() =>
                          updateCustomSettings({
                            undercut: {
                              ...customSettings.undercut,
                              fadeType: fade.id as CustomHairSettings['undercut']['fadeType'],
                            },
                          })
                        }
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                          customSettings.undercut.fadeType === fade.id
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white/5 border border-white/10 text-white/50'
                        }`}
                      >
                        {fade.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* 기타 옵션 */}
        <section className="bg-white/5 rounded-2xl p-4 border border-white/10 mt-4">
          <h3 className="text-white font-semibold mb-3">기타 옵션</h3>
          <div className="flex gap-2">
            <ToggleButton
              label="레이어드"
              active={customSettings.layering}
              onChange={(val) => updateCustomSettings({ layering: val })}
            />
            <ToggleButton
              label="텍스쳐링"
              active={customSettings.texturizing}
              onChange={(val) => updateCustomSettings({ texturizing: val })}
            />
          </div>
        </section>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent safe-area-bottom">
        <button
          onClick={handleApplyCustom}
          disabled={!myBasePhoto}
          className={`w-full py-4 rounded-2xl font-semibold shadow-lg transition-all ${
            myBasePhoto
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {myBasePhoto ? '이 설정으로 스타일 생성' : '먼저 사진을 등록해주세요'}
        </button>
      </div>

      {/* Toast */}
      <Toast
        message={toastMessage}
        type="error"
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
