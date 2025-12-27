const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type AgingType =
  | 'younger-5' | 'younger-10' | 'younger-15' | 'younger-20'
  | 'older-5' | 'older-10' | 'older-20' | 'older-30'
  | 'baby' | 'child' | 'teen' | 'elderly';

interface AgingSimulationParams {
  userPhoto: string;
  agingType: AgingType;
}

interface SimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const agingDescriptions: Record<AgingType, { name: string; nameKo: string; description: string; category: string }> = {
  // 젊어지기
  'younger-5': {
    name: '5 Years Younger',
    nameKo: '5살 젊게',
    description: 'Subtle rejuvenation, slightly smoother skin and fresher look',
    category: 'younger',
  },
  'younger-10': {
    name: '10 Years Younger',
    nameKo: '10살 젊게',
    description: 'Noticeable rejuvenation, reduced wrinkles and more youthful features',
    category: 'younger',
  },
  'younger-15': {
    name: '15 Years Younger',
    nameKo: '15살 젊게',
    description: 'Significant rejuvenation, much smoother skin and vibrant appearance',
    category: 'younger',
  },
  'younger-20': {
    name: '20 Years Younger',
    nameKo: '20살 젊게',
    description: 'Major rejuvenation, dramatic reduction in aging signs',
    category: 'younger',
  },
  // 나이들기
  'older-5': {
    name: '5 Years Older',
    nameKo: '5살 나이들게',
    description: 'Subtle aging, slight fine lines and natural progression',
    category: 'older',
  },
  'older-10': {
    name: '10 Years Older',
    nameKo: '10살 나이들게',
    description: 'Noticeable aging, more defined wrinkles and mature features',
    category: 'older',
  },
  'older-20': {
    name: '20 Years Older',
    nameKo: '20살 나이들게',
    description: 'Significant aging, deeper wrinkles and grey hair hints',
    category: 'older',
  },
  'older-30': {
    name: '30 Years Older',
    nameKo: '30살 나이들게',
    description: 'Major aging, elderly appearance with extensive aging signs',
    category: 'older',
  },
  // 특정 나이대
  'baby': {
    name: 'Baby Version',
    nameKo: '아기 버전',
    description: 'What you might have looked like as a baby (fun prediction)',
    category: 'special',
  },
  'child': {
    name: 'Child Version',
    nameKo: '어린이 버전',
    description: 'What you might have looked like as a young child (6-10 years old)',
    category: 'special',
  },
  'teen': {
    name: 'Teenager Version',
    nameKo: '10대 버전',
    description: 'What you might have looked like as a teenager (14-17 years old)',
    category: 'special',
  },
  'elderly': {
    name: 'Elderly Version',
    nameKo: '노년 버전',
    description: 'What you might look like in your 70s-80s',
    category: 'special',
  },
};

export const simulateAging = async (
  params: AgingSimulationParams
): Promise<SimulationResponse> => {
  const { userPhoto, agingType } = params;

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

    const agingInfo = agingDescriptions[agingType];

    let ageInstruction = '';
    if (agingType.startsWith('younger-')) {
      const years = agingType.split('-')[1];
      ageInstruction = `Make this person look ${years} years YOUNGER. Reduce wrinkles, smooth skin, add youthful glow, and make features look fresher and more vibrant.`;
    } else if (agingType.startsWith('older-')) {
      const years = agingType.split('-')[1];
      ageInstruction = `Make this person look ${years} years OLDER. Add appropriate wrinkles, age spots, skin texture changes, potential grey hair, and natural aging progression.`;
    } else if (agingType === 'baby') {
      ageInstruction = `Transform this person into what they might have looked like as a BABY (0-2 years old). Maintain recognizable facial features and characteristics but as an infant.`;
    } else if (agingType === 'child') {
      ageInstruction = `Transform this person into what they might have looked like as a CHILD (6-10 years old). Maintain recognizable facial features but with childhood characteristics.`;
    } else if (agingType === 'teen') {
      ageInstruction = `Transform this person into what they might have looked like as a TEENAGER (14-17 years old). Maintain recognizable features with teenage characteristics.`;
    } else if (agingType === 'elderly') {
      ageInstruction = `Transform this person into what they might look like as ELDERLY (75-85 years old). Add extensive aging signs like deep wrinkles, grey/white hair, age spots, while keeping them recognizable.`;
    }

    const prompt = `You are an expert aging and de-aging visualization specialist.

TASK: ${ageInstruction}

CRITICAL REQUIREMENTS:
1. The person must remain RECOGNIZABLE - same facial structure, same identity
2. Age transformation must look NATURAL and REALISTIC
3. Keep the same hairstyle direction (though color/texture may change with age)
4. Maintain the same ethnicity and fundamental facial features
5. Keep the same clothing, background, and image composition
6. For aging: add wrinkles, skin texture changes, potential grey hair naturally
7. For de-aging: smooth skin, reduce wrinkles, add youthful volume
8. The result should look like a real photo, not artificial or edited

${agingInfo.category === 'special' ?
  'For age transformation to specific life stages: Focus on making this a believable version of the same person at that age. The facial structure and distinctive features should remain recognizable.' :
  'For gradual age changes: Apply changes proportionally to the years specified. Not too subtle, not too dramatic.'}

Generate the age-transformed photo now.`;

    console.log(`Simulating aging: ${agingInfo.name}...`);

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
      console.error('Aging simulation API error:', response.status, errorText);
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
    console.error('Aging simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const getAgingCategories = () => [
  { id: 'younger', name: '젊어지기', nameEn: 'Look Younger', icon: '✨' },
  { id: 'older', name: '나이들기', nameEn: 'Look Older', icon: '👴' },
  { id: 'special', name: '특정 나이대', nameEn: 'Life Stages', icon: '🎭' },
];

export const getAgingByCategory = (category: string): AgingType[] => {
  return (Object.keys(agingDescriptions) as AgingType[])
    .filter(key => agingDescriptions[key].category === category);
};

export const getAgingInfo = (agingType: AgingType) => agingDescriptions[agingType];
