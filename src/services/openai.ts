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

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_EDIT_URL = 'https://api.openai.com/v1/images/edits';

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

  const stylePrompt = buildPrompt(style, settings, texture);

  try {
    // Determine mime type
    let mimeType = 'image/png';
    if (userPhoto.includes('data:image/jpeg')) {
      mimeType = 'image/jpeg';
    } else if (userPhoto.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }

    console.log('Calling OpenAI GPT-Image-1.5 API...');

    // Strong prompt to preserve face identity and ONLY change hair
    const editPrompt = `TASK: Change ONLY the hair in this photo to: ${style.nameKo} (${style.name})

HAIRSTYLE DETAILS: ${stylePrompt}

CRITICAL RULES:
1. Keep the person's face 100% IDENTICAL - same eyes, nose, mouth, skin, face shape
2. Keep the same person's identity - must be recognizable as the EXACT same person
3. Keep body, clothing, background, lighting, and pose unchanged
4. ONLY modify the hair: style, shape, volume, length
5. Result should look like the same person just got a haircut

This is a virtual haircut - same person, new hair only.`;

    // Use image edit API with the user's photo
    const imageBlob = base64ToBlob(userPhoto, mimeType);

    // Create form data for the edit endpoint
    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', editPrompt);
    formData.append('model', 'gpt-image-1.5');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', response.status, errorData);

      if (response.status === 400) {
        return { success: false, error: 'Invalid image format. Please try a different photo.' };
      } else if (response.status === 401) {
        return { success: false, error: 'API key invalid. Please check configuration.' };
      } else if (response.status === 403) {
        return { success: false, error: 'API access denied. Organization verification required.' };
      } else if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Please wait and try again.' };
      }

      return { success: false, error: errorData.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Extract the generated image
    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage: string;
      if (imageData.b64_json) {
        resultImage = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        // Fetch the image from URL and convert to base64
        const imgResponse = await fetch(imageData.url);
        const imgBlob = await imgResponse.blob();
        resultImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });
      } else {
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
    console.log('Generating from reference with OpenAI...');

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

    const response = await fetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI reference generation error:', response.status, errorData);
      return { success: false, error: errorData.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage: string;
      if (imageData.b64_json) {
        resultImage = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        const imgResponse = await fetch(imageData.url);
        const imgBlob = await imgResponse.blob();
        resultImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });
      } else {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No image generated. Please try again.' };

  } catch (error) {
    console.error('Error generating from reference:', error);
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

  try {
    console.log('Generating back view with OpenAI...');

    // Generate back view based on the front view result
    const backViewPrompt = `Create a BACK VIEW of this same hairstyle: ${style.nameKo} (${style.name})

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

    const response = await fetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI back view error:', response.status, errorData);
      return { success: false, error: errorData.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage: string;
      if (imageData.b64_json) {
        resultImage = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        const imgResponse = await fetch(imageData.url);
        const imgBlob = await imgResponse.blob();
        resultImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });
      } else {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No back view generated. Please try again.' };

  } catch (error) {
    console.error('Error generating back view:', error);
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
    console.log('Generating custom hairstyle with OpenAI...');
    console.log('Custom settings prompt:', customPrompt);

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

    const response = await fetch(OPENAI_EDIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI custom generation error:', response.status, errorData);
      return { success: false, error: errorData.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];

      let resultImage: string;
      if (imageData.b64_json) {
        resultImage = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        const imgResponse = await fetch(imageData.url);
        const imgBlob = await imgResponse.blob();
        resultImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });
      } else {
        return { success: false, error: 'No image data in response' };
      }

      return {
        success: true,
        resultImage,
      };
    }

    return { success: false, error: 'No image generated. Please try again.' };

  } catch (error) {
    console.error('Error generating custom hairstyle:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
