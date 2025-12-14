import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

  // Add quality prompts
  parts.push('high quality, detailed, professional photography, studio lighting');

  return parts.join(', ');
};

// Generate hair style using AI
export const generateHairStyle = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, style, settings, texture } = params;

  const prompt = buildPrompt(style, settings, texture);

  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: userPhoto,
        prompt,
        styleId: style.id,
        settings: {
          length: settings.length,
          color: settings.color,
          volume: settings.volume,
          parting: settings.parting,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();

    return {
      success: true,
      resultImage: data.output || data.resultImage,
    };
  } catch (error) {
    console.error('Error generating hair style:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Mock function for development/testing
export const generateHairStyleMock = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Return the original image as mock (in real app, this would be AI-generated)
  return {
    success: true,
    resultImage: params.userPhoto,
  };
};

// Analyze hair texture from image
export const analyzeHairTexture = async (
  imageBase64: string
): Promise<HairTexture | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-texture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze texture');
    }

    const data = await response.json();
    return data.texture as HairTexture;
  } catch (error) {
    console.error('Error analyzing hair texture:', error);
    return null;
  }
};

// Check API status
export const checkApiStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
