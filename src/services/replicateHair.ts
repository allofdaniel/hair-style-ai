import { logger } from './logger';
/**
 * Replicate API Hair Transformation Service
 */

import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';
import { resilientFetch } from './networkResilience';

const REPLICATE_API_URL = (import.meta.env.VITE_REPLICATE_API_URL || '').trim();
const REPLICATE_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1200,
  maxDelay: 15000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

const fetchWithRetry = (url: string, options: RequestInit): Promise<Response> => {
  return resilientFetch(url, options, REPLICATE_RETRY_CONFIG);
};

const getReplicateHealthUrl = (): string => {
  if (!REPLICATE_API_URL) return '';
  return REPLICATE_API_URL.replace('/api/generate-replicate', '');
};

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

  parts.push(style.prompt);

  const colorOption = hairColors.find((c) => c.id === settings.color);
  if (colorOption && colorOption.id !== 'natural') {
    parts.push(colorOption.prompt);
  }

  const volumePrompts: Record<string, string> = {
    flat: 'flat sleek low volume hair',
    natural: 'natural medium volume hair',
    voluminous: 'high volume full body hair',
  };
  parts.push(volumePrompts[settings.volume]);

  const partingPrompts: Record<string, string> = {
    left: 'parted on the left side',
    center: 'center parted',
    right: 'parted on the right side',
    none: 'with no visible part',
  };
  parts.push(partingPrompts[settings.parting]);

  return parts.join(', ');
}

const validateEndpoint = (): boolean => Boolean(REPLICATE_API_URL);

/**
 * Generate hair transformation using Replicate's flux-kontext-pro
 */
export async function applyReplicateHair(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, style, settings } = params;

  if (!validateEndpoint()) {
    return {
      success: false,
      error: 'Replicate API URL is not configured. Please set VITE_REPLICATE_API_URL.',
    };
  }

  try {
    const prompt = buildHairPrompt(style, settings);

    const response = await fetchWithRetry(REPLICATE_API_URL, {
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
      logger.error('Replicate API error:', response.status, errorData);
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
    logger.error('Replicate hair transformation error:', error);
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
  if (!validateEndpoint()) return false;

  try {
    const healthEndpoint = getReplicateHealthUrl();
    if (!healthEndpoint) return false;

    const response = await fetchWithRetry(healthEndpoint, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
}