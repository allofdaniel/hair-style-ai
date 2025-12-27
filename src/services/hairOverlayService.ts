/**
 * Hair Overlay Service - OpenAI GPT-Image-1.5
 *
 * OpenAI가 얼굴 보존을 잘 하므로 마스크 블렌딩 제거
 * AI 결과를 그대로 사용
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { generateHairStyle, generateFromReference } from './openai';

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

/**
 * 메인 함수 - OpenAI GPT-Image-1.5 직접 사용
 */
export async function applyHairOverlay(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  hairMask?: string;
}): Promise<GenerateResult> {
  const { userPhoto, style, settings } = params;

  try {
    console.log('=== Hair Generation with OpenAI GPT-Image-1.5 ===');
    console.log('Style:', style.name);

    // OpenAI API 호출
    const openaiResult = await generateHairStyle({
      userPhoto,
      style,
      settings,
    });

    if (!openaiResult.success || !openaiResult.resultImage) {
      return { success: false, error: openaiResult.error || 'Failed to generate hairstyle' };
    }

    // AI 결과 직접 사용 (마스크 블렌딩 제거)
    const finalResult = await addWatermark(openaiResult.resultImage);

    console.log('=== Success! ===');
    return { success: true, resultImage: finalResult };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 레퍼런스 기반 헤어 변환
 */
export async function applyReferenceOverlay(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
  hairMask?: string;
}): Promise<GenerateResult> {
  const { userPhoto, referencePhoto, settings } = params;

  try {
    console.log('=== Reference-Based Hair Generation with OpenAI ===');

    const openaiResult = await generateFromReference({
      userPhoto,
      referencePhoto,
      settings,
    });

    if (!openaiResult.success || !openaiResult.resultImage) {
      return { success: false, error: openaiResult.error || 'Failed to generate hairstyle from reference' };
    }

    // AI 결과 직접 사용
    const finalResult = await addWatermark(openaiResult.resultImage);

    return { success: true, resultImage: finalResult };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 워터마크 추가
 */
async function addWatermark(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.floor(img.width * 0.025));
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;

      const text = 'HairStyle AI';
      const textWidth = ctx.measureText(text).width;

      // 우측 하단에만 워터마크
      ctx.strokeText(text, img.width - textWidth - 15, img.height - 15);
      ctx.fillText(text, img.width - textWidth - 15, img.height - 15);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(imageData);
    img.src = imageData;
  });
}
