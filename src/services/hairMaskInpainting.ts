/**
 * Hair Mask Inpainting Service
 *
 * 핵심 원칙:
 * 1. Gemini로 머리 영역 정확히 감지 → 마스크 생성
 * 2. 마스크 이미지를 Gemini에게 보여주고 "흰색 영역만 새 헤어스타일로 변경"
 * 3. 얼굴/몸/배경은 절대 변경 안 함
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

/**
 * 메인 함수: 마스크 기반 헤어스타일 변경
 * 사용자가 확인한 마스크를 사용 (confirmedMask)
 */
export async function applyHairWithMask(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  confirmedMask?: string;  // 사용자가 확인한 마스크
}): Promise<GenerateResult> {
  const { userPhoto, style, settings, confirmedMask } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    let maskToUse = confirmedMask;

    // 사용자가 확인한 마스크가 없으면 새로 생성
    if (!maskToUse) {
      console.log('Step 1: Creating hair mask with Gemini...');
      const maskResult = await createHairMaskWithGemini(userPhoto);
      if (!maskResult.success || !maskResult.mask) {
        console.log('Gemini mask failed, using fallback');
        const fallbackMask = await createFallbackMask(userPhoto);
        if (!fallbackMask) {
          return { success: false, error: 'Failed to create hair mask' };
        }
        maskToUse = fallbackMask;
      } else {
        maskToUse = maskResult.mask;
      }
    } else {
      console.log('Using user-confirmed mask');
    }

    console.log('Step 2: Generating new hairstyle with mask...');

    // 마스크를 사용해서 헤어스타일 변경
    return await generateWithMask(userPhoto, maskToUse, style, settings);

  } catch (error) {
    console.error('Hair mask inpainting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gemini로 머리 영역 마스크 생성
 * 흰색 = 머리 (변경할 영역)
 * 검은색 = 얼굴/몸/배경 (유지할 영역)
 */
async function createHairMaskWithGemini(imageBase64: string): Promise<{ success: boolean; mask?: string }> {
  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  // Gemini에게 머리 영역의 정확한 좌표 요청
  const prompt = `Analyze this photo and identify the HAIR region precisely.

Return ONLY a JSON object with these coordinates (values 0-1, where 0=top/left, 1=bottom/right):

{
  "hairRegions": [
    {
      "type": "top",
      "top": <number>,
      "bottom": <number>,
      "left": <number>,
      "right": <number>
    }
  ],
  "faceRegion": {
    "top": <forehead skin start>,
    "bottom": <chin>,
    "left": <left cheek>,
    "right": <right cheek>
  },
  "eyeLevel": <y position of eyes, 0-1>
}

IMPORTANT:
- Include ALL hair areas (top of head, sides, bangs if any)
- faceRegion.top should be where forehead SKIN begins, not where hair starts
- Be precise - we need to mask ONLY the hair, not the face`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini mask API error:', response.status);
      return { success: false };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: {text?: string}) => p.text);

    if (!textPart?.text) {
      return { success: false };
    }

    const hairData = JSON.parse(textPart.text);
    console.log('Hair data from Gemini:', hairData);

    // 마스크 이미지 생성
    const mask = await createMaskFromHairData(imageBase64, hairData);
    return { success: true, mask };

  } catch (error) {
    console.error('Gemini mask creation error:', error);
    return { success: false };
  }
}

/**
 * Gemini 응답을 기반으로 마스크 이미지 생성
 */
async function createMaskFromHairData(
  imageBase64: string,
  hairData: {
    hairRegions?: Array<{ type: string; top: number; bottom: number; left: number; right: number }>;
    faceRegion: { top: number; bottom: number; left: number; right: number };
    eyeLevel: number;
  }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // 검은색 배경 (유지할 영역)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      const face = hairData.faceRegion;
      const faceTop = face.top * height;
      const faceLeft = face.left * width;
      const faceRight = face.right * width;
      const faceWidth = faceRight - faceLeft;
      const faceCenterX = (faceLeft + faceRight) / 2;
      const eyeY = hairData.eyeLevel * height;

      // 흰색으로 머리 영역 그리기
      ctx.fillStyle = 'white';

      // 1. 머리 상단 (이마 위 전체)
      const hairWidth = faceWidth * 2;
      const hairLeft = Math.max(0, faceCenterX - hairWidth / 2);
      const hairRight = Math.min(width, faceCenterX + hairWidth / 2);

      // 둥근 머리 모양으로 그리기
      ctx.beginPath();
      ctx.ellipse(
        faceCenterX,
        faceTop * 0.6,
        hairWidth / 2,
        faceTop * 0.8,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // 2. 옆머리 (귀 주변, 눈 높이까지)
      const sideWidth = faceWidth * 0.5;

      // 왼쪽 옆머리
      ctx.fillRect(
        Math.max(0, faceLeft - sideWidth),
        0,
        sideWidth,
        eyeY
      );

      // 오른쪽 옆머리
      ctx.fillRect(
        faceRight,
        0,
        sideWidth,
        eyeY
      );

      // 3. 얼굴 영역은 검은색으로 확실히 보호
      ctx.fillStyle = 'black';

      // 얼굴 영역 (이마 피부부터 턱까지) - 타원형으로
      ctx.beginPath();
      const faceCenterY = (faceTop + face.bottom * height) / 2;
      const faceHeightHalf = (face.bottom * height - faceTop) / 2;
      ctx.ellipse(
        faceCenterX,
        faceCenterY,
        faceWidth / 2 * 0.9,
        faceHeightHalf,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // 4. 부드러운 경계 (머리-얼굴 사이)
      // 이마 라인에 그라데이션 적용
      const gradient = ctx.createLinearGradient(0, faceTop - 30, 0, faceTop + 10);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      ctx.fillStyle = gradient;
      ctx.fillRect(hairLeft, faceTop - 30, hairRight - hairLeft, 40);

      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imageBase64;
  });
}

