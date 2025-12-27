const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateImage';

export type FitnessLevel = 'light' | 'moderate' | 'athletic' | 'bodybuilder';
export type FitnessDuration = '3months' | '6months' | '1year' | '2years';

interface FitnessSimulationParams {
  userPhoto: string;
  fitnessLevel: FitnessLevel;
  duration: FitnessDuration;
  gender: 'male' | 'female';
}

interface FitnessSimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

// 운동 강도에 따른 신체 변화 설명
const getFitnessDescription = (
  level: FitnessLevel,
  duration: FitnessDuration,
  gender: 'male' | 'female'
): string => {
  const isMale = gender === 'male';

  const durationMonths = {
    '3months': 3,
    '6months': 6,
    '1year': 12,
    '2years': 24,
  }[duration];

  const levelDescriptions = {
    light: {
      male: `After ${durationMonths} months of light exercise (walking, light jogging, basic home workouts):
        - Face: Slightly slimmer, more defined jawline
        - Body: Modest fat reduction, slightly improved posture
        - Arms: Minimal muscle definition, leaner appearance
        - Core: Slightly flatter stomach, reduced belly fat
        - Overall: Healthier, more energetic appearance, subtle toning`,
      female: `After ${durationMonths} months of light exercise (yoga, walking, light cardio):
        - Face: Slightly slimmer, natural glow
        - Body: Gentle toning, improved posture
        - Arms: Leaner, slightly toned
        - Core: Flatter stomach, reduced bloating
        - Overall: Healthier appearance, subtle definition`,
    },
    moderate: {
      male: `After ${durationMonths} months of moderate exercise (gym 3-4x/week, weight training):
        - Face: Noticeably leaner, stronger jawline
        - Shoulders: Broader, more defined deltoids
        - Arms: Visible bicep and tricep definition
        - Chest: Fuller, more developed pectorals
        - Core: Visible ab definition starting to show, V-taper forming
        - Overall: Athletic build, noticeable muscle mass increase`,
      female: `After ${durationMonths} months of moderate exercise (gym, pilates, strength training):
        - Face: Leaner, healthy complexion
        - Arms: Toned biceps and triceps, defined shoulders
        - Body: Hourglass shape more defined, toned waist
        - Legs: Toned thighs and calves
        - Core: Flat stomach with light ab visibility
        - Overall: Fit, toned athletic appearance`,
    },
    athletic: {
      male: `After ${durationMonths} months of intense athletic training (daily workouts, sports):
        - Face: Very lean, chiseled jawline
        - Shoulders: Wide, capped deltoids
        - Arms: Well-defined biceps, triceps, and forearms
        - Chest: Full, striated pectorals
        - Core: Clear six-pack abs, oblique definition, prominent V-taper
        - Legs: Muscular quads and calves
        - Overall: Athlete physique, low body fat, high muscle definition`,
      female: `After ${durationMonths} months of intense athletic training:
        - Face: Very lean, defined features
        - Arms: Sculpted, visible muscle separation
        - Shoulders: Capped, athletic deltoids
        - Core: Visible abs, tight waist
        - Legs: Toned, athletic thighs and glutes
        - Overall: Fitness model physique, lean and strong`,
    },
    bodybuilder: {
      male: `After ${durationMonths} months of bodybuilding (heavy lifting, strict diet, supplements):
        - Face: Extremely lean, vascular
        - Shoulders: Massive, 3D deltoids
        - Arms: Huge biceps (18"+), horseshoe triceps, vascular forearms
        - Chest: Thick, full pecs with clear separation
        - Core: Shredded six-pack, deep cuts, tiny waist
        - Back: Wide lats, Christmas tree lower back
        - Legs: Massive quads, defined hamstrings, diamond calves
        - Overall: Competitive bodybuilder physique, extreme muscle mass`,
      female: `After ${durationMonths} months of bodybuilding/fitness competition prep:
        - Face: Very lean, defined
        - Shoulders: Capped, striated deltoids
        - Arms: Defined biceps and triceps, vascular
        - Core: Shredded abs, tight waist
        - Glutes: Round, developed, competition-ready
        - Legs: Defined quads, hamstrings, calves
        - Overall: Fitness competition physique, very low body fat`,
    },
  };

  return levelDescriptions[level][isMale ? 'male' : 'female'];
};

