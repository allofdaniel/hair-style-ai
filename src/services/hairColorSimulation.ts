const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type HairColorType =
  | 'natural-black' | 'natural-brown' | 'natural-chestnut'
  | 'ash-brown' | 'ash-gray' | 'ash-blonde'
  | 'warm-brown' | 'warm-caramel' | 'warm-honey'
  | 'red-burgundy' | 'red-copper' | 'red-wine'
  | 'blonde-platinum' | 'blonde-golden' | 'blonde-beige'
  | 'fantasy-pink' | 'fantasy-purple' | 'fantasy-blue' | 'fantasy-green'
  | 'ombre-dark-to-light' | 'balayage' | 'highlights';

interface HairColorSimulationParams {
  userPhoto: string;
  colorType: HairColorType;
  intensity?: 'subtle' | 'medium' | 'vivid';
}

interface SimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const colorDescriptions: Record<HairColorType, { name: string; description: string }> = {
  'natural-black': { name: 'Natural Black', description: 'Deep, rich black hair color with natural shine' },
  'natural-brown': { name: 'Natural Brown', description: 'Classic medium brown, warm and natural' },
  'natural-chestnut': { name: 'Chestnut Brown', description: 'Rich chestnut brown with reddish undertones' },
  'ash-brown': { name: 'Ash Brown', description: 'Cool-toned brown with gray/ashy undertones, no warmth' },
  'ash-gray': { name: 'Ash Gray', description: 'Trendy gray/silver ash color, cool and sophisticated' },
  'ash-blonde': { name: 'Ash Blonde', description: 'Cool blonde with gray undertones, no yellow/gold' },
  'warm-brown': { name: 'Warm Brown', description: 'Brown with golden/copper undertones' },
  'warm-caramel': { name: 'Caramel', description: 'Rich caramel brown with golden highlights' },
  'warm-honey': { name: 'Honey Blonde', description: 'Warm honey-toned blonde' },
  'red-burgundy': { name: 'Burgundy', description: 'Deep red-purple burgundy wine color' },
  'red-copper': { name: 'Copper', description: 'Vibrant copper/orange-red' },
  'red-wine': { name: 'Wine Red', description: 'Deep wine/maroon red' },
  'blonde-platinum': { name: 'Platinum Blonde', description: 'Very light, almost white blonde' },
  'blonde-golden': { name: 'Golden Blonde', description: 'Warm golden yellow blonde' },
  'blonde-beige': { name: 'Beige Blonde', description: 'Neutral beige-toned blonde' },
  'fantasy-pink': { name: 'Pink', description: 'Vibrant pink or rose pink hair' },
  'fantasy-purple': { name: 'Purple', description: 'Vivid purple or lavender hair' },
  'fantasy-blue': { name: 'Blue', description: 'Bold blue or navy hair' },
  'fantasy-green': { name: 'Green', description: 'Emerald or mint green hair' },
  'ombre-dark-to-light': { name: 'Ombre', description: 'Gradient from dark roots to lighter ends' },
  'balayage': { name: 'Balayage', description: 'Hand-painted natural-looking highlights' },
  'highlights': { name: 'Highlights', description: 'Lighter streaks throughout the hair' },
};

export const simulateHairColor = async (
  params: HairColorSimulationParams
): Promise<SimulationResponse> => {
  const { userPhoto, colorType, intensity = 'medium' } = params;

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

    const colorInfo = colorDescriptions[colorType];
    const intensityDesc = {
      subtle: 'subtle and natural-looking',
      medium: 'noticeable but natural',
      vivid: 'bold and vibrant',
    }[intensity];

    const prompt = `You are a professional hair colorist visualization expert.

TASK: Change this person's hair color to ${colorInfo.name}.

COLOR DETAILS:
- Target Color: ${colorInfo.description}
- Intensity: ${intensityDesc}

CRITICAL REQUIREMENTS:
1. ONLY change the hair color - do NOT alter face, skin, eyes, makeup, or any other features
2. The hair color change must look realistic and professionally done
3. Maintain the exact same hairstyle, hair texture, and hair shape
4. Keep natural hair shine and reflection consistent with the new color
5. The roots and ends should have appropriate color distribution
6. Preserve all facial features EXACTLY - same eyes, nose, mouth, eyebrows, skin tone
7. Keep the same background, lighting, and image quality
8. Hair highlights and shadows should be consistent with the new color

The result should look like this person actually dyed their hair at a professional salon.

Generate the transformed photo now.`;

    console.log(`Simulating hair color: ${colorInfo.name}...`);

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
      console.error('Hair color API error:', response.status, errorText);
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
    console.error('Hair color simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const getColorCategories = () => [
  { id: 'natural', name: '내추럴', nameEn: 'Natural' },
  { id: 'ash', name: '애쉬', nameEn: 'Ash' },
  { id: 'warm', name: '웜톤', nameEn: 'Warm' },
  { id: 'red', name: '레드', nameEn: 'Red' },
  { id: 'blonde', name: '블론드', nameEn: 'Blonde' },
  { id: 'fantasy', name: '판타지', nameEn: 'Fantasy' },
  { id: 'technique', name: '기법', nameEn: 'Technique' },
];

export const getColorsByCategory = (category: string): HairColorType[] => {
  const map: Record<string, HairColorType[]> = {
    natural: ['natural-black', 'natural-brown', 'natural-chestnut'],
    ash: ['ash-brown', 'ash-gray', 'ash-blonde'],
    warm: ['warm-brown', 'warm-caramel', 'warm-honey'],
    red: ['red-burgundy', 'red-copper', 'red-wine'],
    blonde: ['blonde-platinum', 'blonde-golden', 'blonde-beige'],
    fantasy: ['fantasy-pink', 'fantasy-purple', 'fantasy-blue', 'fantasy-green'],
    technique: ['ombre-dark-to-light', 'balayage', 'highlights'],
  };
  return map[category] || [];
};

export const getColorInfo = (colorType: HairColorType) => colorDescriptions[colorType];
