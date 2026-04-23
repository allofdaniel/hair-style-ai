/**
 * GrowthSimulation Page - Hair Length Simulation (2-Step)
 *
 * Step 1: Analyze current hair (length, style, texture) via Gemini text
 * Step 2: Generate realistic growth image using analysis + growth data
 *
 * Korean hair growth rate data:
 * - Male: 0.300~0.319 mm/day (avg 0.310)
 * - Female: 0.289~0.327 mm/day (avg 0.308)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAppStore } from '../stores/useAppStore';
import { useI18n, type TranslationKey } from '../i18n/useI18n';
import { resilientFetch } from '../services/networkResilience';
import { logger } from '../services/logger';
import Toast from '../components/Toast';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 2000,
  maxDelay: 15000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Korean hair growth rates (mm per day)
const GROWTH_RATES = {
  male: { min: 0.300, max: 0.319, avg: 0.310 },
  female: { min: 0.289, max: 0.327, avg: 0.308 },
};

const WEEK_PRESETS = [
  { label: '1W', weeks: 1 },
  { label: '2W', weeks: 2 },
  { label: '1M', weeks: 4 },
  { label: '3M', weeks: 13 },
  { label: '6M', weeks: 26 },
];

interface HairAnalysis {
  currentStyle: string;
  lengths: {
    top: number;
    sides: number;
    back: number;
    bangs: number;
  };
  texture: string;
  overallLength: number;
  description: string;
}

function getLengthDescription(cm: number): string {
  if (cm <= 1) return '극초단발 (두피가 보이는 정도)';
  if (cm <= 3) return '초단발/크루컷 (손가락으로 잡기 어려운 정도)';
  if (cm <= 5) return '단발 (귀 위, 이마 중간)';
  if (cm <= 10) return '숏컷 (귀를 덮는 정도)';
  if (cm <= 15) return '미디엄 (턱선~어깨 사이)';
  if (cm <= 25) return '세미롱 (어깨~쇄골)';
  if (cm <= 40) return '롱헤어 (가슴 중간)';
  return '슈퍼롱 (가슴 아래)';
}

function buildAnalysisPrompt(): string {
  return `You are a professional hair stylist AI. Analyze this person's hair carefully.

IMPORTANT: Measure hair lengths as accurately as possible by looking at where the hair falls relative to facial/body landmarks:
- Ear top = ~5cm from scalp
- Ear bottom/jaw = ~10cm
- Chin = ~15cm
- Shoulder = ~25cm
- Chest = ~35cm

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "currentStyle": "name/description of current hairstyle in Korean",
  "lengths": {
    "top": <number in cm - hair length at crown/top>,
    "sides": <number in cm - hair length at temples/sides>,
    "back": <number in cm - hair length at back/nape>,
    "bangs": <number in cm - bang length, 0 if no bangs>
  },
  "texture": "straight/wavy/curly",
  "overallLength": <number in cm - longest hair point>,
  "description": "detailed description of how the hair currently looks, falls, and is styled - in Korean"
}`;
}

function buildGrowthPrompt(analysis: HairAnalysis, gender: 'male' | 'female', weeks: number): string {
  const rates = GROWTH_RATES[gender];
  const days = weeks * 7;
  const growthCm = Number(((rates.avg * days) / 10).toFixed(1));

  const newTop = (analysis.lengths.top + growthCm).toFixed(1);
  const newSides = (analysis.lengths.sides + growthCm).toFixed(1);
  const newBack = (analysis.lengths.back + growthCm).toFixed(1);
  const newBangs = analysis.lengths.bangs > 0 ? (analysis.lengths.bangs + growthCm).toFixed(1) : '0';
  const newOverall = (analysis.overallLength + growthCm).toFixed(1);

  const genderKo = gender === 'male' ? '남성' : '여성';
  const months = (weeks / 4.33).toFixed(1);

  return `You are a professional photo editor specializing in realistic hair modifications. Your task is to edit this photo to show how this person's hair would naturally look after ${weeks} weeks (${months} months) of growth.

CURRENT HAIR ANALYSIS:
- Style: ${analysis.currentStyle}
- Description: ${analysis.description}
- Texture: ${analysis.texture}
- Current lengths:
  * Top/Crown: ${analysis.lengths.top}cm
  * Sides: ${analysis.lengths.sides}cm
  * Back: ${analysis.lengths.back}cm
  * Bangs: ${analysis.lengths.bangs > 0 ? analysis.lengths.bangs + 'cm' : 'none'}
  * Overall longest: ${analysis.overallLength}cm

GROWTH CALCULATION (Korean ${genderKo}, ${rates.avg}mm/day × ${days} days = +${growthCm}cm):
- Top/Crown: ${analysis.lengths.top}cm → ${newTop}cm (${getLengthDescription(Number(newTop))})
- Sides: ${analysis.lengths.sides}cm → ${newSides}cm (${getLengthDescription(Number(newSides))})
- Back: ${analysis.lengths.back}cm → ${newBack}cm (${getLengthDescription(Number(newBack))})
${analysis.lengths.bangs > 0 ? `- Bangs: ${analysis.lengths.bangs}cm → ${newBangs}cm (${getLengthDescription(Number(newBangs))})` : '- No bangs to grow'}
- Overall: ${analysis.overallLength}cm → ${newOverall}cm (${getLengthDescription(Number(newOverall))})

HOW TO MODIFY THE HAIR:
1. Keep the EXACT same hair color and texture (${analysis.texture})
2. Extend all hair proportionally to the new calculated lengths above
3. The hair at ${newTop}cm on top means it ${Number(newTop) > 10 ? 'falls and drapes naturally due to gravity' : 'sticks up or lies flat depending on texture'}
4. Side hair at ${newSides}cm ${Number(newSides) > 10 ? 'covers the ears partially or fully' : Number(newSides) > 5 ? 'reaches around the ears' : 'is still above the ears'}
5. Back hair at ${newBack}cm ${Number(newBack) > 25 ? 'reaches past the shoulders' : Number(newBack) > 15 ? 'reaches the neck/collar area' : 'is still short in the back'}
${weeks >= 4 ? '6. Hair should look slightly less maintained/styled - natural growing out appearance' : ''}
${weeks >= 13 ? '7. Original hairstyle shape is largely lost - hair grows out into a more natural/messy state' : ''}
${weeks >= 20 ? '8. Significant length - hair weight causes it to fall straighter and longer' : ''}

CRITICAL - DO NOT CHANGE ANYTHING EXCEPT HAIR:
- Same face (every feature identical)
- Same skin color and texture
- Same expression
- Same clothing
- Same background, lighting, angle
- Same person - just with naturally longer hair

Output ONE photo of the same person with realistically grown-out hair at the specified lengths.`;
}

function extractBase64(dataUrl: string): string {
  if (dataUrl.includes('base64,')) return dataUrl.split('base64,')[1];
  return dataUrl;
}

function getMimeType(dataUrl: string): string {
  if (dataUrl.includes('data:image/jpeg')) return 'image/jpeg';
  if (dataUrl.includes('data:image/png')) return 'image/png';
  if (dataUrl.includes('data:image/webp')) return 'image/webp';
  return 'image/png';
}

// Convert webPath or any URL to data URL
async function convertToDataUrl(url: string): Promise<string> {
  // Already a data URL
  if (url.startsWith('data:')) return url;

  try {
    // Fetch the image and convert to base64
    const response = await resilientFetch(url);
    if (!response.ok) {
      throw new Error(`이미지 로드 실패: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('이미지 변환 실패'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('convertToDataUrl error:', error);
    throw new Error('이미지를 불러올 수 없습니다.');
  }
}

function getWeekLabel(weeks: number): string {
  if (weeks < 4) return `${weeks}주`;
  const months = Math.round(weeks / 4.33);
  if (months <= 0) return `${weeks}주`;
  return `${weeks}주 (약 ${months}개월)`;
}

export default function GrowthSimulation() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { gender, setGender, userPhoto, setResultImage } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [weeks, setWeeks] = useState(() => {
    const stored = localStorage.getItem('growthWeeks');
    return stored ? parseInt(stored, 10) : 4;
  });
  const [photo, setPhoto] = useState<string | null>(userPhoto);
  const [resultImage, setLocalResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null);

  const growthCm = ((GROWTH_RATES[gender].avg * weeks * 7) / 10).toFixed(1);
  const sliderPercent = ((weeks - 1) / (26 - 1)) * 100;

  // Take photo with camera
  const handleCameraCapture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        setLocalResultImage(null);
        setHairAnalysis(null);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('cancel') || errorMsg.includes('Cancel')) return;
      logger.error('Camera error:', errorMsg);
    }
  };

  // Pick photo from gallery
  const handleGalleryPick = async () => {
    try {
      const result = await Camera.pickImages({ quality: 90, limit: 1 });
      if (result.photos?.[0]?.webPath) {
        setPhoto(result.photos[0].webPath);
        setLocalResultImage(null);
        setHairAnalysis(null);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('cancel') || errorMsg.includes('Cancel')) return;
      try {
        const image = await Camera.getPhoto({
          quality: 90, allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (image.dataUrl) {
          setPhoto(image.dataUrl);
          setLocalResultImage(null);
          setHairAnalysis(null);
        }
      } catch {
        fileInputRef.current?.click();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto(event.target?.result as string);
      setLocalResultImage(null);
      setHairAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Analyze current hair
  const analyzeHair = async (mimeType: string, base64Data: string): Promise<HairAnalysis> => {
    setStatusText('머리카락 분석 중...');
    setProgress(15);

    const response = await resilientFetch(GEMINI_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: buildAnalysisPrompt() },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }, RETRY_CONFIG);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) throw new Error('No analysis result');

    try {
      const analysis: HairAnalysis = JSON.parse(textContent);
      // Validate required fields
      if (!analysis.currentStyle || !analysis.lengths || typeof analysis.overallLength !== 'number') {
        throw new Error('Invalid analysis format');
      }
      logger.log('Hair analysis:', analysis);
      return analysis;
    } catch (parseError) {
      logger.error('JSON parse error:', textContent);
      throw new Error('분석 결과 해석 실패. 다시 시도해주세요.');
    }
  };

  // Step 2: Generate growth image
  const generateGrowthImage = async (
    analysis: HairAnalysis,
    mimeType: string,
    base64Data: string,
  ): Promise<string> => {
    setStatusText('길이 시뮬레이션 생성 중...');
    setProgress(50);

    const prompt = buildGrowthPrompt(analysis, gender, weeks);

    const response = await resilientFetch(GEMINI_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 0.1,
        },
      }),
    }, RETRY_CONFIG);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Generation failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error('No image in response');
  };

  // Full 2-step generation
  const handleGenerate = useCallback(async () => {
    if (!photo || !GEMINI_API_KEY) return;

    setIsProcessing(true);
    setProgress(5);
    setLocalResultImage(null);
    setStatusText('준비 중...');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + Math.random() * 3;
        if (prev < 85) return prev + Math.random() * 2;
        return Math.min(prev + Math.random() * 1, 95);
      });
    }, 800);

    try {
      // Convert webPath to data URL if needed
      setStatusText('이미지 준비 중...');
      const dataUrl = await convertToDataUrl(photo);
      const mimeType = getMimeType(dataUrl);
      const base64Data = extractBase64(dataUrl);

      // Step 1: Analyze hair
      const analysis = await analyzeHair(mimeType, base64Data);
      setHairAnalysis(analysis);
      setProgress(40);

      // Step 2: Generate with analysis
      const result = await generateGrowthImage(analysis, mimeType, base64Data);
      clearInterval(progressInterval);

      setLocalResultImage(result);
      setResultImage(result);
      setProgress(100);
      setStatusText('완료!');
    } catch (error) {
      clearInterval(progressInterval);
      logger.error('Growth simulation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Generation failed');
      setShowErrorToast(true);
      setStatusText('');
    } finally {
      setIsProcessing(false);
    }
  }, [photo, gender, weeks, setResultImage]);

  // Auto-start simulation when navigating with a photo
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (photo && !hasAutoStarted.current && !isProcessing && !resultImage) {
      hasAutoStarted.current = true;
      // Small delay to ensure UI is rendered
      const timer = setTimeout(() => {
        handleGenerate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [photo, isProcessing, resultImage, handleGenerate]);

  const currentLength = hairAnalysis?.overallLength ?? 0;
  const targetLength = currentLength + Number(growthCm);

  return (
    <div className="min-h-screen bg-[#181114] text-white">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-[#181114]/80 backdrop-blur-md px-4 pt-12 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          {t('length_simulation' as TranslationKey) || '머리 길이 시뮬레이션'}
        </h2>
      </div>

      <main className="max-w-md mx-auto pb-36">
        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Current Photo */}
          <div className="flex flex-col gap-2.5">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#2a1d24]">
              {photo ? (
                <>
                  <img src={photo} alt="Current" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={handleCameraCapture}
                      className="size-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20 active:scale-90 transition-transform"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                    <button
                      onClick={handleGalleryPick}
                      className="size-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20 active:scale-90 transition-transform"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </button>
                  </div>
                  {/* Analysis badge */}
                  {hairAnalysis && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] text-white/90 font-medium truncate">{hairAnalysis.currentStyle}</p>
                      <p className="text-[9px] text-[#E91E63]">현재 약 {hairAnalysis.overallLength}cm</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleCameraCapture}
                      className="flex flex-col items-center gap-1 bg-[#E91E63] p-3 rounded-xl active:scale-95 transition-transform"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-[10px] font-bold">{t('camera' as TranslationKey) || '촬영'}</span>
                    </button>
                    <button
                      onClick={handleGalleryPick}
                      className="flex flex-col items-center gap-1 bg-[#3b82f6] p-3 rounded-xl active:scale-95 transition-transform"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-[10px] font-bold">{t('gallery') || '갤러리'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-white text-base font-semibold">{t('before' as TranslationKey) || '현재'}</p>
              <p className="text-white/50 text-xs">
                {hairAnalysis ? `${hairAnalysis.overallLength}cm · ${hairAnalysis.texture}` : photo ? '분석 대기' : (t('select_photo' as TranslationKey) || '사진을 등록해주세요')}
              </p>
            </div>
          </div>

          {/* Result Photo */}
          <div className="flex flex-col gap-2.5">
            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-white/10 bg-[#2a1d24] flex items-center justify-center relative">
              {resultImage ? (
                <>
                  <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                    <p className="text-[10px] text-white/90 font-medium">+{growthCm}cm 성장</p>
                    <p className="text-[9px] text-[#E91E63]">약 {targetLength.toFixed(1)}cm</p>
                  </div>
                </>
              ) : isProcessing ? (
                <div className="flex flex-col items-center gap-3 px-4">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-[#E91E63] rounded-full animate-spin" />
                  <span className="text-[11px] text-white/60 text-center">{statusText}</span>
                  <span className="text-xs text-white/40">{Math.round(progress)}%</span>
                </div>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-white text-base font-semibold">{t('after' as TranslationKey) || '결과'}</p>
              <p className="text-white/50 text-xs">
                {resultImage ? `${targetLength.toFixed(1)}cm (${weeks}주 후)` : isProcessing ? statusText : '시뮬레이션 대기'}
              </p>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {/* Gender Segmented Control */}
        <div className="px-4 py-2">
          <div className="flex h-12 w-full items-center rounded-full bg-[#2a1d24] p-1 border border-white/5">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex h-full flex-1 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  gender === g
                    ? 'bg-[#392830] text-white'
                    : 'text-white/50'
                }`}
              >
                {t(g as TranslationKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Growth Period Section */}
        <div className="mt-4">
          <h3 className="text-lg font-bold leading-tight tracking-tight px-4 pb-2">
            {t('growth_period' as TranslationKey) || '성장 기간'}
          </h3>

          <div className="flex gap-2 px-4 mb-3 overflow-x-auto">
            {WEEK_PRESETS.map((preset) => (
              <button
                key={preset.weeks}
                onClick={() => setWeeks(preset.weeks)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  weeks === preset.weeks
                    ? 'bg-[#E91E63]/20 text-[#E91E63] font-bold border-[#E91E63]/30'
                    : 'bg-[#2a1d24] text-white/70 border-white/10'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="px-4">
            <div className="relative flex w-full items-center h-6">
              <div className="flex h-1.5 flex-1 rounded-full bg-[#392830]">
                <div
                  className="h-full rounded-full bg-[#E91E63] relative transition-all duration-150"
                  style={{ width: `${sliderPercent}%` }}
                >
                  <div className="absolute -right-2.5 -top-[9px] size-6 rounded-full bg-white shadow-lg border-4 border-[#E91E63]" />
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="26"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex w-full items-center justify-between text-white/50 text-xs font-medium mt-2">
              <span>1주</span>
              <span className="text-[#E91E63] font-bold text-sm">{getWeekLabel(weeks)}</span>
              <span>26주</span>
            </div>
          </div>
        </div>

        {/* Growth Info Card */}
        <div className="mx-4 mt-6 p-5 rounded-2xl border border-[#E91E63]/20" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <p className="text-white/70 text-sm font-medium">{t('expected_growth' as TranslationKey) || '예상 성장량'}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[#E91E63] text-4xl font-bold tracking-tight">+{growthCm} cm</span>
            <span className="text-white/40 text-sm">평균 기준</span>
          </div>

          {/* Length comparison */}
          {hairAnalysis ? (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/50">현재: {hairAnalysis.overallLength}cm</span>
                <span className="text-[#E91E63] font-medium">→ {targetLength.toFixed(1)}cm</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                {/* Current length marker */}
                <div
                  className="h-full rounded-full bg-white/30 absolute left-0"
                  style={{ width: `${Math.min((hairAnalysis.overallLength / 50) * 100, 100)}%` }}
                />
                {/* Target length */}
                <div
                  className="h-full rounded-full absolute left-0 transition-all duration-300"
                  style={{
                    width: `${Math.min((targetLength / 50) * 100, 100)}%`,
                    background: 'linear-gradient(to right, #E91E63, #7c3aed)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30">
                <span>{getLengthDescription(hairAnalysis.overallLength)}</span>
              </div>
              <div className="text-[10px] text-[#E91E63]/70">
                → {getLengthDescription(targetLength)}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>현재 길이</span>
                <span>성장 목표</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((weeks / 26) * 100, 100)}%`,
                    background: 'linear-gradient(to right, #E91E63, #7c3aed)',
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-white/30">사진을 등록하면 현재 길이를 분석합니다</p>
            </div>
          )}

          <p className="mt-3 text-[11px] text-white/40 leading-relaxed">
            * {gender === 'male' ? '한국 남성' : '한국 여성'} 평균 성장률 {GROWTH_RATES[gender].avg}mm/일 기준
          </p>
        </div>

        {/* Hair Analysis Detail (shown after analysis) */}
        {hairAnalysis && (
          <div className="mx-4 mt-3 p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[11px] text-white/50 font-medium mb-2">분석 결과</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/40">윗머리</span>
                <span className="text-white/70">{hairAnalysis.lengths.top}cm → {(hairAnalysis.lengths.top + Number(growthCm)).toFixed(1)}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">옆머리</span>
                <span className="text-white/70">{hairAnalysis.lengths.sides}cm → {(hairAnalysis.lengths.sides + Number(growthCm)).toFixed(1)}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">뒷머리</span>
                <span className="text-white/70">{hairAnalysis.lengths.back}cm → {(hairAnalysis.lengths.back + Number(growthCm)).toFixed(1)}cm</span>
              </div>
              {hairAnalysis.lengths.bangs > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/40">앞머리</span>
                  <span className="text-white/70">{hairAnalysis.lengths.bangs}cm → {(hairAnalysis.lengths.bangs + Number(growthCm)).toFixed(1)}cm</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pt-10" style={{ background: 'linear-gradient(to top, #181114, transparent)' }}>
        <button
          onClick={handleGenerate}
          disabled={!photo || isProcessing}
          className="w-full h-14 rounded-2xl text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100"
          style={{ background: 'linear-gradient(to right, #E91E63, #7c3aed)', boxShadow: '0 8px 24px rgba(238,43,140,0.2)' }}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{statusText} {Math.round(progress)}%</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
              </svg>
              <span>{t('simulate_length' as TranslationKey) || '길이 시뮬레이션 시작'}</span>
            </>
          )}
        </button>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      <Toast
        message={errorMessage}
        type="error"
        visible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
      />
    </div>
  );
}
