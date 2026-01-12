import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

// OpenAI GPT-Image-1.5 - best for face preservation and image editing
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Gemini for text analysis only
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

// Generate hair style using OpenAI GPT-Image-1.5 API
// Best for face preservation and high-quality image editing
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

  const stylePrompt = buildPrompt(style, settings, texture);

  try {
    // Extract base64 data
    const base64Data = userPhoto.includes('base64,')
      ? userPhoto.split('base64,')[1]
      : userPhoto;

    console.log('Calling OpenAI GPT-Image-1.5 API...');
    console.log('Image size (base64 length):', base64Data.length);

    // Get color information for explicit mention in prompt
    const colorOption = hairColors.find((c) => c.id === settings.color);
    const hasCustomColor = colorOption && colorOption.id !== 'natural';

    // Build color instruction
    let colorInstruction = '';
    if (hasCustomColor) {
      colorInstruction = ` Change hair color to ${colorOption.prompt}.`;
    }

    // Concise prompt for GPT-Image-1.5 - focuses on face preservation
    const prompt = `Edit this photo: Change ONLY the hair to ${style.name} (${style.nameKo}) style. ${stylePrompt}.${colorInstruction}

CRITICAL RULES:
1. DO NOT change the face AT ALL - keep exact same facial features, face shape, eyes, nose, mouth, skin
2. DO NOT change age, gender, or identity - person must be 100% recognizable
3. ONLY modify the hair - style, shape, volume, length
4. Keep same: background, lighting, clothing, pose

The output must show the EXACT same person with only the hairstyle changed.`;

    // Convert base64 to blob for FormData
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Use OpenAI Images Edit API with gpt-image-1.5 model
    const formData = new FormData();
    formData.append('model', 'gpt-image-1.5');
    formData.append('image', blob, 'photo.png');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.error?.message || errorText;

        if (response.status === 400) {
          return { success: false, error: 'Invalid image format. Please try a different photo.' };
        } else if (response.status === 401) {
          return { success: false, error: 'API access denied. Please check API key.' };
        } else if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment and try again.' };
        } else if (errorMessage.includes('safety') || errorMessage.includes('content_policy')) {
          return { success: false, error: 'Image was blocked by safety filters. Please try a different photo.' };
        }

        return { success: false, error: `API Error: ${errorMessage}` };
      } catch {
        return { success: false, error: `API Error: ${response.status}` };
      }
    }

    const data = await response.json();
    console.log('OpenAI GPT-Image-1.5 response received');

    // Extract the generated image from response
    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      // OpenAI returns either b64_json or url
      if (imageData.b64_json) {
        const resultImage = `data:image/png;base64,${imageData.b64_json}`;
        return {
          success: true,
          resultImage,
        };
      } else if (imageData.url) {
        // Fetch the image from URL and convert to base64
        const imageResponse = await fetch(imageData.url);
        const imageBlob = await imageResponse.blob();
        const reader = new FileReader();

        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({
              success: true,
              resultImage: reader.result as string,
            });
          };
          reader.readAsDataURL(imageBlob);
        });
      }
    }

    return {
      success: false,
      error: 'AI could not generate image. Please try again.',
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

// Generate hairstyle from a reference photo using OpenAI GPT-Image-1.5
interface GenerateFromReferenceParams {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}

export const generateFromReference = async (
  params: GenerateFromReferenceParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, referencePhoto: _referencePhoto, settings } = params;
  // Note: GPT-Image-1.5 edit API only takes one image, so we describe the style in prompt

  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  // Extract base64 data for user photo
  const userBase64 = userPhoto.includes('base64,') ? userPhoto.split('base64,')[1] : userPhoto;

  // Build color modification if not natural
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const hasCustomColor = colorOption && colorOption.id !== 'natural';
  const colorInstruction = hasCustomColor ? ` Change hair color to ${colorOption.prompt}.` : '';

  try {
    console.log('Generating from reference with GPT-Image-1.5...');

    const prompt = `Edit this photo: Apply a new hairstyle to this person.${colorInstruction}

CRITICAL RULES:
1. DO NOT change the face AT ALL - keep exact same facial features, face shape, eyes, nose, mouth, skin
2. DO NOT change age, gender, or identity - person must be 100% recognizable
3. ONLY modify the hair - style, shape, volume, length
4. Keep same: background, lighting, clothing, pose

The output must show the EXACT same person with only the hairstyle changed.`;

    // Convert base64 to blob for FormData
    const byteCharacters = atob(userBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Use OpenAI Images Edit API with gpt-image-1.5
    const formData = new FormData();
    formData.append('model', 'gpt-image-1.5');
    formData.append('image', blob, 'photo.png');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI reference generation error:', response.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment.' };
        }
        if (errorJson.error?.message?.includes('content_policy')) {
          return { success: false, error: 'Image blocked by safety filters. Try a different photo.' };
        }
      } catch {
        // ignore parse error
      }

      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    console.log('OpenAI GPT-Image-1.5 reference response received');

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      if (imageData.b64_json) {
        const resultImage = `data:image/png;base64,${imageData.b64_json}`;
        return { success: true, resultImage };
      } else if (imageData.url) {
        const imageResponse = await fetch(imageData.url);
        const imageBlob = await imageResponse.blob();
        const reader = new FileReader();

        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({ success: true, resultImage: reader.result as string });
          };
          reader.readAsDataURL(imageBlob);
        });
      }
    }

    return { success: false, error: 'AI could not generate image. Please try again.' };
  } catch (error) {
    console.error('Error generating from reference:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
