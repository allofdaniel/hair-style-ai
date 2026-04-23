/**
 * OpenAI GPT-Image-1.5 Service
 *
 * 최신 OpenAI 이미지 생성/편집 API
 * - 얼굴 보존 우수
 * - 4배 빠른 생성 속도
 * - 정확한 지시 따름
 */

import type { HairStyle, HairSettings, HairTexture, CustomHairSettings } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

import { logger } from './logger';
import { resilientFetch } from './networkResilience';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_EDIT_URL = 'https://api.openai.com/v1/images/edits';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

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
  // If prompt is already clean and detailed (no mannequin), use it directly
  if (!prompt.toLowerCase().includes('mannequin') &&
      !prompt.toLowerCase().includes('bust') &&
      prompt.length > 30) {
    return prompt;
  }

  // Remove mannequin-related content
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

  // Try to extract Hair Style section
  const hairStyleMatch = cleaned.match(/Hair Style:\s*([^.]+(?:\.[^.]+)*)/i);
  if (hairStyleMatch) {
    return hairStyleMatch[1].trim();
  }

  // If we have a reasonable description, use it
  if (cleaned.length > 20 && cleaned.length < 500) {
    return cleaned;
  }

  return '';
};

const readBlobAsDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
};

const toOpenAIErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData?.error?.message || `API Error: ${response.status}`;
  } catch {
    return `API Error: ${response.status}`;
  }
};

const extractOpenAIImageDataUrl = async (imageData: {
  b64_json?: string;
  url?: string;
}): Promise<string | null> => {
  if (imageData.b64_json) {
    return `data:image/png;base64,${imageData.b64_json}`;
  }

  if (!imageData.url) {
    return null;
  }

  const imgResponse = await resilientFetch(imageData.url, { method: 'GET' });
  if (!imgResponse.ok) {
    logger.warn('Failed to fetch generated OpenAI image URL:', imgResponse.status);
    return null;
  }

  const imgBlob = await imgResponse.blob();
  return readBlobAsDataUrl(imgBlob);
};

// Build the AI prompt based on selected options
export const buildPrompt = (
  style: HairStyle,
  settings: HairSettings,
  texture?: HairTexture
): string => {
  const parts: string[] = [];

  // Use the clean hairstyle description from the prompt
  const cleanedStylePrompt = cleanHairStylePrompt(style.prompt);

  // If we have a good description, use it
  if (cleanedStylePrompt && cleanedStylePrompt.length > 20) {
    parts.push(cleanedStylePrompt);
  } else {
    // Fallback: generate description from style name
    parts.push(`${style.name} hairstyle (Korean: ${style.nameKo})`);
  }

  // Hair color
  const colorOption = hairColors.find((c) => c.id === settings.color);
  if (colorOption && colorOption.id !== 'natural') {
    parts.push(colorOption.prompt);
  }

  // Volume
  const volumePrompts: Record<string, string> = {
    flat: 'with flat sleek low volume',
    natural: 'with natural medium volume',
    voluminous: 'with high volume and body',
  };
  parts.push(volumePrompts[settings.volume]);

  // Parting
  const partingPrompts: Record<string, string> = {
    left: 'parted on the left side',
    center: 'parted in the center',
    right: 'parted on the right side',
    none: 'with no visible part',
  };
  parts.push(partingPrompts[settings.parting]);

  // Hair texture consideration
  if (texture) {
    const textureOption = hairTextures.find((t) => t.id === texture);
    if (textureOption) {
      parts.push(`considering ${textureOption.prompt}`);
    }
  }

  return parts.join(', ');
};

