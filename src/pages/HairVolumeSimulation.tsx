import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  simulateHairVolume,
  getVolumeOptions,
  getVolumeInfo,
  type HairVolumeType,
} from '../services/hairVolumeSimulation';
import { useI18n } from '../i18n/useI18n';

export default function HairVolumeSimulation() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<HairVolumeType | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const volumeOptions = getVolumeOptions();

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!userPhoto || !selectedVolume) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await simulateHairVolume({
        userPhoto,
        volumeType: selectedVolume,
      });

      if (result.success && result.resultImage) {
        setResultImage(result.resultImage);
      } else {
        setError(result.error || t('generation_failed'));
      }
    } catch (err) {
      setError(t('generation_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `hair-volume-${selectedVolume}-${Date.now()}.png`;
    link.click();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      volume: { ko: '볼륨', en: 'Volume' },
      thickness: { ko: '굵기', en: 'Thickness' },
      hairline: { ko: '헤어라인', en: 'Hairline' },
      preview: { ko: '예측', en: 'Preview' },
    };
    return language === 'ko' ? labels[category]?.ko : labels[category]?.en;
  };

  // Group options by category
  const groupedOptions = volumeOptions.reduce((acc, opt) => {
    const category = opt.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(opt);
    return acc;
  }, {} as Record<string, typeof volumeOptions>);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('hair_volume_simulation')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5">
        {/* Photo Selection */}
        {!userPhoto ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-[#191f28] font-medium mb-2">{t('select_photo')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6 text-center">{t('hair_volume_desc')}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-[#3182f6] text-white text-[15px] font-medium rounded-xl"
            >
              {t('add_photo')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
        ) : (
          <>
            {/* Image Comparison */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-[13px] text-[#8b95a1] mb-2 text-center">{t('before')}</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f2f4f6]">
                  <img src={userPhoto} alt="Original" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <p className="text-[13px] text-[#8b95a1] mb-2 text-center">
                  {resultImage
                    ? t('after')
                    : selectedVolume
                    ? (language === 'ko' ? getVolumeInfo(selectedVolume).nameKo : getVolumeInfo(selectedVolume).name)
                    : t('select_volume')}
                </p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f2f4f6] relative">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-3 border-[#e5e8eb] border-t-[#3182f6] rounded-full animate-spin mb-3" />
                      <p className="text-[14px] text-[#8b95a1]">{t('generating')}</p>
                    </div>
                  ) : resultImage ? (
                    <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[14px] text-[#b0b8c1]">{t('select_volume_preview')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Volume Options by Category */}
            <div className="mb-6 space-y-6">
              {Object.entries(groupedOptions).map(([category, options]) => (
                <div key={category}>
                  <p className="text-[14px] text-[#191f28] font-medium mb-3">
                    {getCategoryLabel(category)}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {options.map((opt) => {
                      const info = getVolumeInfo(opt.id as HairVolumeType);
                      const isWarning = opt.id === 'thinning-simulation';

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSelectedVolume(opt.id as HairVolumeType);
                            setResultImage(null);
                          }}
                          disabled={isProcessing}
                          className={`p-4 rounded-xl transition-all text-left ${
                            selectedVolume === opt.id
                              ? isWarning
                                ? 'bg-[#fff3f0] border-2 border-[#f04452]'
                                : 'bg-[#e8f3ff] border-2 border-[#3182f6]'
                              : 'bg-[#f2f4f6] border-2 border-transparent'
                          } ${isProcessing ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[18px]">{opt.icon}</span>
                            <span className={`text-[14px] font-medium ${
                              selectedVolume === opt.id
                                ? isWarning ? 'text-[#f04452]' : 'text-[#3182f6]'
                                : 'text-[#191f28]'
                            }`}>
                              {language === 'ko' ? info.nameKo : info.name}
                            </span>
                          </div>
                          <p className={`text-[12px] ${
                            selectedVolume === opt.id
                              ? isWarning ? 'text-[#f04452]/70' : 'text-[#3182f6]/70'
                              : 'text-[#8b95a1]'
                          }`}>
                            {info.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Warning for thinning simulation */}
            {selectedVolume === 'thinning-simulation' && (
              <div className="bg-[#fff8e6] border border-[#ffb800] rounded-xl p-4 mb-4">
                <p className="text-[13px] text-[#8b6914]">
                  {t('thinning_warning')}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#fff3f0] border border-[#f04452] rounded-xl p-4 mb-4">
                <p className="text-[14px] text-[#f04452]">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {resultImage ? (
                <>
                  <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-[#3182f6] text-white text-[16px] font-semibold rounded-xl"
                  >
                    {t('download')}
                  </button>
                  <button
                    onClick={() => {
                      setResultImage(null);
                      setSelectedVolume(null);
                    }}
                    className="w-full py-4 bg-[#f2f4f6] text-[#191f28] text-[16px] font-medium rounded-xl"
                  >
                    {t('try_again')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedVolume || isProcessing}
                    className={`w-full py-4 text-[16px] font-semibold rounded-xl transition-all ${
                      !selectedVolume || isProcessing
                        ? 'bg-[#e5e8eb] text-[#b0b8c1]'
                        : 'bg-[#3182f6] text-white'
                    }`}
                  >
                    {isProcessing ? t('generating') : t('generate')}
                  </button>
                  <button
                    onClick={() => {
                      setUserPhoto(null);
                      setResultImage(null);
                      setSelectedVolume(null);
                    }}
                    className="w-full py-4 bg-[#f2f4f6] text-[#6b7684] text-[16px] font-medium rounded-xl"
                  >
                    {t('change_photo')}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
