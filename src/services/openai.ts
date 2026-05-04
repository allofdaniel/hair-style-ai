/**
 * Gemini 2.5 Flash Image Service (file kept named openai.ts for import-compat)
 *
 * Internal implementation switched from OpenAI gpt-image-1.5 to
 * Google's Gemini 2.5 Flash Image after a security audit found the
 * OpenAI key was being shipped inside the APK. Public function
 * signatures are unchanged so existing imports continue to work.
 */

import type { HairStyle, HairSettings, HairTexture, CustomHairSettings } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

import { logger } from './logger';
import { resilientFetch } from './networkResilience';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
const GEMINI_IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`;
const GEMINI_TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`;

interface GenerateHairStyleParams {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  texture?: HairTexture;
}

interface GenerateHairStyleResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

// Clean hairstyle prompt - remove mannequin references and use directly
const cleanHairStylePrompt = (prompt: string): string => {
  if (!prompt.toLowerCase().includes('mannequin') &&
      !prompt.toLowerCase().includes('bust') &&
      prompt.length > 30) {
    return prompt;
  }

  let cleaned = prompt
    .replace(/A (high-quality |vertical |premium |portrait )*\d*:?\d* ?(portrait|photograph)? of a (single )?white plastic (male |female )?mannequin bust[^.]*\./gi, '')
    .replace(/The mannequin[^.]*\./gi, '')
    .replace(/mannequin/gi, '')
    .replace(/Environment:[^.]*\./gi, '')
    .replace(/Minimalist white studio background[^.]*\./gi, '')
    .replace(/professional (soft )?lighting[^.]*\./gi, '')
    .replace(/(wearing a |It wears a )?(premium )?navy blue knit sweater[^.]*\./gi, '')
    .replace(/against a clean studio white background[^.]*\./gi, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hairStyleMatch = cleaned.match(/Hair Style:\s*([^.]+(?:\.[^.]+)*)/i);
  if (hairStyleMatch) {
    return hairStyleMatch[1].trim();
  }

  if (cleaned.length > 20 && cleaned.length < 500) {
    return cleaned;
  }

  return '';
};

// Build the AI prompt based on selected options
export const buildPrompt = (
  style: HairStyle,
  settings: HairSettings,
  texture?: HairTexture
): string => {
  const parts: string[] = [];

  const cleanedStylePrompt = cleanHairStylePrompt(style.prompt);

  if (cleanedStylePrompt && cleanedStylePrompt.length > 20) {
    parts.push(cleanedStylePrompt);
  } else {
    parts.push(`${style.name} hairstyle (Korean: ${style.nameKo})`);
  }

  const colorOption = hairColors.find((c) => c.id === settings.color);
  if (colorOption && colorOption.id !== 'natural') {
    parts.push(colorOption.prompt);
  }

  const volumePrompts: Record<string, string> = {
    flat: 'with flat sleek low volume',
    natural: 'with natural medium volume',
    voluminous: 'with high volume and body',
  };
  parts.push(volumePrompts[settings.volume]);

  const partingPrompts: Record<string, string> = {
    left: 'parted on the left side',
    center: 'parted in the center',
    right: 'parted on the right side',
    none: 'with no visible part',
  };
  parts.push(partingPrompts[settings.parting]);

  if (texture) {
    const textureOption = hairTextures.find((t) => t.id === texture);
    if (textureOption) {
      parts.push(`considering ${textureOption.prompt}`);
    }
  }

  return parts.join(', ');
};

// Extract base64 + mime type from a data URL or raw base64
const splitDataUrl = (src: string): { mimeType: string; data: string } => {
  let mime = 'image/png';
  let b64 = src;
  if (src.startsWith('data:')) {
    const m = src.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      mime = m[1];
      b64 = m[2];
    } else {
      b64 = src.split(',')[1] || src;
    }
  }
  return { mimeType: mime, data: b64 };
};

// Fetch reference image and convert to base64
const fetchReferenceImageAsBase64 = async (thumbnailUrl: string): Promise<string | null> => {
  try {
    const fullUrl = thumbnailUrl.startsWith('/')
      ? `${window.location.origin}${thumbnailUrl}`
      : thumbnailUrl;

    const response = await resilientFetch(fullUrl, { method: 'GET' });
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('Failed to fetch reference image:', error);
    return null;
  }
};

