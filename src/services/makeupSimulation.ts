const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type MakeupType =
  // 데일리 룩
  | 'no-makeup' | 'natural-daily' | 'office-look' | 'date-look'
  // 특별한 날
  | 'wedding' | 'party-glam' | 'evening-elegant' | 'red-carpet'
  // 트렌드 룩
  | 'korean-idol' | 'glass-skin' | 'soft-glam' | 'clean-girl'
  // 아이 메이크업
  | 'smoky-eye' | 'cat-eye' | 'puppy-eye' | 'glitter-eye'
  // 립 메이크업
  | 'bold-red' | 'nude-lip' | 'gradient-lip' | 'berry-lip'
  // 컨투어링
  | 'contour-light' | 'contour-dramatic' | 'highlight-glow';

interface MakeupSimulationParams {
  userPhoto: string;
  makeupType: MakeupType;
}

interface SimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const makeupDescriptions: Record<MakeupType, { name: string; nameKo: string; description: string; category: string }> = {
  // 데일리 룩
  'no-makeup': {
    name: 'No Makeup Look',
    nameKo: '노메이크업 룩',
    description: 'Fresh, natural bare-faced look with minimal enhancement',
    category: 'daily',
  },
  'natural-daily': {
    name: 'Natural Daily',
    nameKo: '데일리 내추럴',
    description: 'Light, everyday makeup that enhances natural features',
    category: 'daily',
  },
  'office-look': {
    name: 'Office Look',
    nameKo: '오피스 룩',
    description: 'Professional, polished makeup suitable for workplace',
    category: 'daily',
  },
  'date-look': {
    name: 'Date Look',
    nameKo: '데이트 룩',
    description: 'Romantic, soft makeup perfect for a date',
    category: 'daily',
  },
  // 특별한 날
  'wedding': {
    name: 'Wedding',
    nameKo: '웨딩 메이크업',
    description: 'Elegant bridal makeup with flawless, long-lasting finish',
    category: 'special',
  },
  'party-glam': {
    name: 'Party Glam',
    nameKo: '파티 글램',
    description: 'Bold, glamorous makeup for parties and events',
    category: 'special',
  },
  'evening-elegant': {
    name: 'Evening Elegant',
    nameKo: '이브닝 엘레강스',
    description: 'Sophisticated evening makeup with refined elegance',
    category: 'special',
  },
  'red-carpet': {
    name: 'Red Carpet',
    nameKo: '레드카펫',
    description: 'Celebrity-level glamorous makeup for special occasions',
    category: 'special',
  },
  // 트렌드 룩
  'korean-idol': {
    name: 'K-Idol Look',
    nameKo: 'K-아이돌 룩',
    description: 'Trendy Korean idol-inspired makeup with dewy finish',
    category: 'trend',
  },
  'glass-skin': {
    name: 'Glass Skin',
    nameKo: '글래스 스킨',
    description: 'Ultra-dewy, translucent glass skin effect',
    category: 'trend',
  },
  'soft-glam': {
    name: 'Soft Glam',
    nameKo: '소프트 글램',
    description: 'Subtle glamour with soft, blended tones',
    category: 'trend',
  },
  'clean-girl': {
    name: 'Clean Girl',
    nameKo: '클린걸',
    description: 'Minimal, fresh "I woke up like this" aesthetic',
    category: 'trend',
  },
  // 아이 메이크업
  'smoky-eye': {
    name: 'Smoky Eye',
    nameKo: '스모키 아이',
    description: 'Classic smoky eye with gradient dark to light',
    category: 'eyes',
  },
  'cat-eye': {
    name: 'Cat Eye',
    nameKo: '캣아이',
    description: 'Sharp winged liner for feline look',
    category: 'eyes',
  },
  'puppy-eye': {
    name: 'Puppy Eye',
    nameKo: '강아지눈',
    description: 'Soft, rounded eye makeup for innocent look',
    category: 'eyes',
  },
  'glitter-eye': {
    name: 'Glitter Eye',
    nameKo: '글리터 아이',
    description: 'Sparkly, shimmery eye makeup',
    category: 'eyes',
  },
  // 립 메이크업
  'bold-red': {
    name: 'Bold Red Lip',
    nameKo: '볼드 레드 립',
    description: 'Classic, statement red lipstick',
    category: 'lips',
  },
  'nude-lip': {
    name: 'Nude Lip',
    nameKo: '누드 립',
    description: 'Natural, your-lips-but-better nude shade',
    category: 'lips',
  },
  'gradient-lip': {
    name: 'Gradient Lip',
    nameKo: '그라데이션 립',
    description: 'Korean-style gradient lips with soft edges',
    category: 'lips',
  },
  'berry-lip': {
    name: 'Berry Lip',
    nameKo: '베리 립',
    description: 'Deep berry/plum colored lips',
    category: 'lips',
  },
  // 컨투어링
  'contour-light': {
    name: 'Light Contour',
    nameKo: '라이트 컨투어',
    description: 'Subtle face sculpting for natural definition',
    category: 'contour',
  },
  'contour-dramatic': {
    name: 'Dramatic Contour',
    nameKo: '드라마틱 컨투어',
    description: 'Strong face sculpting for dramatic effect',
    category: 'contour',
  },
  'highlight-glow': {
    name: 'Highlight Glow',
    nameKo: '하이라이트 글로우',
    description: 'Intense highlighter for glowing, dewy look',
    category: 'contour',
  },
};