export const simulateFitness = async (
  params: FitnessSimulationParams
): Promise<FitnessSimulationResponse> => {
  const { userPhoto, fitnessLevel, duration, gender } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'API key not configured' };
  }

  try {
    const base64Data = userPhoto.includes('base64,')
      ? userPhoto.split('base64,')[1]
      : userPhoto;

    let mimeType = 'image/jpeg';
    if (userPhoto.includes('data:image/png')) {
      mimeType = 'image/png';
    } else if (userPhoto.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }

    const fitnessDescription = getFitnessDescription(fitnessLevel, duration, gender);
    const durationText = {
      '3months': '3 months',
      '6months': '6 months',
      '1year': '1 year',
      '2years': '2 years',
    }[duration];

    const prompt = `You are a professional fitness transformation photo editor.

TASK: Show what this person would look like after ${durationText} of dedicated fitness training.

${fitnessDescription}

CRITICAL RULES - MUST FOLLOW:
1. PRESERVE IDENTITY: The face must remain recognizable as the SAME person - same eyes, nose, mouth shape, eyebrows, skin tone, ethnicity
2. PRESERVE CONTEXT: Keep the same clothing style (but it may fit differently), background, pose, lighting
3. REALISTIC TRANSFORMATION: The muscle gain and fat loss should look natural and achievable for the timeframe
4. PROPORTIONAL CHANGES: Apply fitness changes proportionally - don't make any single body part unrealistically large
5. MAINTAIN QUALITY: Output should be the same resolution and quality as the input
6. SKIN QUALITY: Skin should look healthier, possibly slightly tanned from outdoor activity
7. POSTURE: Improved posture showing confidence
8. NO CLOTHING REMOVAL: Keep the same amount of clothing coverage

The result should look like a realistic "before/after" fitness transformation photo of the same person.

Generate the transformed photo now.`;

    console.log(`Simulating ${fitnessLevel} fitness for ${durationText}...`);

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
      console.error('Fitness simulation API error:', response.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 429) {
          return { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
        }
        if (errorJson.error?.message?.includes('safety')) {
          return { success: false, error: '안전 필터에 의해 차단되었습니다. 다른 사진을 시도해주세요.' };
        }
        return { success: false, error: `API 오류: ${errorJson.error?.message || response.status}` };
      } catch {
        return { success: false, error: `API 오류: ${response.status}` };
      }
    }

    const data = await response.json();

    if (data.promptFeedback?.blockReason) {
      return { success: false, error: '요청이 안전 필터에 의해 차단되었습니다.' };
    }

    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'AI가 이미지를 생성하지 못했습니다. 다시 시도해주세요.' };
    }

    if (candidates[0].finishReason === 'SAFETY') {
      return { success: false, error: '안전 필터에 의해 차단되었습니다.' };
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return { success: false, error: '생성된 콘텐츠가 없습니다. 다시 시도해주세요.' };
    }

    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);
    if (imagePart?.inlineData) {
      return {
        success: true,
        resultImage: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      };
    }

    const textPart = parts.find((part: { text?: string }) => part.text);
    if (textPart?.text) {
      console.log('Model text response:', textPart.text);
      return { success: false, error: 'AI가 이미지를 생성하지 못했습니다. 다른 사진을 시도해주세요.' };
    }

    return { success: false, error: '예기치 않은 응답입니다. 다시 시도해주세요.' };

  } catch (error) {
    console.error('Fitness simulation error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: '네트워크 오류입니다. 인터넷 연결을 확인해주세요.' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};
