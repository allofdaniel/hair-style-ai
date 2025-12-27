const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type HairVolumeType =
  | 'volume-up-light' | 'volume-up-medium' | 'volume-up-full'
  | 'thickness-increase'
  | 'hairline-restore' | 'hairline-lower'
  | 'crown-volume'
  | 'thinning-simulation';

interface HairVolumeSimulationParams {
  userPhoto: string;
  volumeType: HairVolumeType;
}

interface SimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const volumeDescriptions: Record<HairVolumeType, { name: string; nameKo: string; description: string }> = {
  'volume-up-light': {
    name: 'Light Volume Boost',
    nameKo: '볼륨 살짝 업',
    description: 'Slightly more volume and body, natural-looking lift at the roots',
  },
  'volume-up-medium': {
    name: 'Medium Volume Boost',
    nameKo: '볼륨 중간 업',
    description: 'Noticeably fuller and more voluminous hair, good lift throughout',
  },
  'volume-up-full': {
    name: 'Full Volume Boost',
    nameKo: '풍성한 볼륨',
    description: 'Dramatically fuller, thicker-looking hair with maximum volume',
  },
  'thickness-increase': {
    name: 'Hair Thickening',
    nameKo: '모발 굵기 증가',
    description: 'Each hair strand appears thicker and more dense, overall fuller appearance',
  },
  'hairline-restore': {
    name: 'Hairline Restoration',
    nameKo: '헤어라인 복원',
    description: 'Restore receding hairline, fill in temples and forehead areas naturally',
  },
  'hairline-lower': {
    name: 'Lower Hairline',
    nameKo: '헤어라인 내리기',
    description: 'Move hairline slightly lower on forehead for younger appearance',
  },
  'crown-volume': {
    name: 'Crown Volume',
    nameKo: '정수리 볼륨',
    description: 'Add volume specifically to the crown/top of head area',
  },
  'thinning-simulation': {
    name: 'Thinning Preview',
    nameKo: '탈모 예상',
    description: 'Preview what hair might look like with thinning (for awareness)',
  },
};

export const simulateHairVolume = async (
  params: HairVolumeSimulationParams
): Promise<SimulationResponse> => {
  const { userPhoto, volumeType } = params;

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

    const volumeInfo = volumeDescriptions[volumeType];

    const prompt = `You are a professional hair restoration and styling visualization expert.

TASK: Modify this person's hair to show ${volumeInfo.name}.

SPECIFIC CHANGES:
${volumeInfo.description}

CRITICAL REQUIREMENTS:
1. ONLY modify the hair volume/density - do NOT change hair color, style shape, or length
2. Keep the EXACT same face - same eyes, nose, mouth, skin, everything
3. The volume change must look natural and realistic
4. Maintain the same hairstyle direction and overall shape
5. Hair texture and shine should remain consistent
6. Keep the same background, lighting, clothing
7. The result should look like a professional hair treatment result

${volumeType === 'hairline-restore' || volumeType === 'hairline-lower'
  ? 'For hairline changes: Add natural-looking hair to fill in the hairline area. The new hair should match the existing hair color, texture, and direction perfectly.'
  : volumeType === 'thinning-simulation'
  ? 'For thinning simulation: Show realistic hair thinning pattern, typically starting at crown and temples. Be subtle and realistic.'
  : 'For volume changes: The hair should appear fuller and more lifted while maintaining natural look.'}

Generate the transformed photo now.`;

    console.log(`Simulating hair volume: ${volumeInfo.name}...`);

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
      console.error('Hair volume API error:', response.status, errorText);
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
    console.error('Hair volume simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const getVolumeOptions = () => [
  { id: 'volume-up-light', icon: '💨', category: 'volume' },
  { id: 'volume-up-medium', icon: '💪', category: 'volume' },
  { id: 'volume-up-full', icon: '🦁', category: 'volume' },
  { id: 'thickness-increase', icon: '📈', category: 'thickness' },
  { id: 'hairline-restore', icon: '🔄', category: 'hairline' },
  { id: 'hairline-lower', icon: '⬇️', category: 'hairline' },
  { id: 'crown-volume', icon: '👑', category: 'volume' },
  { id: 'thinning-simulation', icon: '🔮', category: 'preview' },
];

export const getVolumeInfo = (volumeType: HairVolumeType) => volumeDescriptions[volumeType];
