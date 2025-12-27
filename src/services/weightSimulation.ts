const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-generation:generateContent';

export type WeightChange = -20 | -15 | -10 | -5 | 0 | 5 | 10 | 15 | 20;
export type WegovyDuration = '1month' | '3months' | '6months' | '12months';

interface WeightSimulationParams {
  userPhoto: string;
  weightChange: WeightChange; // kg 단위 (-20 ~ +20)
  mode?: 'manual' | 'wegovy';
  wegovyDuration?: WegovyDuration;
}

interface WeightSimulationResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

// 위고비(세마글루타이드) 복용 기간별 예상 체중 감량
const getWegovyWeightLoss = (duration: WegovyDuration): { minKg: number; maxKg: number; avgPercent: number } => {
  // 실제 임상시험 데이터 기반 (STEP 1-4 trials)
  // 평균 체중 감량: 12-17% over 68 weeks
  switch (duration) {
    case '1month':
      return { minKg: 2, maxKg: 4, avgPercent: 3 };
    case '3months':
      return { minKg: 5, maxKg: 8, avgPercent: 6 };
    case '6months':
      return { minKg: 8, maxKg: 12, avgPercent: 10 };
    case '12months':
      return { minKg: 12, maxKg: 18, avgPercent: 15 };
  }
};

// 위고비 복용 시 체중 변화 설명
const getWegovyDescription = (duration: WegovyDuration): string => {
  const { minKg, maxKg, avgPercent } = getWegovyWeightLoss(duration);

  const durationText = {
    '1month': '1 month',
    '3months': '3 months',
    '6months': '6 months',
    '12months': '12 months (1 year)',
  }[duration];

  return `Show this person after ${durationText} of Wegovy (semaglutide) GLP-1 weight loss medication treatment.

Based on clinical trial data, expect approximately ${minKg}-${maxKg}kg weight loss (${avgPercent}% of body weight):

Physical changes to show:
- Face: Noticeably slimmer, more defined jawline, visible cheekbones, reduced facial puffiness
- Neck: Thinner and more defined
- Body: Significantly slimmer torso, reduced belly/midsection, slimmer arms
- Overall: Healthy weight loss transformation, more toned appearance
- Skin: May appear slightly looser in areas where fat was lost (natural aging appearance)
- Clothes should appear looser on the body

The transformation should look like realistic GLP-1 medication weight loss results - gradual, natural, and proportional.
This is NOT extreme weight loss but healthy, medically-supervised weight reduction.`;
};

// 체중 변화에 따른 신체 변화 설명 생성
const getWeightChangeDescription = (kg: WeightChange): string => {
  if (kg === 0) return '';

  const isLoss = kg < 0;
  const absKg = Math.abs(kg);

  if (isLoss) {
    // 감량
    if (absKg >= 15) {
      return `Show this person having lost approximately ${absKg}kg of weight.
        - Face: Noticeably slimmer, more defined jawline, visible cheekbones, reduced double chin if present
        - Neck: Thinner and more elongated
        - Body: Significantly slimmer torso, reduced belly, more visible collarbones, slimmer arms
        - Overall: Healthy weight loss transformation, more toned and fit appearance
        - Clothes should appear slightly looser on the body`;
    } else if (absKg >= 10) {
      return `Show this person having lost approximately ${absKg}kg of weight.
        - Face: Slimmer, more defined chin and jawline, slightly more visible cheekbones
        - Neck: Slightly thinner
        - Body: Slimmer torso, reduced belly area, slightly slimmer arms
        - Overall: Noticeable but natural weight loss, healthier appearance`;
    } else {
      return `Show this person having lost approximately ${absKg}kg of weight.
        - Face: Slightly slimmer, subtle improvement in jawline definition
        - Body: Subtly slimmer torso, slightly reduced midsection
        - Overall: Minor but noticeable weight loss, slightly more toned`;
    }
  } else {
    // 증량
    if (absKg >= 15) {
      return `Show this person having gained approximately ${absKg}kg of weight.
        - Face: Fuller and rounder, softer jawline, fuller cheeks, possible double chin
        - Neck: Thicker and fuller
        - Body: Larger torso, expanded belly/midsection, fuller arms, broader appearance
        - Overall: Significant weight gain, clothes would appear tighter
        - Keep the transformation realistic and natural-looking`;
    } else if (absKg >= 10) {
      return `Show this person having gained approximately ${absKg}kg of weight.
        - Face: Noticeably fuller, rounder cheeks, softer chin
        - Neck: Slightly thicker
        - Body: Fuller torso, expanded midsection, slightly larger arms
        - Overall: Noticeable weight gain, realistic appearance`;
    } else {
      return `Show this person having gained approximately ${absKg}kg of weight.
        - Face: Slightly fuller, subtle rounding of features
        - Body: Slightly fuller midsection, subtle overall expansion
        - Overall: Minor but visible weight gain, natural appearance`;
    }
  }
};

