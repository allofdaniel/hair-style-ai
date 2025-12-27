/**
 * Hair Inpainting Service
 *
 * 핵심 원칙: 머리 영역만 마스킹 → 그 부분만 AI가 새로 생성 → 얼굴/몸은 원본 유지
 *
 * 플로우:
 * 1. 얼굴 위치 감지 (Gemini)
 * 2. 머리 영역만 마스크 생성 (얼굴 위쪽 + 양옆)
 * 3. 마스크된 영역만 새 헤어스타일로 인페인팅
 * 4. 결과: 얼굴은 100% 원본, 머리만 새로 생성
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

interface FaceBounds {
  foreheadY: number;  // 이마 시작 위치 (0-1)
  eyeY: number;       // 눈 위치 (0-1)
  faceLeft: number;   // 얼굴 왼쪽 (0-1)
  faceRight: number;  // 얼굴 오른쪽 (0-1)
  faceTop: number;    // 얼굴 상단 (0-1)
  chinY: number;      // 턱 위치 (0-1)
}

/**
 * 메인 함수: 헤어스타일 인페인팅
 */
export async function applyHairInpainting(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, style, settings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    console.log('Step 1: Detecting face bounds...');

    // 1. 얼굴 경계 감지
    const faceBounds = await detectFaceBounds(userPhoto);
    console.log('Face bounds:', faceBounds);

    console.log('Step 2: Creating hair mask...');

    // 2. 머리 영역 마스크 생성
    const { maskedImage } = await createHairMask(userPhoto, faceBounds);

    console.log('Step 3: Inpainting hair area...');

    // 3. 마스크된 영역에 새 헤어스타일 생성
    const result = await inpaintHairArea(userPhoto, maskedImage, style, settings, faceBounds);

    if (!result.success) {
      return result;
    }

    console.log('Inpainting complete!');

    return {
      success: true,
      resultImage: result.image,
    };

  } catch (error) {
    console.error('Hair inpainting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 얼굴 경계 감지
 */
async function detectFaceBounds(imageBase64: string): Promise<FaceBounds> {
  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  const prompt = `Analyze this face photo and return ONLY JSON with precise face boundaries:
{
  "foreheadY": <where forehead skin starts, 0-1, 0=top>,
  "eyeY": <eye level position, 0-1>,
  "faceLeft": <left edge of face, 0-1, 0=left>,
  "faceRight": <right edge of face, 0-1>,
  "faceTop": <top of forehead where skin begins, 0-1>,
  "chinY": <chin bottom position, 0-1>
}

IMPORTANT: foreheadY should be where the actual forehead SKIN starts, NOT where hair starts.
Values are normalized 0-1 relative to image dimensions.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
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
      }
    );

    if (response.ok) {
      const data = await response.json();
      const textPart = data.candidates?.[0]?.content?.parts?.find((p: {text?: string}) => p.text);
      if (textPart?.text) {
        return JSON.parse(textPart.text);
      }
    }
  } catch (error) {
    console.error('Face detection error:', error);
  }

  // 폴백 값
  return {
    foreheadY: 0.25,
    eyeY: 0.35,
    faceLeft: 0.3,
    faceRight: 0.7,
    faceTop: 0.2,
    chinY: 0.7
  };
}

/**
 * 머리 영역 마스크 생성
 * 흰색 = 인페인팅할 영역 (머리)
 * 검은색 = 유지할 영역 (얼굴, 몸)
 */
async function createHairMask(
  imageBase64: string,
  face: FaceBounds
): Promise<{ maskedImage: string; maskImage: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      // 마스크 캔버스
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;

      // 검은색 배경 (유지할 영역)
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, width, height);

      // 흰색으로 머리 영역 그리기
      maskCtx.fillStyle = 'white';

      // 머리 영역 계산
      const foreheadY = face.foreheadY * height;
      const faceLeft = face.faceLeft * width;
      const faceRight = face.faceRight * width;
      const faceWidth = faceRight - faceLeft;
      const faceCenterX = (faceLeft + faceRight) / 2;

      // 1. 이마 위쪽 전체 (머리 상단)
      const hairTop = 0;
      const hairWidth = faceWidth * 1.8; // 얼굴보다 넓게
      const hairLeft = Math.max(0, faceCenterX - hairWidth / 2);
      const hairRight = Math.min(width, faceCenterX + hairWidth / 2);

      // 머리 영역 (이마 위 + 약간의 여유)
      maskCtx.fillRect(hairLeft, hairTop, hairRight - hairLeft, foreheadY + 10);

      // 2. 옆머리 영역 (귀 주변)
      const eyeY = face.eyeY * height;
      const sideHairWidth = faceWidth * 0.4;

      // 왼쪽 옆머리
      maskCtx.fillRect(
        Math.max(0, faceLeft - sideHairWidth),
        0,
        sideHairWidth + 10,
        eyeY
      );

      // 오른쪽 옆머리
      maskCtx.fillRect(
        faceRight - 10,
        0,
        sideHairWidth + 10,
        eyeY
      );

      // 3. 부드러운 경계 (얼굴과 머리 사이)
      const gradient = maskCtx.createLinearGradient(0, foreheadY - 20, 0, foreheadY + 30);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(hairLeft, foreheadY - 20, hairRight - hairLeft, 50);

      // 마스크 이미지
      const maskImage = maskCanvas.toDataURL('image/png');

      // 원본에 마스크 적용 (마스크 영역을 회색으로 표시)
      const maskedCanvas = document.createElement('canvas');
      maskedCanvas.width = width;
      maskedCanvas.height = height;
      const maskedCtx = maskedCanvas.getContext('2d')!;

      // 원본 그리기
      maskedCtx.drawImage(img, 0, 0);

      // 마스크 영역을 반투명하게 표시 (디버깅용)
      maskedCtx.globalCompositeOperation = 'source-over';
      maskedCtx.drawImage(maskCanvas, 0, 0);

      const maskedImage = maskedCanvas.toDataURL('image/png');

      resolve({ maskedImage, maskImage });
    };

    img.src = imageBase64;
  });
}

/**
 * 마스크된 영역에 새 헤어스타일 인페인팅
 */
async function inpaintHairArea(
  originalImage: string,
  _maskedImage: string,
  style: HairStyle,
  settings: HairSettings,
  face: FaceBounds
): Promise<{ success: boolean; image?: string; error?: string }> {
  const base64Data = originalImage.includes('base64,')
    ? originalImage.split('base64,')[1]
    : originalImage;

  let mimeType = 'image/jpeg';
  if (originalImage.includes('data:image/png')) mimeType = 'image/png';

  // 헤어 컬러 프롬프트
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `Hair color: ${colorOption.prompt}.`
    : '';

  // 볼륨 프롬프트
  const volumePrompts: Record<string, string> = {
    flat: 'flat, sleek, low volume',
    natural: 'natural medium volume',
    voluminous: 'high volume, full body',
  };

  // 얼굴 위치 정보를 프롬프트에 포함
  const faceInfo = `
Face position info (DO NOT CHANGE THESE AREAS):
- Forehead starts at ${Math.round(face.foreheadY * 100)}% from top
- Eyes are at ${Math.round(face.eyeY * 100)}% from top
- Face is between ${Math.round(face.faceLeft * 100)}% and ${Math.round(face.faceRight * 100)}% horizontally
`;

  const prompt = `TASK: Change ONLY the hair to "${style.name}" (${style.nameKo}) hairstyle.

${style.prompt}
${colorPrompt}
Volume: ${volumePrompts[settings.volume]}

${faceInfo}

ABSOLUTE RULES - VIOLATION IS FAILURE:
1. The person's FACE must be PIXEL-PERFECT identical - same eyes, eyebrows, nose, mouth, skin texture, wrinkles, moles
2. The person's SKIN TONE must not change at all
3. The person's EARS, NECK, SHOULDERS, CLOTHES must remain exactly the same
4. The BACKGROUND must remain exactly the same
5. ONLY the HAIR above the forehead and on the sides should change
6. The new hairstyle should look natural and professionally styled
7. Keep the same lighting and photo quality

Generate the image with ONLY the hair changed to the new style.`;

  try {
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
          temperature: 0.2, // 낮은 온도로 더 일관된 결과
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
      console.error('Gemini error:', response.status, errorText);

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

      // 생성된 이미지와 원본을 합성 (얼굴 영역은 원본 사용)
      const finalImage = await blendGeneratedWithOriginal(originalImage, generatedImage, face);

      return {
        success: true,
        image: finalImage,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Inpainting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Inpainting failed',
    };
  }
}

/**
 * 생성된 이미지의 머리 부분만 가져오고, 얼굴은 원본 사용
 */
async function blendGeneratedWithOriginal(
  originalImage: string,
  generatedImage: string,
  face: FaceBounds
): Promise<string> {
  return new Promise((resolve) => {
    const original = new Image();
    const generated = new Image();
    let loadCount = 0;

    const onBothLoaded = () => {
      loadCount++;
      if (loadCount < 2) return;

      const width = original.width;
      const height = original.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // 1. 원본 이미지를 베이스로 (얼굴 보존!)
      ctx.drawImage(original, 0, 0);

      // 2. 생성된 이미지에서 머리 영역만 가져오기
      const foreheadY = face.foreheadY * height;
      const faceLeft = face.faceLeft * width;
      const faceRight = face.faceRight * width;
      const faceWidth = faceRight - faceLeft;
      const faceCenterX = (faceLeft + faceRight) / 2;

      // 머리 영역 계산
      const hairWidth = faceWidth * 1.8;
      const hairLeft = Math.max(0, faceCenterX - hairWidth / 2);
      const hairRight = Math.min(width, faceCenterX + hairWidth / 2);

      // 생성된 이미지에서 머리 부분만 복사
      // 그라데이션 마스크로 부드럽게 블렌딩

      // 임시 캔버스에서 생성된 이미지의 머리 부분 추출
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d')!;

      // 생성된 이미지 그리기
      tempCtx.drawImage(generated, 0, 0, width, height);

      // 머리 영역만 마스킹
      tempCtx.globalCompositeOperation = 'destination-in';

      // 그라데이션 마스크 생성
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;

      // 머리 영역 (위에서 이마까지)
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(hairLeft, 0, hairRight - hairLeft, foreheadY - 10);

      // 부드러운 그라데이션 경계
      const gradient = maskCtx.createLinearGradient(0, foreheadY - 30, 0, foreheadY + 20);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'transparent');
      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(hairLeft, foreheadY - 30, hairRight - hairLeft, 50);

      // 옆머리 영역
      const eyeY = face.eyeY * height;
      const sideGradientL = maskCtx.createLinearGradient(faceLeft - 20, 0, faceLeft + 30, 0);
      sideGradientL.addColorStop(0, 'white');
      sideGradientL.addColorStop(1, 'transparent');
      maskCtx.fillStyle = sideGradientL;
      maskCtx.fillRect(0, 0, faceLeft + 30, eyeY);

      const sideGradientR = maskCtx.createLinearGradient(faceRight + 20, 0, faceRight - 30, 0);
      sideGradientR.addColorStop(0, 'white');
      sideGradientR.addColorStop(1, 'transparent');
      maskCtx.fillStyle = sideGradientR;
      maskCtx.fillRect(faceRight - 30, 0, width - faceRight + 30, eyeY);

      tempCtx.drawImage(maskCanvas, 0, 0);

      // 3. 블렌딩된 머리 부분을 원본 위에 올리기
      ctx.drawImage(tempCanvas, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    original.onload = onBothLoaded;
    generated.onload = onBothLoaded;

    original.src = originalImage;
    generated.src = generatedImage;
  });
}

/**
 * 레퍼런스 사진에서 헤어스타일 인페인팅
 */
export async function applyReferenceInpainting(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, referencePhoto, settings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    console.log('Step 1: Detecting face bounds...');
    const faceBounds = await detectFaceBounds(userPhoto);

    console.log('Step 2: Analyzing reference hairstyle...');

    console.log('Step 3: Inpainting with reference...');
    const result = await inpaintWithReference(userPhoto, referencePhoto, settings, faceBounds);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      resultImage: result.image,
    };

  } catch (error) {
    console.error('Reference inpainting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 레퍼런스 이미지를 참고하여 인페인팅
 */
async function inpaintWithReference(
  userPhoto: string,
  referencePhoto: string,
  settings: HairSettings,
  face: FaceBounds
): Promise<{ success: boolean; image?: string; error?: string }> {
  const userBase64 = userPhoto.includes('base64,') ? userPhoto.split('base64,')[1] : userPhoto;
  const refBase64 = referencePhoto.includes('base64,') ? referencePhoto.split('base64,')[1] : referencePhoto;

  let userMime = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) userMime = 'image/png';

  let refMime = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) refMime = 'image/png';

  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `Apply this hair color: ${colorOption.prompt}.`
    : '';

  const prompt = `TASK: Copy the HAIRSTYLE from the second image onto the person in the first image.

${colorPrompt}

ABSOLUTE RULES:
1. First image = the person whose face must remain EXACTLY the same
2. Second image = the hairstyle reference to copy
3. The person's FACE, SKIN, EYES, NOSE, MOUTH must be PIXEL-PERFECT identical to the first image
4. Only change the HAIR to match the reference hairstyle
5. Keep the same background, lighting, and photo quality
6. The person must still be 100% recognizable as the same person

Generate the image with the reference hairstyle applied while keeping the face identical.`;

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

      // 생성된 이미지와 원본 블렌딩 (얼굴 보존)
      const finalImage = await blendGeneratedWithOriginal(userPhoto, generatedImage, face);

      return {
        success: true,
        image: finalImage,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Reference inpainting error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
