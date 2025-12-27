/**
 * Replicate API Hair Transformation Service
 *
 * flux-kontext-pro 모델을 사용하여 헤어스타일만 변경하고 얼굴은 보존
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';

const REPLICATE_API_URL = 'http://localhost:3001/api/generate-replicate';

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
}

/**
 * Build hair style prompt from settings
 */
export function buildHairPrompt(
  style: HairStyle,
  settings: HairSettings
): string {
  const parts: string[] = [];

  // Base style
  parts.push(style.prompt);

  // Hair color
  const colorOption = hairColors.find((c) => c.id === settings.color);
  if (colorOption && colorOption.id !== 'natural') {
    parts.push(colorOption.prompt);
  }

  // Volume
  const volumePrompts: Record<string, string> = {
    flat: 'flat sleek low volume hair',
    natural: 'natural medium volume hair',
    voluminous: 'high volume full body hair',
  };
  parts.push(volumePrompts[settings.volume]);

  // Parting
  const partingPrompts: Record<string, string> = {
    left: 'parted on the left side',
    center: 'center parted',
    right: 'parted on the right side',
    none: 'with no visible part',
  };
  parts.push(partingPrompts[settings.parting]);

  return parts.join(', ');
}

/**
 * Generate hair transformation using Replicate's flux-kontext-pro
 */
export async function applyReplicateHair(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, style, settings } = params;

  try {
    const prompt = buildHairPrompt(style, settings);
    console.log('Replicate hair prompt:', prompt);

    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: userPhoto,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Replicate API error:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.success && data.resultImage) {
      return {
        success: true,
        resultImage: data.resultImage,
      };
    }

    return {
      success: false,
      error: data.error || 'Unknown error',
    };

  } catch (error) {
    console.error('Replicate hair transformation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if Replicate API server is available
 */
export async function checkReplicateServer(): Promise<boolean> {
  try {
    const response = await fetch(REPLICATE_API_URL.replace('/api/generate-replicate', ''), {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
}
