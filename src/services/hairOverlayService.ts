import { logger } from './logger';
/**
 * Hair Overlay Service - OpenAI GPT-Image-1.5
 *
 * OpenAIê°€ ?¼êµ´ ë³´ì¡´?????˜ë?ë¡?ë§ˆìŠ¤??ë¸”ë Œ???œê±°
 * AI ê²°ê³¼ë¥?ê·¸ë?ë¡??¬ìš©
 * ?ë¨¸ë¦?+ ?·ë¨¸ë¦??™ì‹œ ?ì„± ì§€??
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { generateHairStyle, generateFromReference, generateBackView } from './openai';

const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  backViewImage?: string;  // ?·ë¨¸ë¦??´ë?ì§€
  error?: string;
}

/**
 * ë©”ì¸ ?¨ìˆ˜ - OpenAI GPT-Image-1.5 ì§ì ‘ ?¬ìš©
 * ?ë¨¸ë¦?+ ?·ë¨¸ë¦??™ì‹œ ?ì„±
 */
export async function applyHairOverlay(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  hairMask?: string;
  generateBackView?: boolean;  // ?·ë¨¸ë¦¬ë„ ?ì„±? ì? ?¬ë? (ê¸°ë³¸: false - ?ë„ ?¥ìƒ)
}): Promise<GenerateResult> {
  // ?·ë¨¸ë¦??ë™ ?ì„± ?œì„±??
  const { userPhoto, style, settings, generateBackView: shouldGenerateBackView = true } = params;

  try {
    debugLog('=== Hair Generation with OpenAI GPT-Image-1.5 ===');
    debugLog('Style:', style.name);
    debugLog('Generate back view:', shouldGenerateBackView);

    // 1. ?ë¨¸ë¦?(?•ë©´) ?ì„±
    const openaiResult = await generateHairStyle({
      userPhoto,
      style,
      settings,
    });

    if (!openaiResult.success || !openaiResult.resultImage) {
      return { success: false, error: openaiResult.error || 'Failed to generate hairstyle' };
    }

    // AI ê²°ê³¼???Œí„°ë§ˆí¬ ì¶”ê?
    const frontResult = await addWatermark(openaiResult.resultImage);

    // 2. ?·ë¨¸ë¦??ì„± (?µì…˜)
    let backResult: string | undefined;
    if (shouldGenerateBackView) {
      debugLog('=== Generating Back View ===');
      const backViewResult = await generateBackView({
        userPhoto,
        frontResultImage: openaiResult.resultImage,
        style,
        settings,
      });

      if (backViewResult.success && backViewResult.resultImage) {
        backResult = await addWatermark(backViewResult.resultImage);
        debugLog('Back view generated successfully');
      } else {
        logger.warn('Failed to generate back view:', backViewResult.error);
        // ?·ë¨¸ë¦??¤íŒ¨?´ë„ ?ë¨¸ë¦¬ëŠ” ë°˜í™˜
      }
    }

    debugLog('=== Success! ===');
    return {
      success: true,
      resultImage: frontResult,
      backViewImage: backResult,
    };

  } catch (error) {
    logger.error('Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * ?ˆí¼?°ìŠ¤ ê¸°ë°˜ ?¤ì–´ ë³€??
 */
export async function applyReferenceOverlay(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
  hairMask?: string;
}): Promise<GenerateResult> {
  const { userPhoto, referencePhoto, settings } = params;

  try {
    debugLog('=== Reference-Based Hair Generation with OpenAI ===');

    const openaiResult = await generateFromReference({
      userPhoto,
      referencePhoto,
      settings,
    });

    if (!openaiResult.success || !openaiResult.resultImage) {
      return { success: false, error: openaiResult.error || 'Failed to generate hairstyle from reference' };
    }

    // AI ê²°ê³¼ ì§ì ‘ ?¬ìš©
    const finalResult = await addWatermark(openaiResult.resultImage);

    return { success: true, resultImage: finalResult };

  } catch (error) {
    logger.error('Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * ?Œí„°ë§ˆí¬ ì¶”ê?
 * ?€?„ì•„??ì¶”ê??˜ì—¬ ë¬´í•œ ?€ê¸?ë°©ì?
 */
async function addWatermark(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    // 10ì´??€?„ì•„???¤ì •
    const timeout = setTimeout(() => {
      logger.warn('addWatermark timeout - returning original');
      resolve(imageData);
    }, 10000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          logger.warn('addWatermark: canvas context is null, returning original');
          resolve(imageData);
          return;
        }

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(14, Math.floor(img.width * 0.025));
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;

        const text = 'HairStyle AI';
        const textWidth = ctx.measureText(text).width;

        // ?°ì¸¡ ?˜ë‹¨?ë§Œ ?Œí„°ë§ˆí¬
        ctx.strokeText(text, img.width - textWidth - 15, img.height - 15);
        ctx.fillText(text, img.width - textWidth - 15, img.height - 15);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        logger.warn('addWatermark error:', err);
        resolve(imageData);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      logger.warn('addWatermark img.onerror - returning original');
      resolve(imageData);
    };
    img.src = imageData;
  });
}