export const simulateWeightChange = async (
  params: WeightSimulationParams
): Promise<WeightSimulationResponse> => {
  const { userPhoto, weightChange, mode = 'manual', wegovyDuration } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'API key not configured' };
  }

  // Manual mode: weight change 0 means no change
  if (mode === 'manual' && weightChange === 0) {
    return { success: true, resultImage: userPhoto };
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

    let prompt: string;

    if (mode === 'wegovy' && wegovyDuration) {
      // 위고비 모드
      const wegovyDescription = getWegovyDescription(wegovyDuration);
      const { minKg, maxKg } = getWegovyWeightLoss(wegovyDuration);

      prompt = `You are a professional photo editor specializing in realistic body transformation visualization.

TASK: ${wegovyDescription}

CRITICAL RULES - MUST FOLLOW:
1. PRESERVE IDENTITY: The face must remain recognizable as the SAME person - same eyes, nose, mouth shape, eyebrows, skin tone
2. PRESERVE CONTEXT: Keep the same clothing, background, pose, lighting, and image quality
3. REALISTIC TRANSFORMATION: Show ${minKg}-${maxKg}kg weight loss that looks natural and medically realistic
4. PROPORTIONAL CHANGES: Apply weight changes proportionally across face and visible body parts
5. MAINTAIN QUALITY: Output should be the same resolution and quality as the input
6. NO ARTISTIC CHANGES: Do not change hairstyle, makeup, or any other features except body size/shape
7. GLP-1 SPECIFIC: The weight loss pattern should reflect typical GLP-1 medication results - primarily visceral fat reduction

The result should look like a realistic "before/after" Wegovy weight loss transformation photo of the same person.

Generate the transformed photo now.`;

      console.log(`Simulating Wegovy ${wegovyDuration} weight loss...`);
    } else {
      // 수동 모드
      const weightDescription = getWeightChangeDescription(weightChange);
      const changeType = weightChange < 0 ? 'lost' : 'gained';
      const absKg = Math.abs(weightChange);

      prompt = `You are a professional photo editor specializing in realistic body transformation visualization.

TASK: Show what this person would look like if they ${changeType} ${absKg}kg of weight.

${weightDescription}

CRITICAL RULES - MUST FOLLOW:
1. PRESERVE IDENTITY: The face must remain recognizable as the SAME person - same eyes, nose, mouth shape, eyebrows, skin tone
2. PRESERVE CONTEXT: Keep the same clothing, background, pose, lighting, and image quality
3. REALISTIC TRANSFORMATION: The weight change should look natural and believable, as if months have passed
4. PROPORTIONAL CHANGES: Apply weight changes proportionally across face and visible body parts
5. MAINTAIN QUALITY: Output should be the same resolution and quality as the input
6. NO ARTISTIC CHANGES: Do not change hairstyle, makeup, or any other features except body size/shape

The result should look like a realistic "before/after" weight ${changeType === 'lost' ? 'loss' : 'gain'} photo of the same person.

Generate the transformed photo now.`;

      console.log(`Simulating ${weightChange}kg weight change...`);
    }

    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.error('Weight simulation API error:', response.status, errorText);

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
    console.error('Weight simulation error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: '네트워크 오류입니다. 인터넷 연결을 확인해주세요.' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};
