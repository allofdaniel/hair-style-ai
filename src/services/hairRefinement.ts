import { logger } from './logger';
import { resilientFetch } from './networkResilience';
/**
 * 헤어스타일 미세 조정 서비스
 * 생성된 결과물을 텍스트 명령으로 조정
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Gemini 2.5 Flash Image - production-ready image generation model
// Model name: gemini-2.5-flash-image (NOT gemini-2.5-flash-image-generation)
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

export interface RefinementOption {
  id: string;
  labelKo: string;
  labelEn: string;
  icon: string;
  minLabel?: { ko: string; en: string };
  maxLabel?: { ko: string; en: string };
  type: 'slider' | 'toggle';
  min?: number;
  max?: number;
  default?: number;
  promptModifier: (value: number) => string;
}

// 미세 조정 옵션 정의 (이모지 제거, 각 항목에 맞는 라벨)
export const refinementOptions: RefinementOption[] = [
  {
    id: 'side-length',
    labelKo: '옆머리 길이',
    labelEn: 'Side Length',
    icon: '',
    minLabel: { ko: '짧게', en: 'Shorter' },
    maxLabel: { ko: '길게', en: 'Longer' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the side hair much shorter, closely cropped near the ears';
      if (value < 0) return 'Make the side hair slightly shorter';
      if (value > 20) return 'Make the side hair much longer, covering the ears more';
      if (value > 0) return 'Make the side hair slightly longer';
      return '';
    },
  },
  {
    id: 'top-length',
    labelKo: '윗머리 길이',
    labelEn: 'Top Length',
    icon: '',
    minLabel: { ko: '짧게', en: 'Shorter' },
    maxLabel: { ko: '길게', en: 'Longer' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the top hair much shorter';
      if (value < 0) return 'Make the top hair slightly shorter';
      if (value > 20) return 'Make the top hair much longer';
      if (value > 0) return 'Make the top hair slightly longer';
      return '';
    },
  },
  {
    id: 'volume',
    labelKo: '볼륨',
    labelEn: 'Volume',
    icon: '',
    minLabel: { ko: '가볍게', en: 'Flat' },
    maxLabel: { ko: '풍성하게', en: 'Full' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the hair much flatter and less voluminous';
      if (value < 0) return 'Reduce the hair volume slightly';
      if (value > 20) return 'Add much more volume and lift to the hair, making it fuller and more bouncy';
      if (value > 0) return 'Add slightly more volume to the hair';
      return '';
    },
  },
  {
    id: 'bangs-length',
    labelKo: '앞머리 길이',
    labelEn: 'Bangs Length',
    icon: '',
    minLabel: { ko: '짧게', en: 'Shorter' },
    maxLabel: { ko: '길게', en: 'Longer' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the bangs/fringe much shorter, above the eyebrows';
      if (value < 0) return 'Trim the bangs slightly shorter';
      if (value > 20) return 'Make the bangs much longer, past the eyebrows';
      if (value > 0) return 'Make the bangs slightly longer';
      return '';
    },
  },
  {
    id: 'curl',
    labelKo: '컬/웨이브',
    labelEn: 'Curl/Wave',
    icon: '',
    minLabel: { ko: '직모', en: 'Straight' },
    maxLabel: { ko: '곱슬', en: 'Curly' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the hair much straighter, remove all curls and waves';
      if (value < 0) return 'Straighten the hair slightly, reduce the curl';
      if (value > 20) return 'Add much more curl and wave to the hair, making it very wavy/curly';
      if (value > 0) return 'Add slightly more curl and wave';
      return '';
    },
  },
  {
    id: 'parting',
    labelKo: '가르마 위치',
    labelEn: 'Parting Position',
    icon: '',
    minLabel: { ko: '왼쪽', en: 'Left' },
    maxLabel: { ko: '오른쪽', en: 'Right' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Move the hair parting to the far left side (deep left parting)';
      if (value < 0) return 'Shift the parting slightly to the left';
      if (value > 20) return 'Move the hair parting to the far right side (deep right parting)';
      if (value > 0) return 'Shift the parting slightly to the right';
      return '';
    },
  },
  {
    id: 'texture',
    labelKo: '질감',
    labelEn: 'Texture',
    icon: '',
    minLabel: { ko: '매끈하게', en: 'Smooth' },
    maxLabel: { ko: '텍스처', en: 'Textured' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the hair very smooth and sleek, with a glossy polished finish';
      if (value < 0) return 'Make the hair slightly smoother and less textured';
      if (value > 20) return 'Add much more texture and definition, making it look more tousled and natural';
      if (value > 0) return 'Add slightly more texture and movement';
      return '';
    },
  },
  {
    id: 'lift',
    labelKo: '뿌리 볼륨',
    labelEn: 'Root Lift',
    icon: '',
    minLabel: { ko: '눕히기', en: 'Flat' },
    maxLabel: { ko: '올리기', en: 'Lifted' },
    type: 'slider',
    min: -50,
    max: 50,
    default: 0,
    promptModifier: (value) => {
      if (value < -20) return 'Make the hair lie very flat against the head, no lift';
      if (value < 0) return 'Reduce the lift slightly, hair should be more flat';
      if (value > 20) return 'Lift the hair up much more, create significant height at the crown and roots';
      if (value > 0) return 'Lift the hair up slightly more at the roots';
      return '';
    },
  },
];

interface RefinementParams {
  resultImage: string;  // 현재 생성된 결과 이미지
  userPhoto?: string;   // 원본 사용자 사진 (future use)
  adjustments: Record<string, number>;  // 조정값들
  styleName: string;    // 원래 스타일명
}

interface RefinementResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

export const refineHairstyle = async (
  params: RefinementParams
): Promise<RefinementResponse> => {
  const { resultImage, adjustments, styleName } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'API key not configured' };
  }

  // 조정 프롬프트 생성
  const adjustmentPrompts: string[] = [];
  for (const [optionId, value] of Object.entries(adjustments)) {
    if (value === 0) continue;
    const option = refinementOptions.find(o => o.id === optionId);
    if (option) {
      const modifier = option.promptModifier(value);
      if (modifier) {
        adjustmentPrompts.push(modifier);
      }
    }
  }

  if (adjustmentPrompts.length === 0) {
    return { success: false, error: 'No adjustments specified' };
  }

  try {
    const base64Data = resultImage.includes('base64,')
      ? resultImage.split('base64,')[1]
      : resultImage;

    let mimeType = 'image/jpeg';
    if (resultImage.includes('data:image/png')) mimeType = 'image/png';
    else if (resultImage.includes('data:image/webp')) mimeType = 'image/webp';

    const prompt = `You are making VERY SMALL, SUBTLE adjustments to an existing hairstyle photo.

CURRENT HAIRSTYLE: "${styleName}" - THIS MUST REMAIN THE SAME OVERALL STYLE.

MICRO-ADJUSTMENTS REQUESTED (very subtle changes only):
${adjustmentPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

★★★ CRITICAL - READ CAREFULLY ★★★

DO NOT:
- Change the overall hairstyle or cut
- Create a completely new hairstyle
- Alter the face, skin, eyes, clothing, or background
- Make dramatic or obvious changes
- Change the hair color (unless specifically requested)

DO:
- Keep the EXACT SAME hairstyle type/cut as "${styleName}"
- Make only TINY, SUBTLE refinements (5-15% change maximum)
- Preserve ALL facial features 100% identical
- Keep the same image quality, lighting, and background
- The person should look like they just had minor touch-ups, NOT a new haircut

Think of this as a hairstylist making final minor adjustments, NOT a complete restyle.
The before and after should look 85-95% identical with only small refinements.

Generate the subtly refined image now.`;

    logger.log('Refining hairstyle with:', adjustmentPrompts);

    const response = await resilientFetch(`${GEMINI_IMAGE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          temperature: 0.4,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Refinement API error:', response.status, errorText);
      if (response.status === 429) {
        return { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
      }
      return { success: false, error: `API 오류: ${response.status}` };
    }

    const data = await response.json();
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'AI가 이미지를 생성하지 못했습니다.' };
    }

    const parts = candidates[0].content?.parts;
    const imagePart = parts?.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);

    if (imagePart?.inlineData) {
      return {
        success: true,
        resultImage: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      };
    }

    return { success: false, error: 'AI가 이미지를 생성하지 못했습니다.' };
  } catch (error) {
    logger.error('Refinement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};