/**
 * 폴백 마스크 생성 (Gemini 실패 시)
 */
async function createFallbackMask(imageBase64: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // 검은색 배경
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // 상단 30%를 머리로 가정
      ctx.fillStyle = 'white';
      const hairHeight = height * 0.3;

      // 타원형 머리 모양
      ctx.beginPath();
      ctx.ellipse(width / 2, hairHeight / 2, width * 0.4, hairHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // 그라데이션 경계
      const gradient = ctx.createLinearGradient(0, hairHeight - 20, 0, hairHeight + 30);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      ctx.fillStyle = gradient;
      ctx.fillRect(width * 0.1, hairHeight - 20, width * 0.8, 50);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(null);
    img.src = imageBase64;
  });
}

/**
 * 마스크를 사용해서 Gemini에게 헤어스타일 변경 요청
 */
async function generateWithMask(
  originalImage: string,
  maskImage: string,
  style: HairStyle,
  settings: HairSettings
): Promise<GenerateResult> {
  const origBase64 = originalImage.includes('base64,')
    ? originalImage.split('base64,')[1]
    : originalImage;

  const maskBase64 = maskImage.includes('base64,')
    ? maskImage.split('base64,')[1]
    : maskImage;

  let mimeType = 'image/jpeg';
  if (originalImage.includes('data:image/png')) mimeType = 'image/png';

  // 헤어 컬러
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `Hair color: ${colorOption.prompt}.`
    : '';

  // 볼륨
  const volumePrompts: Record<string, string> = {
    flat: 'flat, sleek, low volume',
    natural: 'natural medium volume',
    voluminous: 'high volume, full body',
  };

  const prompt = `I'm sending you TWO images:
1. FIRST IMAGE: Original photo of a person
2. SECOND IMAGE: A mask where WHITE = hair area, BLACK = face/body/background

YOUR TASK: Change ONLY the WHITE (hair) area to this hairstyle: "${style.name}" (${style.nameKo})

Hairstyle details:
- ${style.prompt}
- ${colorPrompt}
- Volume: ${volumePrompts[settings.volume]}

ABSOLUTE RULES:
1. The BLACK areas (face, body, background) must be PIXEL-PERFECT IDENTICAL to the original
2. ONLY modify pixels in the WHITE area (hair)
3. The new hair should blend naturally with the unchanged face
4. Keep the same lighting, shadows, and photo quality
5. The person must be 100% recognizable - same face, same features

Generate the result image.`;

  try {
    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: origBase64 } },
            { inlineData: { mimeType: 'image/png', data: maskBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          temperature: 0.2,
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
      console.error('Gemini generation error:', response.status, errorText);

      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait.' };
      }

      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    if (data.promptFeedback?.blockReason) {
      return { success: false, error: 'Request blocked by safety filters.' };
    }

    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'No image generated' };
    }

    if (candidates[0].finishReason === 'SAFETY') {
      return { success: false, error: 'Image blocked by safety filters.' };
    }

    const parts = candidates[0].content?.parts;
    const imagePart = parts?.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);

    if (imagePart?.inlineData) {
      const generatedImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // 추가 안전장치: 생성된 이미지에서 얼굴 영역은 원본으로 덮어쓰기
      const finalImage = await ensureFacePreserved(originalImage, generatedImage, maskImage);

      return {
        success: true,
        resultImage: finalImage,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * 최종 안전장치: 마스크의 검은색 영역(얼굴)은 반드시 원본 픽셀 사용
 */
async function ensureFacePreserved(
  originalImage: string,
  generatedImage: string,
  maskImage: string
): Promise<string> {
  return new Promise((resolve) => {
    const original = new Image();
    const generated = new Image();
    const mask = new Image();
    let loadCount = 0;

    const onAllLoaded = () => {
      loadCount++;
      if (loadCount < 3) return;

      const width = original.width;
      const height = original.height;

      // 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // 원본, 생성, 마스크 픽셀 데이터 가져오기
      const origCanvas = document.createElement('canvas');
      origCanvas.width = width;
      origCanvas.height = height;
      const origCtx = origCanvas.getContext('2d')!;
      origCtx.drawImage(original, 0, 0, width, height);
      const origData = origCtx.getImageData(0, 0, width, height);

      const genCanvas = document.createElement('canvas');
      genCanvas.width = width;
      genCanvas.height = height;
      const genCtx = genCanvas.getContext('2d')!;
      genCtx.drawImage(generated, 0, 0, width, height);
      const genData = genCtx.getImageData(0, 0, width, height);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;
      maskCtx.drawImage(mask, 0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      // 결과 데이터
      const resultData = ctx.createImageData(width, height);

      // 픽셀별 합성
      for (let i = 0; i < resultData.data.length; i += 4) {
        const maskValue = maskData.data[i]; // R 채널 (0=검은색=얼굴, 255=흰색=머리)

        if (maskValue > 200) {
          // 흰색 영역 (머리) = 생성된 이미지 사용
          resultData.data[i] = genData.data[i];
          resultData.data[i + 1] = genData.data[i + 1];
          resultData.data[i + 2] = genData.data[i + 2];
          resultData.data[i + 3] = 255;
        } else if (maskValue < 50) {
          // 검은색 영역 (얼굴) = 원본 이미지 사용 (절대 변경 안 함!)
          resultData.data[i] = origData.data[i];
          resultData.data[i + 1] = origData.data[i + 1];
          resultData.data[i + 2] = origData.data[i + 2];
          resultData.data[i + 3] = 255;
        } else {
          // 중간 영역 (경계) = 블렌딩
          const alpha = maskValue / 255;
          resultData.data[i] = Math.round(origData.data[i] * (1 - alpha) + genData.data[i] * alpha);
          resultData.data[i + 1] = Math.round(origData.data[i + 1] * (1 - alpha) + genData.data[i + 1] * alpha);
          resultData.data[i + 2] = Math.round(origData.data[i + 2] * (1 - alpha) + genData.data[i + 2] * alpha);
          resultData.data[i + 3] = 255;
        }
      }

      ctx.putImageData(resultData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    original.onload = onAllLoaded;
    generated.onload = onAllLoaded;
    mask.onload = onAllLoaded;

    original.src = originalImage;
    generated.src = generatedImage;
    mask.src = maskImage;
  });
}

/**
 * 레퍼런스 사진으로 헤어스타일 변경
 * 사용자가 확인한 마스크를 사용 (confirmedMask)
 */
export async function applyReferenceWithMask(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
  confirmedMask?: string;  // 사용자가 확인한 마스크
}): Promise<GenerateResult> {
  const { userPhoto, referencePhoto, settings, confirmedMask } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    let mask: string | undefined = confirmedMask;

    // 사용자가 확인한 마스크가 없으면 새로 생성
    if (!mask) {
      console.log('Step 1: Creating hair mask...');
      const maskResult = await createHairMaskWithGemini(userPhoto);
      if (maskResult.success && maskResult.mask) {
        mask = maskResult.mask;
      } else {
        const fallback = await createFallbackMask(userPhoto);
        mask = fallback || undefined;
      }
    } else {
      console.log('Using user-confirmed mask');
    }

    if (!mask) {
      return { success: false, error: 'Failed to create hair mask' };
    }

    console.log('Step 2: Generating with reference...');

    return await generateWithReferenceAndMask(userPhoto, referencePhoto, mask, settings);

  } catch (error) {
    console.error('Reference mask inpainting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 마스크와 레퍼런스를 사용해서 헤어스타일 변경
 */
async function generateWithReferenceAndMask(
  userPhoto: string,
  referencePhoto: string,
  maskImage: string,
  settings: HairSettings
): Promise<GenerateResult> {
  const userBase64 = userPhoto.includes('base64,') ? userPhoto.split('base64,')[1] : userPhoto;
  const refBase64 = referencePhoto.includes('base64,') ? referencePhoto.split('base64,')[1] : referencePhoto;
  const maskBase64 = maskImage.includes('base64,') ? maskImage.split('base64,')[1] : maskImage;

  let userMime = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) userMime = 'image/png';

  let refMime = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) refMime = 'image/png';

  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `Apply this hair color: ${colorOption.prompt}.`
    : '';

  const prompt = `I'm sending you THREE images:
1. FIRST IMAGE: Original photo of a person
2. SECOND IMAGE: Reference photo with the hairstyle to copy
3. THIRD IMAGE: A mask where WHITE = hair area to change, BLACK = face/body to preserve

YOUR TASK: Copy the hairstyle from the SECOND image onto the FIRST image, but ONLY in the WHITE mask area.

${colorPrompt}

ABSOLUTE RULES:
1. The BLACK areas (face, body, background) must be PIXEL-PERFECT IDENTICAL to the first image
2. ONLY modify pixels in the WHITE area (hair)
3. Copy the hairstyle (shape, style, texture) from the reference photo
4. The person must remain 100% recognizable

Generate the result image.`;

  try {
    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: userMime, data: userBase64 } },
            { inlineData: { mimeType: refMime, data: refBase64 } },
            { inlineData: { mimeType: 'image/png', data: maskBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          temperature: 0.2,
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
      console.error('Gemini reference error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);

    if (imagePart?.inlineData) {
      const generatedImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // 얼굴 보존 최종 확인
      const finalImage = await ensureFacePreserved(userPhoto, generatedImage, maskImage);

      return {
        success: true,
        resultImage: finalImage,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Reference generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
