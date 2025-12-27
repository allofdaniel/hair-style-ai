/**
 * Hair Extract & Overlay Service
 *
 * 핵심 원칙: 원본 사진은 절대 재생성하지 않음!
 *
 * 플로우:
 * 1. 레퍼런스 이미지에서 머리카락만 추출 (배경 제거)
 * 2. 사용자 사진에서 얼굴 위치 감지
 * 3. 추출한 머리카락을 사용자 얼굴 위치에 맞게 조정
 * 4. 원본 사진 위에 머리카락만 오버레이
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

interface FacePosition {
  x: number;      // center x (0-1)
  y: number;      // center y (0-1)
  width: number;  // face width (0-1)
  height: number; // face height (0-1)
  foreheadY: number; // forehead top position (0-1)
}

/**
 * 메인 함수: 헤어스타일 적용 (원본 유지)
 */
export async function applyHairStyleOverlay(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, style } = params;

  if (!style.thumbnail) {
    return { success: false, error: 'No reference image for this style' };
  }

  try {
    console.log('Step 1: Detecting face positions...');

    // 1. 두 이미지에서 얼굴 위치 감지
    const [userFace, refFace] = await Promise.all([
      detectFacePosition(userPhoto),
      detectFacePositionFromUrl(style.thumbnail)
    ]);

    if (!userFace.success || !userFace.face) {
      return { success: false, error: 'Could not detect face in your photo' };
    }

    console.log('User face detected:', userFace.face);
    console.log('Reference face detected:', refFace.face);

    console.log('Step 2: Extracting hair from reference...');

    // 2. 레퍼런스에서 머리카락 추출
    const hairExtract = await extractHairFromReference(style.thumbnail);
    if (!hairExtract.success || !hairExtract.hairImage) {
      return { success: false, error: 'Could not extract hair from reference' };
    }

    console.log('Hair extracted successfully');
    console.log('Step 3: Overlaying hair onto original...');

    // 3. 원본 위에 머리카락 오버레이
    const result = await overlayHairOnPhoto(
      userPhoto,
      hairExtract.hairImage,
      userFace.face,
      refFace.face
    );

    console.log('Overlay complete!');

    return {
      success: true,
      resultImage: result,
    };

  } catch (error) {
    console.error('Hair overlay error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 레퍼런스 URL에서 머리카락 추출
 */
async function extractHairFromReference(imageUrl: string): Promise<{ success: boolean; hairImage?: string; error?: string }> {
  try {
    // URL에서 이미지 로드
    const imageBase64 = await loadImageAsBase64(imageUrl);
    if (!imageBase64) {
      return { success: false, error: 'Failed to load reference image' };
    }

    // Gemini로 머리카락 마스크 생성
    const maskResult = await createHairMaskFromImage(imageBase64);
    if (!maskResult.success || !maskResult.mask) {
      // 폴백: 상단 부분을 머리카락으로 간주
      console.log('Using fallback hair extraction');
      return await extractHairFallback(imageBase64);
    }

    // 마스크를 사용해서 머리카락만 추출
    const hairOnly = await applyMaskToExtractHair(imageBase64, maskResult.mask);

    return { success: true, hairImage: hairOnly };

  } catch (error) {
    console.error('Hair extraction error:', error);
    return { success: false, error: 'Failed to extract hair' };
  }
}

/**
 * URL에서 이미지를 base64로 로드
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      console.error('Failed to load image from URL:', url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Gemini로 머리카락 마스크 생성
 */
async function createHairMaskFromImage(imageBase64: string): Promise<{ success: boolean; mask?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false };
  }

  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  const prompt = `Analyze this image and return a JSON object with hair region coordinates.

Return ONLY JSON:
{
  "hairTop": <top of hair, 0-1>,
  "hairBottom": <bottom of hair where it meets forehead/face, 0-1>,
  "hairLeft": <left edge of hair, 0-1>,
  "hairRight": <right edge of hair, 0-1>,
  "faceTop": <top of forehead skin, 0-1>
}

Values are normalized 0-1.`;

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
              { inlineData: { mimeType: 'image/png', data: base64Data } },
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

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: {text?: string}) => p.text);

    if (textPart?.text) {
      const hairRegion = JSON.parse(textPart.text);

      // 마스크 이미지 생성
      const mask = await createMaskImage(imageBase64, hairRegion);
      return { success: true, mask };
    }

    return { success: false };

  } catch (error) {
    console.error('Mask creation error:', error);
    return { success: false };
  }
}

