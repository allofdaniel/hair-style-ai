import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  simulateHairColor,
  getColorCategories,
  getColorsByCategory,
  getColorInfo,
  type HairColorType,
} from '../services/hairColorSimulation';
import { useI18n } from '../i18n/useI18n';

export default function HairColorSimulation() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('natural');
  const [selectedColor, setSelectedColor] = useState<HairColorType | null>(null);
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'vivid'>('medium');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = getColorCategories();

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
    if (!userPhoto || !selectedColor) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await simulateHairColor({
        userPhoto,
        colorType: selectedColor,
        intensity,
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
    link.download = `hair-color-${selectedColor}-${Date.now()}.png`;
    link.click();
  };

  const colorOptions = getColorsByCategory(selectedCategory);

  const getColorPreview = (colorType: HairColorType): string => {
    const colorMap: Record<string, string> = {
      'natural-black': '#1a1a1a',
      'natural-brown': '#5c4033',
      'natural-chestnut': '#8b4513',
      'ash-brown': '#6b5c4c',
      'ash-gray': '#9e9e9e',
      'ash-blonde': '#c4b7a6',
      'warm-brown': '#8b6914',
      'warm-caramel': '#c68e17',
      'warm-honey': '#daa520',
      'red-burgundy': '#722f37',
      'red-copper': '#b87333',
      'red-wine': '#722f37',
      'blonde-platinum': '#e5e4e2',
      'blonde-golden': '#ffd700',
      'blonde-beige': '#d4c4a8',
      'fantasy-pink': '#ff69b4',
      'fantasy-purple': '#9b59b6',
      'fantasy-blue': '#3498db',
      'fantasy-green': '#2ecc71',
      'ombre-dark-to-light': 'linear-gradient(180deg, #1a1a1a 0%, #daa520 100%)',
      'balayage': 'linear-gradient(135deg, #5c4033 0%, #c68e17 50%, #5c4033 100%)',
      'highlights': 'linear-gradient(90deg, #5c4033 0%, #daa520 20%, #5c4033 40%, #daa520 60%, #5c4033 80%, #daa520 100%)',
    };
    return colorMap[colorType] || '#888';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('hair_color_simulation')}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-5">
        {/* Photo Selection */}
        {!userPhoto ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-[#191f28] font-medium mb-2">{t('select_photo')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6 text-center">{t('hair_color_desc')}</p>
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
                  {resultImage ? t('after') : selectedColor ? getColorInfo(selectedColor).name : t('select_color')}
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
                      <p className="text-[14px] text-[#b0b8c1]">{t('select_color_preview')}</p>
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
                      setSelectedColor(null);
                      setResultImage(null);
                    }}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#191f28] text-white'
                        : 'bg-[#f2f4f6] text-[#6b7684]'
                    }`}
                  >
                    {language === 'ko' ? cat.name : cat.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Options */}
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-3">
                {colorOptions.map((colorType) => {
                  const info = getColorInfo(colorType);
                  const colorStyle = getColorPreview(colorType);

                  return (
                    <button
                      key={colorType}
                      onClick={() => {
                        setSelectedColor(colorType);
                        setResultImage(null);
                      }}
                      disabled={isProcessing}
                      className={`p-3 rounded-xl transition-all ${
                        selectedColor === colorType
                          ? 'bg-[#e8f3ff] border-2 border-[#3182f6]'
                          : 'bg-[#f2f4f6] border-2 border-transparent'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2"
                        style={{
                          background: colorStyle,
                          border: colorType.includes('platinum') ? '1px solid #ddd' : 'none',
                        }}
                      />
                      <p className={`text-[12px] font-medium text-center ${
                        selectedColor === colorType ? 'text-[#3182f6]' : 'text-[#191f28]'
                      }`}>
                        {info.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity Selector */}
            {selectedColor && (
              <div className="mb-6">
                <p className="text-[14px] text-[#191f28] font-medium mb-3">{t('color_intensity')}</p>
                <div className="flex gap-2">
                  {(['subtle', 'medium', 'vivid'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setIntensity(level);
                        setResultImage(null);
                      }}
                      disabled={isProcessing}
                      className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                        intensity === level
                          ? 'bg-[#e8f3ff] text-[#3182f6] border-2 border-[#3182f6]'
                          : 'bg-[#f2f4f6] text-[#6b7684] border-2 border-transparent'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      {t(`intensity_${level}`)}
                    </button>
                  ))}
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
                      setSelectedColor(null);
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
                    disabled={!selectedColor || isProcessing}
                    className={`w-full py-4 text-[16px] font-semibold rounded-xl transition-all ${
                      !selectedColor || isProcessing
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
                      setSelectedColor(null);
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