// Analyze reference image using Gemini 2.5 Flash to get detailed hairstyle description
const analyzeReferenceImage = async (referenceBase64: string, styleName: string): Promise<string | null> => {
  try {
    const { mimeType, data } = splitDataUrl(referenceBase64);
    const prompt = `Analyze this hairstyle reference image (${styleName}) and describe it in EXTREME detail for a hair stylist to recreate. Include:
1. Exact hair length (in cm) for bangs, sides, top, back
2. Hair texture and wave pattern (straight, wavy, curly, S-curl, etc.)
3. Hair volume and body (flat, natural, voluminous)
4. Parting style (center, left, right, no part)
5. Any special techniques (layers, undercut, fade, perm type)
6. How the hair falls and shapes around the face
7. Overall silhouette and shape

Be VERY specific with measurements and styling details. This will be used to generate the exact same hairstyle on another person's photo.
Respond in 2-3 sentences, focusing on the most distinctive and important features.`;

    const response = await resilientFetch(`${GEMINI_TEXT_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data } },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.error('Gemini Vision analysis failed:', response.status);
      return null;
    }

    const payload = await response.json();
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: { text?: string }) => p.text);
    return textPart?.text || null;
  } catch (error) {
    logger.error('Error analyzing reference image:', error);
    return null;
  }
};

// Common Gemini image-edit call
interface GeminiCallResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

const callGeminiImageEdit = async (
  imageDataUrl: string,
  promptText: string,
  logLabel: string
): Promise<GeminiCallResult> => {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const { mimeType, data } = splitDataUrl(imageDataUrl);

  try {
    logger.log(`Calling Gemini ${GEMINI_IMAGE_MODEL} for ${logLabel}...`);
    logger.log('Prompt preview:', promptText.substring(0, 200) + '...');

    const response = await resilientFetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data } },
              { text: promptText },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['image'],
        },
      }),
    });

    if (!response.ok) {
      let errMsg = `Gemini error ${response.status}`;
      try {
        const body = await response.json();
        errMsg = body?.error?.message || errMsg;
      } catch (_) {
        // ignore
      }
      logger.error('Gemini API error:', response.status, errMsg);
      if (response.status === 400) return { success: false, error: 'Invalid image format. Please try a different photo.' };
      if (response.status === 401 || response.status === 403) return { success: false, error: 'API key invalid or unauthorized.' };
      if (response.status === 429) return { success: false, error: 'Rate limit exceeded. Please wait and try again.' };
      return { success: false, error: errMsg };
    }

    const payload = await response.json();
    const candidates = payload?.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'No image generated. Please try again.' };
    }

    const finishReason = candidates[0]?.finishReason;
    const partsOut = candidates[0]?.content?.parts || [];
    const imgPart = partsOut.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
    if (imgPart) {
      const mt = imgPart.inlineData!.mimeType || 'image/png';
      return { success: true, resultImage: `data:${mt};base64,${imgPart.inlineData!.data}` };
    }

    if (finishReason === 'PROHIBITED_CONTENT' || finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
      return { success: false, error: 'Image blocked by safety filter. Please try a different photo.' };
    }

    const textPart = partsOut.find((p: { text?: string }) => p.text);
    if (textPart) {
      logger.warn('Gemini returned text instead of image:', textPart.text?.substring(0, 200));
      return { success: false, error: 'Model returned text instead of image. Please try again.' };
    }

    return { success: false, error: 'No image generated. Please try again.' };
  } catch (error) {
    logger.error('Gemini call failed:', error);
    if (error instanceof TypeError && (error.message || '').includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

// Generate hair style using Gemini 2.5 Flash Image
export const generateHairStyle = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, style, settings, texture } = params;

  let stylePrompt = buildPrompt(style, settings, texture);

  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `HAIR COLOR: ${colorOption.prompt}`
    : '';

  if (colorPrompt) {
    logger.log('Color prompt will be added:', colorPrompt);
  }

  // Step 1: pre-analyzed prompt or reference-image analysis (Gemini Vision)
  const preAnalyzedPrompt = cleanHairStylePrompt(style.prompt);
  if (preAnalyzedPrompt && preAnalyzedPrompt.length > 50) {
    logger.log('Using pre-analyzed prompt:', preAnalyzedPrompt.substring(0, 100) + '...');
    stylePrompt = preAnalyzedPrompt;
  } else if (style.thumbnail) {
    logger.log('No pre-analyzed prompt, fetching reference image:', style.thumbnail);
    const referenceBase64 = await fetchReferenceImageAsBase64(style.thumbnail);
    if (referenceBase64) {
      logger.log('Analyzing reference image with Gemini Vision...');
      const referenceAnalysis = await analyzeReferenceImage(referenceBase64, style.nameKo);
      if (referenceAnalysis) {
        logger.log('Reference analysis:', referenceAnalysis);
        stylePrompt = referenceAnalysis;
      }
    }
  }

  const editPrompt = colorPrompt
    ? `INPAINTING TASK - HAIR REGION ONLY

⚠️ CRITICAL: THIS IS A FACE-LOCKED INPAINTING OPERATION ⚠️

ABSOLUTE RULE #1 - FACE IS READ-ONLY:
The face region is LOCKED and must be copied PIXEL-BY-PIXEL from input to output.
- DO NOT touch, modify, enhance, or regenerate ANY facial pixels
- DO NOT add realism, details, or "improvements" to the face
- DO NOT change skin tone, texture, or color even slightly
- The face must be an EXACT PIXEL-LEVEL COPY, not a "similar recreation"

WHAT TO CHANGE (HAIR ONLY):
- Hair style: ${style.nameKo}
- Hair color: ${colorOption?.nameKo} (${colorOption?.prompt})
- Hair details: ${stylePrompt}

WHAT MUST NOT CHANGE:
- Face (eyes, nose, mouth, skin, jaw, cheeks, forehead, ears, eyebrows) - FROZEN
- Background - FROZEN
- Clothing - FROZEN
- Pose/angle - FROZEN
- Lighting on face - FROZEN

Think of this as: mask the hair area, edit ONLY that masked region, paste the original face back.`
    : `INPAINTING TASK - HAIR REGION ONLY

⚠️ CRITICAL: THIS IS A FACE-LOCKED INPAINTING OPERATION ⚠️

ABSOLUTE RULE #1 - FACE IS READ-ONLY:
The face region is LOCKED and must be copied PIXEL-BY-PIXEL from input to output.
- DO NOT touch, modify, enhance, or regenerate ANY facial pixels
- DO NOT add realism, details, or "improvements" to the face
- DO NOT change skin tone, texture, or color even slightly
- The face must be an EXACT PIXEL-LEVEL COPY, not a "similar recreation"

WHAT TO CHANGE (HAIR ONLY):
- Hair style: ${style.nameKo} (${style.name})
- Hair details: ${stylePrompt}

WHAT MUST NOT CHANGE:
- Face (eyes, nose, mouth, skin, jaw, cheeks, forehead, ears, eyebrows) - FROZEN
- Background - FROZEN
- Clothing - FROZEN
- Pose/angle - FROZEN
- Lighting on face - FROZEN

Think of this as: mask the hair area, edit ONLY that masked region, paste the original face back.`;

  return callGeminiImageEdit(userPhoto, editPrompt, 'front hair generation');
};

// Generate from reference photo
interface GenerateFromReferenceParams {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}

export const generateFromReference = async (
  params: GenerateFromReferenceParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, referencePhoto, settings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `Hair color: ${colorOption.nameKo} (${colorOption.prompt}).`
    : '';

  // 1) Use Gemini Vision to describe the reference image's hairstyle
  let referenceDescription = '';
  try {
    const description = await analyzeReferenceImage(referencePhoto, 'reference');
    if (description) referenceDescription = description;
  } catch (err) {
    logger.warn('Reference vision analysis failed:', err);
  }

  const promptText = `INPAINTING TASK - HAIR REGION ONLY

Apply the hairstyle from the supplied reference description onto this person's photo.

Reference hairstyle description:
${referenceDescription || '(use the reference image as a visual guide)'}

${colorPrompt}

CRITICAL RULES:
- Keep the face, eyes, nose, mouth, skin, jaw, ears, eyebrows 100% identical
- Keep background, clothing, body, pose, camera angle unchanged
- ONLY modify the hair region

The output must be a photorealistic image of the SAME person with the NEW hairstyle.`;

  // We pass userPhoto through callGeminiImageEdit (the reference is already
  // captured into the description text above). This keeps a single image-edit
  // request and avoids breaking the safety filter with multi-image inputs.
  return callGeminiImageEdit(userPhoto, promptText, 'reference-based generation');
};

// Generate back view from a front result
interface GenerateBackViewParams {
  frontResultImage: string;
  style: HairStyle;
  settings: HairSettings;
  userPhoto?: string;
}

export const generateBackView = async (
  params: GenerateBackViewParams
): Promise<GenerateHairStyleResponse> => {
  const { frontResultImage, style, settings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const stylePrompt = buildPrompt(style, settings);
  const colorOption = hairColors.find((c) => c.id === settings.color);

  const promptText = colorOption && colorOption.id !== 'natural'
    ? `Create a BACK VIEW of this same ${colorOption.nameKo} colored ${style.nameKo} hairstyle.

MANDATORY: The hair color MUST remain ${colorOption.nameKo}. ${colorOption.prompt}

Hairstyle details: ${stylePrompt}

Requirements:
1. Show the BACK of the head (nape, back layers, overall shape from behind)
2. Hair color must be ${colorOption.nameKo}
3. Keep the same texture and styling
4. Maintain realistic proportions and lighting`
    : `Create a BACK VIEW of this same hairstyle: ${style.nameKo} (${style.name}).

Hairstyle details: ${stylePrompt}

Requirements:
1. Show the back of this person's head with the SAME hairstyle
2. Transform this front view into a back view
3. Keep the same hair color, texture, and styling
4. Show nape, back layers, and overall shape from behind
5. Maintain realistic proportions and lighting`;

  return callGeminiImageEdit(frontResultImage, promptText, 'back view');
};

// Build custom haircut spec
const buildCustomHaircutSpec = (cs: CustomHairSettings): string => {
  const parts: string[] = [];
  parts.push(`Hair length specifications: front bangs ${cs.frontLength}cm, sides ${cs.sideLength}cm, top ${cs.topLength}cm, back ${cs.backLength}cm`);

  if (cs.thinning.top || cs.thinning.sides || cs.thinning.back) {
    const areas: string[] = [];
    if (cs.thinning.top) areas.push('top');
    if (cs.thinning.sides) areas.push('sides');
    if (cs.thinning.back) areas.push('back');
    const amt: Record<string, string> = {
      light: 'lightly thinned',
      medium: 'moderately thinned',
      heavy: 'heavily thinned',
    };
    parts.push(`${areas.join(' and ')} hair is ${amt[cs.thinning.amount]}`);
  }

  if (cs.perm.type !== 'none') {
    const map: Record<string, string> = {
      down: 'down perm (hair falling naturally downward)',
      volume: 'volume perm (added body and lift)',
      wave: 'wave perm (soft S-curves)',
    };
    parts.push(map[cs.perm.type]);

    const permAreas: string[] = [];
    if (cs.perm.areas.sideBack) permAreas.push('sides and back');
    if (cs.perm.areas.sideOnly) permAreas.push('sides only');
    if (cs.perm.areas.top) permAreas.push('top');
    if (cs.perm.areas.bangs) permAreas.push('bangs');
    if (permAreas.length > 0) parts.push(`perm applied to: ${permAreas.join(', ')}`);
  }

  if (cs.undercut.enabled) {
    parts.push(`two-block undercut with sides buzzed up ${cs.undercut.height}mm`);
    if (cs.undercut.fadeType !== 'none') {
      const fades: Record<string, string> = {
        low: 'low fade starting below the ear',
        mid: 'mid fade at temple level',
        high: 'high fade near the crown',
        skin: 'skin fade blending to bare skin',
      };
      parts.push(fades[cs.undercut.fadeType]);
    }
  }

  if (cs.layering) parts.push('with layered cut for movement');
  if (cs.texturizing) parts.push('with textured choppy ends');

  return parts.join(', ');
};

// Generate custom haircut
interface GenerateCustomHairStyleParams {
  userPhoto: string;
  customSettings: CustomHairSettings;
}

export const generateCustomHairStyle = async (
  params: GenerateCustomHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, customSettings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const spec = buildCustomHaircutSpec(customSettings);
  const promptText = `Apply this EXACT custom haircut specification to this person's photo:

Haircut specifications:
${spec}

Critical rules:
1. Keep the person's face 100% identical (eyes, nose, mouth, skin, face shape)
2. The person must be recognizable as the EXACT same person
3. Keep body, clothing, background, lighting, and pose unchanged
4. ONLY modify the hair according to the specifications above
5. Respect the exact centimeter measurements provided
6. This is a professional salon haircut preview

Render as if a professional barber just finished this cut on the person.`;

  return callGeminiImageEdit(userPhoto, promptText, 'custom haircut');
};
