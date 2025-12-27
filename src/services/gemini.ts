import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Gemini 2.5 Flash Image - production-ready image generation model (Dec 2025)
// Best for: fast generation, multi-image fusion, character consistency, local edits
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-generation:generateContent';

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

// Build the AI prompt based on selected options
export const buildPrompt = (
  style: HairStyle,
  settings: HairSettings,
  texture?: HairTexture
): string => {
  const parts: string[] = [];

  // Base style prompt
  parts.push(style.prompt);

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

// Generate hair style using Gemini API with face detection
export const generateHairStyle = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, style, settings, texture } = params;

  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: 'API key not configured',
    };
  }

  const stylePrompt = buildPrompt(style, settings, texture);

  try {
    // Extract base64 data
    const base64Data = userPhoto.includes('base64,')
      ? userPhoto.split('base64,')[1]
      : userPhoto;

    // Determine mime type
    let mimeType = 'image/jpeg';
    if (userPhoto.includes('data:image/png')) {
      mimeType = 'image/png';
    } else if (userPhoto.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }

    console.log('Calling Gemini Image Generation API...');
    console.log('Image size (base64 length):', base64Data.length);

    // Get color information for explicit mention in prompt
    const colorOption = hairColors.find((c) => c.id === settings.color);
    const hasCustomColor = colorOption && colorOption.id !== 'natural';

    // Build color instruction - make it very prominent and specific
    let colorInstruction = '';
    let colorReminder = '';
    if (hasCustomColor) {
      colorInstruction = `

★★★ MANDATORY HAIR COLOR CHANGE ★★★
The hair MUST be dyed to: ${colorOption.nameKo} (${colorOption.prompt})
This is NOT optional - the final result MUST show this hair color.
Do NOT keep the original hair color - CHANGE IT to ${colorOption.prompt}.`;
      colorReminder = ` The hair color MUST be ${colorOption.prompt} - this is the most important requirement after preserving the face.`;
    }

    // Strong prompt to preserve face identity and ONLY change hair
    const simplePrompt = `You are a professional hair stylist and colorist photo editor. Your job is to change the HAIR in this photo.

TARGET HAIRSTYLE: ${style.nameKo} (${style.name})
STYLE DETAILS: ${stylePrompt}${colorInstruction}

ABSOLUTE RULES - VIOLATION IS NOT ALLOWED:
1. DO NOT change the face AT ALL - eyes, nose, mouth, eyebrows, skin tone, face shape, facial features must be 100% IDENTICAL to the original
2. DO NOT change the person's identity - they must be recognizable as the SAME person
3. DO NOT change body, clothing, background, lighting, or pose
4. ONLY modify the hair: hairstyle, hair shape, hair volume, hair length${hasCustomColor ? ', and MOST IMPORTANTLY change the hair COLOR to ' + colorOption.prompt : ''}
5. The result must look like the SAME person just visited a salon${hasCustomColor ? ' and got their hair dyed to ' + colorOption.prompt : ''}

${hasCustomColor ? '⚠️ CRITICAL: The hair color MUST be changed to ' + colorOption.prompt + '. Do NOT keep the original hair color!' : ''}

Generate the photo with the hair changed to match the target hairstyle.${colorReminder}`;

    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: simplePrompt,
              },
            ],
          },
        ],
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
      console.error('Gemini API error:', response.status, errorText);

      // Parse error for better user message
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.error?.message || errorText;

        if (response.status === 400) {
          return { success: false, error: 'Invalid image format. Please try a different photo.' };
        } else if (response.status === 403) {
          return { success: false, error: 'API access denied. Please check API key.' };
        } else if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment and try again.' };
        } else if (errorMessage.includes('safety')) {
          return { success: false, error: 'Image was blocked by safety filters. Please try a different photo.' };
        }

        return { success: false, error: `API Error: ${errorMessage}` };
      } catch {
        return { success: false, error: `API Error: ${response.status}` };
      }
    }

    const data = await response.json();
    console.log('Gemini response received');

    // Check for blocked response
    if (data.promptFeedback?.blockReason) {
      console.error('Prompt blocked:', data.promptFeedback.blockReason);
      return { success: false, error: 'Request blocked by safety filters. Please try a different photo.' };
    }

    // Extract the generated image from response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in response:', data);
      return { success: false, error: 'AI could not generate image. Please try again.' };
    }

    // Check finish reason
    const finishReason = candidates[0].finishReason;
    if (finishReason === 'SAFETY') {
      return { success: false, error: 'Image generation blocked by safety filters.' };
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      console.error('No parts in response:', candidates[0]);
      return { success: false, error: 'No content generated. Please try again.' };
    }

    // Find the image part in the response
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);
    if (imagePart && imagePart.inlineData) {
      const resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // Note: Face composition disabled - AI results are better without manual face overlay
      // The Gemini model preserves face identity well on its own

      return {
        success: true,
        resultImage,
      };
    }

    // If no image, check for text response (model might explain why it couldn't generate)
    const textPart = parts.find((part: { text?: string }) => part.text);
    if (textPart && textPart.text) {
      console.log('Model text response:', textPart.text);
      // If model returned text, it likely couldn't generate the image
      return {
        success: false,
        error: 'AI could not generate the hairstyle. Please try a different style or photo.',
      };
    }

    return {
      success: false,
      error: 'Unexpected response from AI. Please try again.',
    };

  } catch (error) {
    console.error('Error generating hair style:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Mock function for development/testing (fallback)
export const generateHairStyleMock = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Return the original image as mock
  return {
    success: true,
    resultImage: params.userPhoto,
  };
};

// Analyze a reference photo to extract hairstyle information
interface HairAnalysisResult {
  success: boolean;
  analysis?: {
    styleName: string;
    styleNameKo: string;
    description: string;
    characteristics: string[];
    length: string;
    texture: string;
    volume: string;
    color: string;
  };
  error?: string;
}

const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const analyzeReferencePhoto = async (referencePhoto: string): Promise<HairAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'API key not configured' };
  }

  const base64Data = referencePhoto.includes('base64,')
    ? referencePhoto.split('base64,')[1]
    : referencePhoto;

  let mimeType = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) mimeType = 'image/png';
  else if (referencePhoto.includes('data:image/webp')) mimeType = 'image/webp';

  const prompt = `Analyze the hairstyle in this photo. Provide a detailed analysis in JSON format:

{
  "styleName": "English name of the hairstyle (e.g., 'Two Block Cut', 'Layered Bob')",
  "styleNameKo": "Korean name (e.g., '투블럭컷', '레이어드 밥')",
  "description": "Brief description of this hairstyle in Korean",
  "characteristics": ["List", "of", "key", "features"],
  "length": "short/medium/long",
  "texture": "straight/wavy/curly/permed",
  "volume": "flat/natural/voluminous",
  "color": "natural black/dark brown/light brown/blonde/other"
}

IMPORTANT: Return ONLY the JSON, no additional text.`;

  try {
    const response = await fetch(`${GEMINI_TEXT_URL}?key=${GEMINI_API_KEY}`, {
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
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      await response.text();
      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text);

    if (textPart?.text) {
      const analysis = JSON.parse(textPart.text);
      return { success: true, analysis };
    }

    return { success: false, error: 'Could not analyze the photo' };
  } catch (error) {
    console.error('Analysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Analysis failed' };
  }
};

