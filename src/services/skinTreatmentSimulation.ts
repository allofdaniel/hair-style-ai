const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type SkinTreatmentType =
  // 피부 질감 개선
  | 'pore-reduction' | 'acne-treatment' | 'acne-scar-treatment'
  | 'wrinkle-reduction-light' | 'wrinkle-reduction-moderate'
  // 피부톤 개선
  | 'brightening' | 'dark-spot-removal' | 'redness-reduction' | 'even-tone'
  // 리프팅/볼륨
  | 'face-lift-subtle' | 'face-lift-moderate'
  | 'cheek-volume' | 'lip-filler-subtle' | 'lip-filler-moderate'
  | 'jaw-contour' | 'chin-enhancement'
  // 눈 주변
  | 'under-eye-treatment' | 'eye-bag-removal' | 'double-eyelid'
  // 코 성형
  | 'nose-bridge' | 'nose-tip-refinement'
  // 전체 개선
  | 'glass-skin' | 'natural-glow' | 'matte-finish';

interface SkinTreatmentParams {
  userPhoto: string;
  treatmentType: SkinTreatmentType;
}

interface SimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const treatmentDescriptions: Record<SkinTreatmentType, { name: string; nameKo: string; description: string; category: string }> = {
  // 피부 질감
  'pore-reduction': {
    name: 'Pore Reduction',
    nameKo: '모공 축소',
    description: 'Minimize visible pores for smoother skin texture',
    category: 'texture',
  },
  'acne-treatment': {
    name: 'Acne Treatment',
    nameKo: '여드름 치료',
    description: 'Clear active acne and reduce inflammation',
    category: 'texture',
  },
  'acne-scar-treatment': {
    name: 'Acne Scar Treatment',
    nameKo: '여드름 흉터 치료',
    description: 'Reduce appearance of acne scars and uneven texture',
    category: 'texture',
  },
  'wrinkle-reduction-light': {
    name: 'Light Wrinkle Reduction',
    nameKo: '주름 개선 (약함)',
    description: 'Subtle reduction of fine lines, natural aging look',
    category: 'texture',
  },
  'wrinkle-reduction-moderate': {
    name: 'Moderate Wrinkle Reduction',
    nameKo: '주름 개선 (중간)',
    description: 'More noticeable wrinkle smoothing, still natural',
    category: 'texture',
  },
  // 피부톤
  'brightening': {
    name: 'Skin Brightening',
    nameKo: '피부 브라이트닝',
    description: 'Overall brighter, more luminous skin tone',
    category: 'tone',
  },
  'dark-spot-removal': {
    name: 'Dark Spot Removal',
    nameKo: '기미/잡티 제거',
    description: 'Remove dark spots, freckles, and hyperpigmentation',
    category: 'tone',
  },
  'redness-reduction': {
    name: 'Redness Reduction',
    nameKo: '홍조 개선',
    description: 'Reduce facial redness and rosacea appearance',
    category: 'tone',
  },
  'even-tone': {
    name: 'Even Skin Tone',
    nameKo: '균일한 피부톤',
    description: 'Create uniform skin color across the face',
    category: 'tone',
  },
  // 리프팅/볼륨
  'face-lift-subtle': {
    name: 'Subtle Face Lift',
    nameKo: '리프팅 (자연스러움)',
    description: 'Gentle lift to jawline and cheeks, very natural',
    category: 'contour',
  },
  'face-lift-moderate': {
    name: 'Moderate Face Lift',
    nameKo: '리프팅 (중간)',
    description: 'More defined lift, tighter appearance',
    category: 'contour',
  },
  'cheek-volume': {
    name: 'Cheek Volume',
    nameKo: '볼 볼륨',
    description: 'Add volume to cheeks for youthful fullness',
    category: 'contour',
  },
  'lip-filler-subtle': {
    name: 'Subtle Lip Enhancement',
    nameKo: '입술 필러 (자연스러움)',
    description: 'Slightly fuller, more defined lips',
    category: 'contour',
  },
  'lip-filler-moderate': {
    name: 'Moderate Lip Enhancement',
    nameKo: '입술 필러 (중간)',
    description: 'Noticeably fuller lips with more volume',
    category: 'contour',
  },
  'jaw-contour': {
    name: 'Jaw Contouring',
    nameKo: '턱선 윤곽',
    description: 'More defined, slimmer jawline',
    category: 'contour',
  },
  'chin-enhancement': {
    name: 'Chin Enhancement',
    nameKo: '턱끝 성형',
    description: 'More projected, balanced chin',
    category: 'contour',
  },
  // 눈 주변
  'under-eye-treatment': {
    name: 'Under Eye Treatment',
    nameKo: '다크서클 개선',
    description: 'Reduce dark circles and under-eye discoloration',
    category: 'eyes',
  },
  'eye-bag-removal': {
    name: 'Eye Bag Removal',
    nameKo: '눈밑 지방 제거',
    description: 'Remove puffy under-eye bags',
    category: 'eyes',
  },
  'double-eyelid': {
    name: 'Double Eyelid',
    nameKo: '쌍꺼풀',
    description: 'Create natural-looking double eyelid crease',
    category: 'eyes',
  },
  // 코
  'nose-bridge': {
    name: 'Nose Bridge Enhancement',
    nameKo: '코 높이기',
    description: 'Higher, more defined nose bridge',
    category: 'nose',
  },
  'nose-tip-refinement': {
    name: 'Nose Tip Refinement',
    nameKo: '코끝 성형',
    description: 'More refined, smaller nose tip',
    category: 'nose',
  },
  // 전체
  'glass-skin': {
    name: 'Glass Skin',
    nameKo: '글래스 스킨',
    description: 'Perfectly smooth, dewy, translucent "glass skin" look',
    category: 'overall',
  },
  'natural-glow': {
    name: 'Natural Glow',
    nameKo: '자연스러운 광채',
    description: 'Healthy, radiant glow from within',
    category: 'overall',
  },
  'matte-finish': {
    name: 'Matte Finish',
    nameKo: '매트 피부',
    description: 'Oil-free, smooth matte skin finish',
    category: 'overall',
  },
};