/**
 * 마스크 이미지 생성 (머리카락 영역 = 흰색)
 */
async function createMaskImage(imageBase64: string, hairRegion: {
  hairTop: number;
  hairBottom: number;
  hairLeft: number;
  hairRight: number;
  faceTop: number;
}): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // 검은 배경 (투명하게 될 부분)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 머리카락 영역 = 흰색
      const hairTop = hairRegion.hairTop * canvas.height;
      const hairBottom = Math.min(hairRegion.hairBottom, hairRegion.faceTop) * canvas.height;
      const hairLeft = hairRegion.hairLeft * canvas.width;
      const hairRight = hairRegion.hairRight * canvas.width;

      ctx.fillStyle = 'white';

      // 타원형으로 머리 모양 그리기
      ctx.beginPath();
      const centerX = (hairLeft + hairRight) / 2;
      const radiusX = (hairRight - hairLeft) / 2;
      const radiusY = (hairBottom - hairTop) / 2;
      const centerY = hairTop + radiusY;

      ctx.ellipse(centerX, centerY, radiusX * 1.1, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // 부드러운 경계
      const gradient = ctx.createRadialGradient(centerX, centerY, radiusY * 0.7, centerX, centerY, radiusY * 1.1);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');

      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imageBase64;
  });
}

/**
 * 마스크를 적용해서 머리카락만 추출 (배경 투명)
 */
async function applyMaskToExtractHair(imageBase64: string, maskBase64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const mask = new Image();
    let loadCount = 0;

    const onBothLoaded = () => {
      loadCount++;
      if (loadCount < 2) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 마스크를 사용해 머리카락만 남기기 (나머지 투명)
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, img.width, img.height);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onload = onBothLoaded;
    mask.onload = onBothLoaded;

    img.src = imageBase64;
    mask.src = maskBase64;
  });
}

/**
 * 폴백: 상단 40%를 머리카락으로 간주하고 추출
 */
async function extractHairFallback(imageBase64: string): Promise<{ success: boolean; hairImage?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // 원본 이미지
      ctx.drawImage(img, 0, 0);

      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 상단 35%만 남기고 나머지는 투명하게
      const hairCutoff = canvas.height * 0.35;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;

          if (y > hairCutoff) {
            // 그라데이션으로 페이드 아웃
            const fadeStart = hairCutoff * 0.8;
            const fadeEnd = hairCutoff * 1.2;

            if (y > fadeEnd) {
              data[i + 3] = 0; // 완전 투명
            } else if (y > fadeStart) {
              const alpha = 1 - (y - fadeStart) / (fadeEnd - fadeStart);
              data[i + 3] = Math.floor(alpha * 255);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve({ success: true, hairImage: canvas.toDataURL('image/png') });
    };

    img.src = imageBase64;
  });
}

/**
 * 얼굴 위치 감지 (사용자 사진)
 */
async function detectFacePosition(imageBase64: string): Promise<{ success: boolean; face?: FacePosition }> {
  if (!GEMINI_API_KEY) {
    // 폴백: 중앙에 얼굴이 있다고 가정
    return {
      success: true,
      face: { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.2 }
    };
  }

  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  const prompt = `Detect face position in this photo. Return ONLY JSON:
{
  "x": <face center x, 0-1>,
  "y": <face center y, 0-1>,
  "width": <face width, 0-1>,
  "height": <face height, 0-1>,
  "foreheadY": <top of forehead skin, 0-1>
}`;

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

    if (!response.ok) {
      return { success: true, face: { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.2 } };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: {text?: string}) => p.text);

    if (textPart?.text) {
      const face = JSON.parse(textPart.text);
      return { success: true, face };
    }

    return { success: true, face: { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.2 } };

  } catch (error) {
    console.error('Face detection error:', error);
    return { success: true, face: { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.2 } };
  }
}