// Generate hairstyle from a reference photo
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
    return { success: false, error: 'API key not configured' };
  }

  // Extract base64 data for both images
  const userBase64 = userPhoto.includes('base64,') ? userPhoto.split('base64,')[1] : userPhoto;
  const refBase64 = referencePhoto.includes('base64,') ? referencePhoto.split('base64,')[1] : referencePhoto;

  let userMime = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) userMime = 'image/png';

  let refMime = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) refMime = 'image/png';

  // Build color modification if not natural
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const hasCustomColor = colorOption && colorOption.id !== 'natural';

  let colorSection = '';
  let colorReminder = '';
  if (hasCustomColor) {
    colorSection = `
★★★ MANDATORY HAIR COLOR CHANGE ★★★
The hair MUST be dyed to: ${colorOption.nameKo} (${colorOption.prompt})
This is NOT optional - CHANGE the hair color to ${colorOption.prompt}.
Do NOT keep the original hair color from either photo.`;
    colorReminder = ` The final hair color MUST be ${colorOption.prompt}.`;
  }

  try {
    console.log('Generating from reference...');

    // Strong prompt for reference-based generation - preserve face identity
    const simpleRefPrompt = `You are a professional hair stylist and colorist photo editor. Your job is to copy the HAIRSTYLE from the reference photo.

TWO IMAGES PROVIDED:
- FIRST IMAGE: The person (CLIENT) - their face must NOT change at all
- SECOND IMAGE: The hairstyle to copy (REFERENCE)
${colorSection}

ABSOLUTE RULES - VIOLATION IS NOT ALLOWED:
1. The CLIENT's face must remain 100% IDENTICAL - same eyes, nose, mouth, eyebrows, skin tone, face shape
2. The CLIENT must be recognizable as the EXACT SAME PERSON after the edit
3. DO NOT blend or morph faces - keep the CLIENT's face completely unchanged
4. DO NOT change body, clothing, background, lighting, or pose
5. ONLY copy the HAIR from the reference: hairstyle shape, volume, length, styling${hasCustomColor ? ', and change the hair COLOR to ' + colorOption.prompt : ''}

${hasCustomColor ? '⚠️ CRITICAL: The hair color MUST be ' + colorOption.prompt + '. Do NOT use the original hair color!' : ''}

Generate the CLIENT's photo with the hair changed to match the REFERENCE hairstyle.${colorReminder}`;

    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: userMime, data: userBase64 } },
            { inlineData: { mimeType: refMime, data: refBase64 } },
            { text: simpleRefPrompt },
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
      console.error('Reference generation error:', response.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment.' };
        }
        if (errorJson.error?.message?.includes('safety')) {
          return { success: false, error: 'Image blocked by safety filters. Try a different photo.' };
        }
      } catch {
        // ignore parse error
      }

      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();

    // Check for blocked response
    if (data.promptFeedback?.blockReason) {
      return { success: false, error: 'Request blocked by safety filters.' };
    }

    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'AI could not generate image. Please try again.' };
    }

    if (candidates[0].finishReason === 'SAFETY') {
      return { success: false, error: 'Image generation blocked by safety filters.' };
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return { success: false, error: 'No content generated. Please try again.' };
    }

    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData);
    if (imagePart?.inlineData) {
      const resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // Note: Face composition disabled - AI results are better without manual face overlay

      return {
        success: true,
        resultImage,
      };
    }

    const textPart = parts.find((part: { text?: string }) => part.text);
    if (textPart?.text) {
      return { success: false, error: 'AI could not generate the hairstyle. Please try different photos.' };
    }

    return { success: false, error: 'Unexpected response. Please try again.' };
  } catch (error) {
    console.error('Error generating from reference:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