export const simulateSkinTreatment = async (
  params: SkinTreatmentParams
): Promise<SimulationResponse> => {
  const { userPhoto, treatmentType } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'API key not configured' };
  }

  try {
    const base64Data = userPhoto.includes('base64,')
      ? userPhoto.split('base64,')[1]
      : userPhoto;

    let mimeType = 'image/jpeg';
    if (userPhoto.includes('data:image/png')) mimeType = 'image/png';
    else if (userPhoto.includes('data:image/webp')) mimeType = 'image/webp';

    const treatmentInfo = treatmentDescriptions[treatmentType];

    const prompt = `You are a professional dermatologist and cosmetic surgeon visualization expert.

TASK: Show what this person would look like after ${treatmentInfo.name} treatment.

TREATMENT DETAILS:
- Treatment: ${treatmentInfo.name}
- Effect: ${treatmentInfo.description}

CRITICAL REQUIREMENTS:
1. ONLY apply the specific treatment mentioned - do not change other features
2. Keep the person RECOGNIZABLE - same overall facial structure and identity
3. The result must look NATURAL and REALISTIC, not over-processed
4. Maintain the same hair, hairstyle, clothing, background
5. Keep the same lighting and image quality
6. The change should look like a real cosmetic treatment result
7. Preserve natural skin texture - don't make it look plastic or artificial

${treatmentInfo.category === 'contour' ?
  'For contouring: Changes should be subtle and natural. Think professional cosmetic procedure, not dramatic surgery.' :
  treatmentInfo.category === 'eyes' ?
  'For eye area: Changes should look like professional treatment results, maintaining natural eye shape and expression.' :
  treatmentInfo.category === 'nose' ?
  'For nose: Changes should be harmonious with the face, maintaining ethnic features while enhancing proportions.' :
  'For skin treatments: Focus on skin quality improvement while maintaining natural skin character.'}

The result should look like a realistic "before/after" cosmetic treatment photo.

Generate the transformed photo now.`;

    console.log(`Simulating skin treatment: ${treatmentInfo.name}...`);

    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
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
      console.error('Skin treatment API error:', response.status, errorText);
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
    console.error('Skin treatment simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const getTreatmentCategories = () => [
  { id: 'texture', name: '피부 질감', nameEn: 'Texture', icon: '✨' },
  { id: 'tone', name: '피부톤', nameEn: 'Tone', icon: '🌟' },
  { id: 'contour', name: '윤곽/볼륨', nameEn: 'Contour', icon: '💉' },
  { id: 'eyes', name: '눈', nameEn: 'Eyes', icon: '👁️' },
  { id: 'nose', name: '코', nameEn: 'Nose', icon: '👃' },
  { id: 'overall', name: '전체 피부', nameEn: 'Overall', icon: '💫' },
];

export const getTreatmentsByCategory = (category: string): SkinTreatmentType[] => {
  return (Object.keys(treatmentDescriptions) as SkinTreatmentType[])
    .filter(key => treatmentDescriptions[key].category === category);
};

export const getTreatmentInfo = (treatmentType: SkinTreatmentType) => treatmentDescriptions[treatmentType];
