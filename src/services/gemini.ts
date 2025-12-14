import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';
import { detectFace, composeFaceOntoResult, type FaceRegion } from './faceDetection';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Gemini 2.5 Flash Image - stable image generation model
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

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

  // 얼굴 감지 수행
  let faceRegion: FaceRegion | null = null;

  try {
    console.log('Detecting face in user photo...');
    faceRegion = await detectFace(userPhoto);

    if (faceRegion) {
      console.log('Face detected:', faceRegion);
    } else {
      console.warn('No face detected, using generic protection prompt');
    }
  } catch (error) {
    console.error('Face detection error:', error);
    // 얼굴 감지 실패해도 계속 진행
  }

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

    // Try with a simpler, more direct prompt
    const simplePrompt = `Edit this photo to give the person this hairstyle: ${style.nameKo} (${style.name}).

Style details: ${stylePrompt}

CRITICAL RULES:
1. Keep the person's face EXACTLY the same - same eyes, nose, mouth, skin
2. ONLY change the hair - style, shape, and volume
3. Make it look like a real photo, not AI-generated
4. Keep the same background, clothing, and lighting

Generate the edited image.`;

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
      let resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // 🔒 얼굴 보존: AI 결과에 원본 얼굴을 합성 (얼굴이 감지된 경우)
      if (faceRegion) {
        console.log('Compositing original face onto AI result...');
        try {
          resultImage = await composeFaceOntoResult(userPhoto, resultImage, faceRegion);
          console.log('Face composition completed - original face preserved');
        } catch (composeError) {
          console.error('Face composition failed, using AI result as-is:', composeError);
          // 합성 실패 시 AI 결과 그대로 사용 (fallback)
        }
      }

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

  // 🔒 얼굴 감지 수행 (합성용)
  let faceRegion: FaceRegion | null = null;
  try {
    console.log('Detecting face for reference generation...');
    faceRegion = await detectFace(userPhoto);
    if (faceRegion) {
      console.log('Face detected for reference generation:', faceRegion);
    }
  } catch (error) {
    console.error('Face detection error:', error);
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
  const colorPrompt = colorOption && colorOption.id !== 'natural' ? `Apply hair color: ${colorOption.prompt}.` : '';

  try {
    console.log('Generating from reference...');

    // Simpler prompt for reference-based generation
    const simpleRefPrompt = `I have two images:
1. FIRST IMAGE: The person whose hair I want to change
2. SECOND IMAGE: The hairstyle I want to copy

Please edit the FIRST image to have the same hairstyle as shown in the SECOND image.

${colorPrompt ? `Also apply this hair color: ${colorPrompt}` : ''}

IMPORTANT:
- Keep the person's face EXACTLY the same
- ONLY change the hair to match the reference hairstyle
- Make it look natural and realistic
- Keep same background and lighting

Generate the edited image.`;

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
      let resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      // 🔒 얼굴 보존: AI 결과에 원본 얼굴을 합성 (얼굴이 감지된 경우)
      if (faceRegion) {
        console.log('Compositing original face onto reference result...');
        try {
          resultImage = await composeFaceOntoResult(userPhoto, resultImage, faceRegion);
          console.log('Face composition completed - original face preserved');
        } catch (composeError) {
          console.error('Face composition failed, using AI result as-is:', composeError);
        }
      }

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
