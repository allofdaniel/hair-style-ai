import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulateWeightChange, type WeightChange, type WegovyDuration } from '../services/weightSimulation';
import { useI18n } from '../i18n/useI18n';

const weightOptions: WeightChange[] = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

const wegovyDurations: { id: WegovyDuration; weightLoss: string }[] = [
  { id: '1month', weightLoss: '2-4kg' },
  { id: '3months', weightLoss: '5-8kg' },
  { id: '6months', weightLoss: '8-12kg' },
  { id: '12months', weightLoss: '12-18kg' },
];

type SimulationMode = 'manual' | 'wegovy';

export default function WeightSimulation() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<SimulationMode>('manual');
  const [selectedWeight, setSelectedWeight] = useState<WeightChange>(0);
  const [selectedWegovyDuration, setSelectedWegovyDuration] = useState<WegovyDuration>('3months');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!userPhoto) return;
    if (mode === 'manual' && selectedWeight === 0) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await simulateWeightChange({
        userPhoto,
        weightChange: mode === 'wegovy' ? -10 : selectedWeight, // Wegovy uses duration instead
        mode,
        wegovyDuration: mode === 'wegovy' ? selectedWegovyDuration : undefined,
      });

      if (result.success && result.resultImage) {
        setResultImage(result.resultImage);
      } else {
        setError(result.error || t('generation_failed'));
      }
    } catch {
      setError(t('generation_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    const filename = mode === 'wegovy'
      ? `wegovy-simulation-${selectedWegovyDuration}.png`
      : `weight-simulation-${selectedWeight > 0 ? '+' : ''}${selectedWeight}kg.png`;
    link.download = filename;
    link.click();
  };

  const getWeightLabel = (kg: WeightChange) => {
    if (kg === 0) return t('current');
    return `${kg > 0 ? '+' : ''}${kg}kg`;
  };

  const getWegovyDurationLabel = (duration: WegovyDuration) => {
    const labels: Record<WegovyDuration, string> = {
      '1month': t('wegovy_1month'),
      '3months': t('wegovy_3months'),
      '6months': t('wegovy_6months'),
      '12months': t('wegovy_12months'),
    };
    return labels[duration];
  };

  const canGenerate = mode === 'wegovy' || (mode === 'manual' && selectedWeight !== 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('weight_simulation')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5">
        {/* Photo Selection */}
        {!userPhoto ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-[#191f28] font-medium mb-2">{t('select_photo')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6 text-center">{t('weight_simulation_desc')}</p>
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
              {/* Original */}
              <div>
                <p className="text-[13px] text-[#8b95a1] mb-2 text-center">{t('before')}</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f2f4f6]">
                  <img src={userPhoto} alt="Original" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Result */}
              <div>
                <p className="text-[13px] text-[#8b95a1] mb-2 text-center">
                  {resultImage
                    ? t('after')
                    : mode === 'wegovy'
                    ? getWegovyDurationLabel(selectedWegovyDuration)
                    : getWeightLabel(selectedWeight)}
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
                      <p className="text-[14px] text-[#b0b8c1]">
                        {mode === 'wegovy' ? t('wegovy_preview') : t('select_weight')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex bg-[#f2f4f6] rounded-xl p-1 mb-6">
              <button
                onClick={() => {
                  setMode('manual');
                  setResultImage(null);
                }}
                className={`flex-1 py-3 rounded-lg text-[14px] font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-white text-[#191f28] shadow-sm'
                    : 'text-[#8b95a1]'
                }`}
              >
                {t('manual_mode')}
              </button>
              <button
                onClick={() => {
                  setMode('wegovy');
                  setResultImage(null);
                }}
                className={`flex-1 py-3 rounded-lg text-[14px] font-medium transition-all ${
                  mode === 'wegovy'
                    ? 'bg-white text-[#191f28] shadow-sm'
                    : 'text-[#8b95a1]'
                }`}
              >
                💉 {t('wegovy_mode')}
              </button>
            </div>

            {mode === 'manual' ? (
              /* Manual Mode - Weight Slider */
              <div className="mb-6">
                <p className="text-[14px] text-[#191f28] font-medium mb-3">{t('weight_change')}</p>

                {/* Weight Options */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {weightOptions.map((kg) => (
                    <button
                      key={kg}
                      onClick={() => {
                        setSelectedWeight(kg);
                        setResultImage(null);
                      }}
                      disabled={isProcessing}
                      className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                        selectedWeight === kg
                          ? kg < 0
                            ? 'bg-[#e8f3ff] text-[#3182f6] border-2 border-[#3182f6]'
                            : kg > 0
                            ? 'bg-[#fff3f0] text-[#f04452] border-2 border-[#f04452]'
                            : 'bg-[#f2f4f6] text-[#191f28] border-2 border-[#191f28]'
                          : 'bg-[#f2f4f6] text-[#6b7684] border-2 border-transparent'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      {getWeightLabel(kg)}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <p className="text-[13px] text-[#8b95a1] text-center mt-3">
                  {selectedWeight < 0
                    ? t('weight_loss_desc')
                    : selectedWeight > 0
                    ? t('weight_gain_desc')
                    : t('weight_current_desc')}
                </p>
              </div>
            ) : (
              /* Wegovy Mode */
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[14px] text-[#191f28] font-medium">{t('wegovy_duration')}</p>
                  <span className="px-2 py-0.5 bg-[#00c471]/10 text-[#00c471] text-[11px] font-medium rounded-full">
                    GLP-1
                  </span>
                </div>

                {/* Wegovy Duration Options */}
                <div className="space-y-2">
                  {wegovyDurations.map((duration) => (
                    <button
                      key={duration.id}
                      onClick={() => {
                        setSelectedWegovyDuration(duration.id);
                        setResultImage(null);
                      }}
                      disabled={isProcessing}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedWegovyDuration === duration.id
                          ? 'bg-[#e8f3ff] border-2 border-[#3182f6]'
                          : 'bg-[#f2f4f6] border-2 border-transparent'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      <span className={`text-[14px] font-medium ${
                        selectedWegovyDuration === duration.id ? 'text-[#3182f6]' : 'text-[#191f28]'
                      }`}>
                        {getWegovyDurationLabel(duration.id)}
                      </span>
                      <span className={`text-[13px] ${
                        selectedWegovyDuration === duration.id ? 'text-[#3182f6]' : 'text-[#8b95a1]'
                      }`}>
                        -{duration.weightLoss}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Wegovy Info */}
                <div className="bg-[#f9fafb] rounded-xl p-4 mt-4">
                  <p className="text-[13px] text-[#6b7684] leading-relaxed">
                    {t('wegovy_info')}
                  </p>
                </div>
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
                      if (mode === 'manual') setSelectedWeight(0);
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
                    disabled={!canGenerate || isProcessing}
                    className={`w-full py-4 text-[16px] font-semibold rounded-xl transition-all ${
                      !canGenerate || isProcessing
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
                      setSelectedWeight(0);
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
