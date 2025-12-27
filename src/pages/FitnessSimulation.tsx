import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulateFitness, type FitnessLevel, type FitnessDuration } from '../services/fitnessSimulation';
import { useI18n } from '../i18n/useI18n';

const fitnessLevels: { id: FitnessLevel; icon: string }[] = [
  { id: 'light', icon: '🚶' },
  { id: 'moderate', icon: '🏃' },
  { id: 'athletic', icon: '💪' },
  { id: 'bodybuilder', icon: '🏋️' },
];

const durations: { id: FitnessDuration; months: number }[] = [
  { id: '3months', months: 3 },
  { id: '6months', months: 6 },
  { id: '1year', months: 12 },
  { id: '2years', months: 24 },
];

export default function FitnessSimulation() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel>('moderate');
  const [selectedDuration, setSelectedDuration] = useState<FitnessDuration>('6months');
  const [gender, setGender] = useState<'male' | 'female'>('male');
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

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await simulateFitness({
        userPhoto,
        fitnessLevel: selectedLevel,
        duration: selectedDuration,
        gender,
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
    link.download = `fitness-simulation-${selectedLevel}-${selectedDuration}.png`;
    link.click();
  };

  const getLevelLabel = (level: FitnessLevel) => {
    const labels: Record<FitnessLevel, string> = {
      light: t('fitness_light'),
      moderate: t('fitness_moderate'),
      athletic: t('fitness_athletic'),
      bodybuilder: t('fitness_bodybuilder'),
    };
    return labels[level];
  };

  const getDurationLabel = (duration: FitnessDuration) => {
    const labels: Record<FitnessDuration, string> = {
      '3months': t('duration_3months'),
      '6months': t('duration_6months'),
      '1year': t('duration_1year'),
      '2years': t('duration_2years'),
    };
    return labels[duration];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('fitness_simulation')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5">
        {/* Photo Selection */}
        {!userPhoto ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-[#191f28] font-medium mb-2">{t('select_photo')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6 text-center">{t('fitness_simulation_desc')}</p>
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
                  {resultImage ? t('after') : getDurationLabel(selectedDuration)}
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
                      <p className="text-[14px] text-[#b0b8c1]">{t('fitness_preview')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="mb-5">
              <p className="text-[14px] text-[#191f28] font-medium mb-3">{t('gender')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                    gender === 'male'
                      ? 'bg-[#3182f6] text-white'
                      : 'bg-[#f2f4f6] text-[#6b7684]'
                  } ${isProcessing ? 'opacity-50' : ''}`}
                >
                  {t('male')}
                </button>
                <button
                  onClick={() => setGender('female')}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                    gender === 'female'
                      ? 'bg-[#3182f6] text-white'
                      : 'bg-[#f2f4f6] text-[#6b7684]'
                  } ${isProcessing ? 'opacity-50' : ''}`}
                >
                  {t('female')}
                </button>
              </div>
            </div>

            {/* Fitness Level Selection */}
            <div className="mb-5">
              <p className="text-[14px] text-[#191f28] font-medium mb-3">{t('fitness_level')}</p>
              <div className="grid grid-cols-4 gap-2">
                {fitnessLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      setResultImage(null);
                    }}
                    disabled={isProcessing}
                    className={`py-3 rounded-xl text-center transition-all ${
                      selectedLevel === level.id
                        ? 'bg-[#e8f3ff] border-2 border-[#3182f6]'
                        : 'bg-[#f2f4f6] border-2 border-transparent'
                    } ${isProcessing ? 'opacity-50' : ''}`}
                  >
                    <span className="text-[20px] block mb-1">{level.icon}</span>
                    <span className={`text-[11px] font-medium ${
                      selectedLevel === level.id ? 'text-[#3182f6]' : 'text-[#6b7684]'
                    }`}>
                      {getLevelLabel(level.id)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <p className="text-[14px] text-[#191f28] font-medium mb-3">{t('training_duration')}</p>
              <div className="flex gap-2">
                {durations.map((duration) => (
                  <button
                    key={duration.id}
                    onClick={() => {
                      setSelectedDuration(duration.id);
                      setResultImage(null);
                    }}
                    disabled={isProcessing}
                    className={`flex-1 py-3 rounded-xl text-[13px] font-medium transition-all ${
                      selectedDuration === duration.id
                        ? 'bg-[#00c471] text-white'
                        : 'bg-[#f2f4f6] text-[#6b7684]'
                    } ${isProcessing ? 'opacity-50' : ''}`}
                  >
                    {getDurationLabel(duration.id)}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Description */}
            <div className="bg-[#f9fafb] rounded-xl p-4 mb-6">
              <p className="text-[13px] text-[#6b7684]">
                {selectedLevel === 'light' && t('fitness_light_desc')}
                {selectedLevel === 'moderate' && t('fitness_moderate_desc')}
                {selectedLevel === 'athletic' && t('fitness_athletic_desc')}
                {selectedLevel === 'bodybuilder' && t('fitness_bodybuilder_desc')}
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
                    disabled={isProcessing}
                    className={`w-full py-4 text-[16px] font-semibold rounded-xl transition-all ${
                      isProcessing
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