export const simulateMakeup = async (
  params: MakeupSimulationParams
): Promise<SimulationResponse> => {
  const { userPhoto, makeupType } = params;

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

    const makeupInfo = makeupDescriptions[makeupType];

    const prompt = `You are a professional makeup artist visualization expert.

TASK: Apply ${makeupInfo.name} makeup to this person.

MAKEUP DETAILS:
- Style: ${makeupInfo.name}
- Effect: ${makeupInfo.description}

CRITICAL REQUIREMENTS:
1. ONLY add/change makeup - do NOT alter facial features, bone structure, or face shape
2. Keep the person completely RECOGNIZABLE - same face, same identity
3. The makeup must look REALISTIC and professionally applied
4. Maintain the exact same hair, hairstyle, clothing, and background
5. Keep the same lighting and image quality
6. The makeup should look like it was done by a professional makeup artist
7. Preserve natural skin texture - makeup should enhance, not mask

${makeupInfo.category === 'daily' ?
  'For daily looks: Keep makeup subtle and natural. Focus on enhancing features, not dramatic changes. Think "your face, but better."' :
  makeupInfo.category === 'special' ?
  'For special occasion makeup: More dramatic and polished, but still beautiful and wearable. Think elegant and camera-ready.' :
  makeupInfo.category === 'trend' ?
  'For trend looks: Follow current makeup trends with appropriate techniques. Think influencer-worthy, Instagram-ready.' :
  makeupInfo.category === 'eyes' ?
  'For eye makeup: Focus primarily on eye area transformation. Keep rest of face with complementary natural makeup.' :
  makeupInfo.category === 'lips' ?
  'For lip makeup: Focus primarily on lip color and finish. Keep rest of face with complementary natural makeup.' :
  'For contouring: Focus on face sculpting and dimension. Apply bronzer, contour, and highlight appropriately.'}

The result should look like this person just left a professional makeup artist's chair.

Generate the makeup-applied photo now.`;

    console.log(`Simulating makeup: ${makeupInfo.name}...`);

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
      console.error('Makeup simulation API error:', response.status, errorText);
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
    console.error('Makeup simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const getMakeupCategories = () => [
  { id: 'daily', name: '데일리', nameEn: 'Daily', icon: '☀️' },
  { id: 'special', name: '특별한 날', nameEn: 'Special', icon: '✨' },
  { id: 'trend', name: '트렌드', nameEn: 'Trend', icon: '🔥' },
  { id: 'eyes', name: '아이', nameEn: 'Eyes', icon: '👁️' },
  { id: 'lips', name: '립', nameEn: 'Lips', icon: '💋' },
  { id: 'contour', name: '컨투어', nameEn: 'Contour', icon: '💫' },
];

export const getMakeupByCategory = (category: string): MakeupType[] => {
  return (Object.keys(makeupDescriptions) as MakeupType[])
    .filter(key => makeupDescriptions[key].category === category);
};

export const getMakeupInfo = (makeupType: MakeupType) => makeupDescriptions[makeupType];