// Fetch reference image and convert to base64
const fetchReferenceImageAsBase64 = async (thumbnailUrl: string): Promise<string | null> => {
  try {
    // Handle relative URLs
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

// Analyze reference image using GPT-4o Vision to get detailed hairstyle description
const analyzeReferenceImage = async (referenceBase64: string, styleName: string): Promise<string | null> => {
  try {
    const response = await resilientFetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this hairstyle reference image (${styleName}) and describe it in EXTREME detail for a hair stylist to recreate. Include:
1. Exact hair length (in cm) for bangs, sides, top, back
2. Hair texture and wave pattern (straight, wavy, curly, S-curl, etc.)
3. Hair volume and body (flat, natural, voluminous)
4. Parting style (center, left, right, no part)
5. Any special techniques (layers, undercut, fade, perm type)
6. How the hair falls and shapes around the face
7. Overall silhouette and shape

Be VERY specific with measurements and styling details. This will be used to generate the exact same hairstyle on another person's photo.
Respond in 2-3 sentences, focusing on the most distinctive and important features.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: referenceBase64,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      logger.error('GPT-4o Vision analysis failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    logger.error('Error analyzing reference image:', error);
    return null;
  }
};

// Convert base64 to Blob for API upload
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// Generate hair style using OpenAI GPT-Image-1.5 API
export const generateHairStyle = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, style, settings, texture } = params;

  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  let stylePrompt = buildPrompt(style, settings, texture);

  // Build color prompt separately to ensure it's always included
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `HAIR COLOR: ${colorOption.prompt}`
    : '';

  if (colorPrompt) {
    logger.log('Color prompt will be added:', colorPrompt);
  }

  try {
    // Step 1: Use pre-analyzed prompt if available, otherwise analyze reference image
    // Pre-analyzed prompts are stored in style.prompt by the analysis script
    const preAnalyzedPrompt = cleanHairStylePrompt(style.prompt);

    if (preAnalyzedPrompt && preAnalyzedPrompt.length > 50) {
      // Use the pre-analyzed prompt directly (no API call needed)
      logger.log('Using pre-analyzed prompt:', preAnalyzedPrompt.substring(0, 100) + '...');
      stylePrompt = preAnalyzedPrompt;
    } else if (style.thumbnail) {
      // Fallback: Analyze reference image in real-time (costs API call)
      logger.log('No pre-analyzed prompt, fetching reference image:', style.thumbnail);
      const referenceBase64 = await fetchReferenceImageAsBase64(style.thumbnail);
      if (referenceBase64) {
        logger.log('Analyzing reference image with GPT-4o Vision...');
        const referenceAnalysis = await analyzeReferenceImage(referenceBase64, style.nameKo);
        if (referenceAnalysis) {
          logger.log('Reference analysis:', referenceAnalysis);
          stylePrompt = referenceAnalysis;
        }
      }
    }

    // Determine mime type
    let mimeType = 'image/png';
    if (userPhoto.includes('data:image/jpeg')) {
      mimeType = 'image/jpeg';
    } else if (userPhoto.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }

    logger.log('Calling OpenAI GPT-Image-1.5 API...');
    logger.log('Final style prompt:', stylePrompt.substring(0, 200) + '...');

    // PIXEL-PERFECT face preservation prompt - ZERO face modifications allowed
    // This is an inpainting task where ONLY the hair region should change
    const editPrompt = colorPrompt
      ? `INPAINTING TASK - HAIR REGION ONLY

⚠️ CRITICAL: THIS IS A FACE-LOCKED INPAINTING OPERATION ⚠️

ABSOLUTE RULE #1 - FACE IS READ-ONLY:
The face region is LOCKED and must be copied PIXEL-BY-PIXEL from input to output.
- DO NOT touch, modify, enhance, or regenerate ANY facial pixels
- DO NOT add realism, details, or "improvements" to the face
- DO NOT change skin tone, texture, or color even slightly
- If the face looks artificial, plastic, or mannequin-like - KEEP IT THAT WAY
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
- If the face looks artificial, plastic, or mannequin-like - KEEP IT THAT WAY
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

    // Use image edit API with the user's photo
    const imageBlob = base64ToBlob(userPhoto, mimeType);

    // Create form data for the edit endpoint
    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', editPrompt);
    formData.append('model', 'gpt-image-1.5');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await resilientFetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await toOpenAIErrorMessage(response);
      logger.error('OpenAI API error:', response.status, errorMessage);

      if (response.status === 400) {
        return { success: false, error: 'Invalid image format. Please try a different photo.' };
      } else if (response.status === 401) {
        return { success: false, error: 'API key invalid. Please check configuration.' };
      } else if (response.status === 403) {
        return { success: false, error: 'API access denied. Organization verification required.' };
      } else if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Please wait and try again.' };
      }

      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    logger.log('OpenAI response received');

    // Extract the generated image
    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage = await extractOpenAIImageDataUrl(imageData);
      if (!resultImage) {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return {
      success: false,
      error: 'No image generated. Please try again.',
    };

  } catch (error) {
    logger.error('Error generating hair style:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
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
  const { userPhoto, settings } = params;

  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  // Build color modification if not natural
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural' ? `Apply hair color: ${colorOption.prompt}.` : '';

  try {
    logger.log('Generating from reference with OpenAI...');

    // For reference-based generation, we need to describe the reference hairstyle
    // OpenAI doesn't support multiple input images in edit, so we use generation with detailed prompt
    const refPrompt = `Copy the EXACT hairstyle from the reference image and apply it to this person's photo.

RULES:
1. The person's face must remain 100% IDENTICAL
2. ONLY change the hair to match the reference hairstyle
3. Keep body, clothing, background unchanged
${colorPrompt ? `4. ${colorPrompt}` : ''}

This is a virtual hairstyle try-on - same person, different hair only.`;

    const imageBlob = base64ToBlob(userPhoto, 'image/png');

    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', refPrompt);
    formData.append('model', 'gpt-image-1.5');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await resilientFetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await toOpenAIErrorMessage(response);
      logger.error('OpenAI reference generation error:', response.status, errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage = await extractOpenAIImageDataUrl(imageData);
      if (!resultImage) {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No image generated. Please try again.' };

  } catch (error) {
    logger.error('Error generating from reference:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Generate back view of hairstyle
interface GenerateBackViewParams {
  userPhoto: string;
  frontResultImage: string;
  style: HairStyle;
  settings: HairSettings;
}

export const generateBackView = async (
  params: GenerateBackViewParams
): Promise<GenerateHairStyleResponse> => {
  const { frontResultImage, style, settings } = params;

  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  const stylePrompt = buildPrompt(style, settings);

  // Build color prompt separately to ensure it's always included
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `HAIR COLOR: ${colorOption.prompt}`
    : '';

  try {
    logger.log('Generating back view with OpenAI...');
    if (colorPrompt) {
      logger.log('Back view color prompt:', colorPrompt);
    }

    // Generate back view based on the front view result
    const backViewPrompt = colorOption && colorOption.id !== 'natural'
      ? `Create a BACK VIEW of this ${colorOption.nameKo} colored ${style.nameKo} hairstyle.

**MANDATORY: The hair color MUST be ${colorOption.nameKo}. ${colorOption.prompt}**

HAIRSTYLE: ${stylePrompt}

REQUIREMENTS:
1. Show the BACK of the head with ${style.nameKo} hairstyle
2. Hair color MUST be ${colorOption.nameKo} - this is mandatory
3. Show nape, back layers, and overall shape from behind
4. Keep the same ${colorOption.nameKo} hair color as specified`
      : `Create a BACK VIEW of this same hairstyle: ${style.nameKo} (${style.name})

HAIRSTYLE DETAILS: ${stylePrompt}

TASK:
1. Show the back of this person's head with the SAME hairstyle
2. Transform this front view to a back view
3. Keep the same hair color, texture, and styling
4. Show how the hairstyle looks from behind - nape, back layers, overall shape
5. Maintain realistic proportions and lighting

This should look like a "back view" photo of the same person with this hairstyle at a hair salon.`;

    const imageBlob = base64ToBlob(frontResultImage, 'image/png');

    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', backViewPrompt);
    formData.append('model', 'gpt-image-1.5');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await resilientFetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await toOpenAIErrorMessage(response);
      logger.error('OpenAI back view error:', response.status, errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage = await extractOpenAIImageDataUrl(imageData);
      if (!resultImage) {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No back view generated. Please try again.' };

  } catch (error) {
    logger.error('Error generating back view:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Build custom hairstyle prompt from settings
const buildCustomPrompt = (settings: CustomHairSettings): string => {
  const parts: string[] = [];

  // 길이 설명
  parts.push(`Hair length specifications: front bangs ${settings.frontLength}cm, sides ${settings.sideLength}cm, top ${settings.topLength}cm, back ${settings.backLength}cm`);

  // 숱치기
  if (settings.thinning.top || settings.thinning.sides || settings.thinning.back) {
    const thinningAreas: string[] = [];
    if (settings.thinning.top) thinningAreas.push('top');
    if (settings.thinning.sides) thinningAreas.push('sides');
    if (settings.thinning.back) thinningAreas.push('back');

    const amountMap = {
      light: 'lightly thinned',
      medium: 'moderately thinned',
      heavy: 'heavily thinned',
    };
    parts.push(`${thinningAreas.join(' and ')} hair is ${amountMap[settings.thinning.amount]}`);
  }

  // 펌
  if (settings.perm.type !== 'none') {
    const permTypes = {
      down: 'down perm (hair falling naturally downward)',
      volume: 'volume perm (added body and lift)',
      wave: 'wave perm (soft S-curves)',
    };
    parts.push(permTypes[settings.perm.type]);

    const permAreas: string[] = [];
    if (settings.perm.areas.sideBack) permAreas.push('sides and back');
    if (settings.perm.areas.sideOnly) permAreas.push('sides only');
    if (settings.perm.areas.top) permAreas.push('top');
    if (settings.perm.areas.bangs) permAreas.push('bangs');

    if (permAreas.length > 0) {
      parts.push(`perm applied to: ${permAreas.join(', ')}`);
    }
  }

  // 투블럭/페이드
  if (settings.undercut.enabled) {
    parts.push(`two-block undercut with sides buzzed up ${settings.undercut.height}mm`);

    if (settings.undercut.fadeType !== 'none') {
      const fadeTypes = {
        low: 'low fade starting below the ear',
        mid: 'mid fade at temple level',
        high: 'high fade near the crown',
        skin: 'skin fade blending to bare skin',
      };
      parts.push(fadeTypes[settings.undercut.fadeType]);
    }
  }

  // 기타 옵션
  if (settings.layering) {
    parts.push('with layered cut for movement');
  }
  if (settings.texturizing) {
    parts.push('with textured choppy ends');
  }

  return parts.join(', ');
};

// Generate custom hairstyle based on detailed settings
interface GenerateCustomParams {
  userPhoto: string;
  customSettings: CustomHairSettings;
}

export const generateCustomHairStyle = async (
  params: GenerateCustomParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, customSettings } = params;

  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  const customPrompt = buildCustomPrompt(customSettings);

  try {
    logger.log('Generating custom hairstyle with OpenAI...');
    logger.log('Custom settings prompt:', customPrompt);

    const editPrompt = `TASK: Apply this EXACT custom haircut specification to this person's photo:

HAIRCUT SPECIFICATIONS:
${customPrompt}

CRITICAL RULES:
1. Keep the person's face 100% IDENTICAL - same eyes, nose, mouth, skin, face shape
2. Keep the same person's identity - must be recognizable as the EXACT same person
3. Keep body, clothing, background, lighting, and pose unchanged
4. ONLY modify the hair according to the specifications above
5. Pay attention to the exact centimeter measurements provided
6. This is a professional salon haircut preview

Apply these haircut specifications as if a professional barber/stylist just finished cutting.`;

    const imageBlob = base64ToBlob(userPhoto, 'image/png');

    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', editPrompt);
    formData.append('model', 'gpt-image-1.5');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await resilientFetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await toOpenAIErrorMessage(response);
      logger.error('OpenAI custom generation error:', response.status, errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage = await extractOpenAIImageDataUrl(imageData);
      if (!resultImage) {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No image generated. Please try again.' };

  } catch (error) {
    logger.error('Error generating custom hairstyle:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

