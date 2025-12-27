import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  simulateSkinTreatment,
  getTreatmentCategories,
  getTreatmentsByCategory,
  getTreatmentInfo,
  type SkinTreatmentType,
} from '../services/skinTreatmentSimulation';
import { useI18n } from '../i18n/useI18n';

export default function SkinTreatmentSimulation() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('texture');
  const [selectedTreatment, setSelectedTreatment] = useState<SkinTreatmentType | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = getTreatmentCategories();

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
    if (!userPhoto || !selectedTreatment) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await simulateSkinTreatment({
        userPhoto,
        treatmentType: selectedTreatment,
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
    link.download = `skin-treatment-${selectedTreatment}-${Date.now()}.png`;
    link.click();
  };

  const treatmentOptions = getTreatmentsByCategory(selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('skin_treatment_simulation')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5">
        {/* Photo Selection */}
        {!userPhoto ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-[#191f28] font-medium mb-2">{t('select_photo')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6 text-center">{t('skin_treatment_desc')}</p>
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
                    : selectedTreatment
                    ? (language === 'ko' ? getTreatmentInfo(selectedTreatment).nameKo : getTreatmentInfo(selectedTreatment).name)
                    : t('select_treatment')}
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
                      <p className="text-[14px] text-[#b0b8c1]">{t('select_treatment_preview')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedTreatment(null);
                      setResultImage(null);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#191f28] text-white'
                        : 'bg-[#f2f4f6] text-[#6b7684]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{language === 'ko' ? cat.name : cat.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Treatment Options */}
            <div className="mb-6">
              <div className="space-y-2">
                {treatmentOptions.map((treatmentType) => {
                  const info = getTreatmentInfo(treatmentType);

                  return (
                    <button
                      key={treatmentType}
                      onClick={() => {
                        setSelectedTreatment(treatmentType);
                        setResultImage(null);
                      }}
                      disabled={isProcessing}
                      className={`w-full p-4 rounded-xl transition-all text-left ${
                        selectedTreatment === treatmentType
                          ? 'bg-[#e8f3ff] border-2 border-[#3182f6]'
                          : 'bg-[#f2f4f6] border-2 border-transparent'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      <p className={`text-[14px] font-medium mb-1 ${
                        selectedTreatment === treatmentType ? 'text-[#3182f6]' : 'text-[#191f28]'
                      }`}>
                        {language === 'ko' ? info.nameKo : info.name}
                      </p>
                      <p className={`text-[12px] ${
                        selectedTreatment === treatmentType ? 'text-[#3182f6]/70' : 'text-[#8b95a1]'
                      }`}>
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#f9fafb] rounded-xl p-4 mb-4">
              <p className="text-[12px] text-[#8b95a1] leading-relaxed">
                {t('skin_treatment_disclaimer')}
              </p>
            </div>

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
                      setSelectedTreatment(null);
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
                    disabled={!selectedTreatment || isProcessing}
                    className={`w-full py-4 text-[16px] font-semibold rounded-xl transition-all ${
                      !selectedTreatment || isProcessing
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
                      setSelectedTreatment(null);
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
