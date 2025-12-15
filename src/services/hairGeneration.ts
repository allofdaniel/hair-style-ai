/**
 * Hair Generation Service - Free Version
 *
 * Uses:
 * 1. Gemini for face detection and hair mask creation
 * 2. Gemini for generating new hairstyle image
 * 3. Canvas compositing to blend new hair onto original (preserving face)
 *
 * No paid APIs required!
 */

import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';
import { createHairMaskWithGemini, compositeHairOntoOriginal } from './hairSegmentation';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';

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

// Build prompt for hairstyle
export const buildPrompt = (
  style: HairStyle,
  settings: HairSettings,
  texture?: HairTexture
): string => {
  const parts: string[] = [];

  parts.push(style.prompt);

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

/**
 * Generate hairstyle using free method:
 * 1. Create hair mask with Gemini face detection
 * 2. Generate full image with new hairstyle using Gemini
 * 3. Composite: take only hair from generated, keep face from original
 */
export async function generateHairStyleFree(
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> {
  const { userPhoto, style, settings, texture } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const stylePrompt = buildPrompt(style, settings, texture);

  try {
    console.log('Step 1: Creating hair mask...');

    // Step 1: Create hair mask
    const maskResult = await createHairMaskWithGemini(userPhoto);
    if (!maskResult.success || !maskResult.hairMask) {
      return { success: false, error: `Mask creation failed: ${maskResult.error}` };
    }

    console.log('Hair mask created successfully');
    console.log('Step 2: Generating new hairstyle with Gemini...');

    // Step 2: Generate image with new hairstyle
    const generatedResult = await generateWithGemini(userPhoto, style, stylePrompt);
    if (!generatedResult.success || !generatedResult.image) {
      return { success: false, error: generatedResult.error || 'Generation failed' };
    }

    console.log('New hairstyle generated');
    console.log('Step 3: Compositing hair onto original...');

    // Step 3: Composite - take hair from generated, face from original
    const finalImage = await compositeHairOntoOriginal(
      userPhoto,
      generatedResult.image,
      maskResult.hairMask
    );

    console.log('Compositing complete!');

    return {
      success: true,
      resultImage: finalImage,
    };

  } catch (error) {
    console.error('Hair generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate image with Gemini
 */
async function generateWithGemini(
  userPhoto: string,
  style: HairStyle,
  stylePrompt: string
): Promise<{ success: boolean; image?: string; error?: string }> {
  const base64Data = userPhoto.includes('base64,')
    ? userPhoto.split('base64,')[1]
    : userPhoto;

  let mimeType = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) mimeType = 'image/png';
  else if (userPhoto.includes('data:image/webp')) mimeType = 'image/webp';

  const prompt = `Transform this person's hairstyle to: ${style.nameKo} (${style.name})

Style details: ${stylePrompt}

CRITICAL RULES:
1. Keep the person's FACE exactly the same - same eyes, nose, mouth, skin tone
2. Keep the same pose, angle, and background
3. Only change the HAIR to match the target style
4. Make the new hairstyle look natural and professional
5. The person should still be recognizable as the same person

Generate the image with the new hairstyle applied.`;

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
      console.error('Gemini error:', response.status, errorText);

      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment.' };
      }

      return { success: false, error: `Gemini API error: ${response.status}` };
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
    if (!parts || parts.length === 0) {
      return { success: false, error: 'No content generated' };
    }

    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);
    if (imagePart?.inlineData) {
      return {
        success: true,
        image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Gemini generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Generate from reference photo
 */
interface GenerateFromReferenceParams {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}

export async function generateFromReferenceFree(
  params: GenerateFromReferenceParams
): Promise<GenerateHairStyleResponse> {
  const { userPhoto, referencePhoto, settings } = params;

  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    console.log('Step 1: Creating hair mask...');

    // Step 1: Create hair mask
    const maskResult = await createHairMaskWithGemini(userPhoto);
    if (!maskResult.success || !maskResult.hairMask) {
      return { success: false, error: `Mask creation failed: ${maskResult.error}` };
    }

    console.log('Step 2: Generating with reference...');

    // Step 2: Generate with reference
    const generatedResult = await generateWithReference(userPhoto, referencePhoto, settings);
    if (!generatedResult.success || !generatedResult.image) {
      return { success: false, error: generatedResult.error || 'Generation failed' };
    }

    console.log('Step 3: Compositing...');

    // Step 3: Composite
    const finalImage = await compositeHairOntoOriginal(
      userPhoto,
      generatedResult.image,
      maskResult.hairMask
    );

    return {
      success: true,
      resultImage: finalImage,
    };

  } catch (error) {
    console.error('Reference generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function generateWithReference(
  userPhoto: string,
  referencePhoto: string,
  settings: HairSettings
): Promise<{ success: boolean; image?: string; error?: string }> {
  const userBase64 = userPhoto.includes('base64,') ? userPhoto.split('base64,')[1] : userPhoto;
  const refBase64 = referencePhoto.includes('base64,') ? referencePhoto.split('base64,')[1] : referencePhoto;

  let userMime = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) userMime = 'image/png';

  let refMime = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) refMime = 'image/png';

  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural' ? `Apply hair color: ${colorOption.prompt}.` : '';

  const prompt = `Copy the HAIRSTYLE from the second image onto the person in the first image.

${colorPrompt}

CRITICAL RULES:
1. First image = the person (keep their face EXACTLY the same)
2. Second image = the hairstyle to copy
3. Keep the person's face, pose, background unchanged
4. Only change their hair to match the reference hairstyle
5. The person must still be recognizable as the same person

Generate the image with the reference hairstyle applied.`;

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
      console.error('Gemini reference error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      return { success: false, error: 'No content generated' };
    }

    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);
    if (imagePart?.inlineData) {
      return {
        success: true,
        image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      };
    }

    return { success: false, error: 'No image in response' };

  } catch (error) {
    console.error('Reference generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