/**
 * URL 이미지에서 얼굴 위치 감지
 */
async function detectFacePositionFromUrl(url: string): Promise<{ success: boolean; face?: FacePosition }> {
  const imageBase64 = await loadImageAsBase64(url);
  if (!imageBase64) {
    return { success: true, face: { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.2 } };
  }
  return detectFacePosition(imageBase64);
}

/**
 * 원본 사진 위에 머리카락 오버레이
 *
 * 핵심: 원본은 절대 수정하지 않고, 추출한 머리카락만 위에 올림
 */
async function overlayHairOnPhoto(
  originalPhoto: string,
  extractedHair: string,
  userFace: FacePosition,
  refFace?: FacePosition
): Promise<string> {
  return new Promise((resolve) => {
    const original = new Image();
    const hair = new Image();
    let loadCount = 0;

    const onBothLoaded = () => {
      loadCount++;
      if (loadCount < 2) return;

      const canvas = document.createElement('canvas');
      canvas.width = original.width;
      canvas.height = original.height;
      const ctx = canvas.getContext('2d')!;

      // Step 1: 원본 사진 그대로 그리기 (이게 베이스!)
      ctx.drawImage(original, 0, 0);

      // Step 2: 머리카락 크기/위치 계산
      const refFaceData = refFace || { x: 0.5, y: 0.4, width: 0.4, height: 0.5, foreheadY: 0.15 };

      // 사용자 얼굴 대비 레퍼런스 얼굴 비율로 머리카락 스케일 조정
      const scaleX = (userFace.width / refFaceData.width) * 1.1;
      const scaleY = (userFace.width / refFaceData.width) * 1.1; // 비율 유지

      const hairWidth = hair.width * scaleX;
      const hairHeight = hair.height * scaleY;

      // 머리카락 위치: 사용자 이마 위치에 맞춤
      const hairX = (userFace.x * original.width) - (hairWidth / 2);
      const hairY = (userFace.foreheadY * original.height) - (hairHeight * 0.3);

      // Step 3: 머리카락 오버레이 (블렌딩)
      ctx.globalAlpha = 0.9; // 약간의 투명도로 자연스럽게
      ctx.drawImage(hair, hairX, hairY, hairWidth, hairHeight);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL('image/png'));
    };

    original.onload = onBothLoaded;
    hair.onload = onBothLoaded;

    original.src = originalPhoto;
    hair.src = extractedHair;
  });
}

/**
 * 레퍼런스 사진에서 헤어스타일 적용 (커스텀 레퍼런스용)
 */
export async function applyReferenceHairOverlay(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, referencePhoto } = params;

  try {
    console.log('Step 1: Detecting faces...');

    const [userFace, refFace] = await Promise.all([
      detectFacePosition(userPhoto),
      detectFacePosition(referencePhoto)
    ]);

    if (!userFace.success || !userFace.face) {
      return { success: false, error: 'Could not detect face in your photo' };
    }

    console.log('Step 2: Extracting hair from reference...');

    // 레퍼런스에서 머리카락 추출
    const maskResult = await createHairMaskFromImage(referencePhoto);
    let hairImage: string;

    if (maskResult.success && maskResult.mask) {
      hairImage = await applyMaskToExtractHair(referencePhoto, maskResult.mask);
    } else {
      const fallback = await extractHairFallback(referencePhoto);
      if (!fallback.success || !fallback.hairImage) {
        return { success: false, error: 'Could not extract hair from reference' };
      }
      hairImage = fallback.hairImage;
    }

    console.log('Step 3: Overlaying...');

    const result = await overlayHairOnPhoto(
      userPhoto,
      hairImage,
      userFace.face,
      refFace.face
    );

    return { success: true, resultImage: result };

  } catch (error) {
    console.error('Reference overlay error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
