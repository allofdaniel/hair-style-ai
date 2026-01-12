/**
 * n8n Backend Service
 *
 * Uses n8n workflow automation to test multiple AI models for hair generation.
 * Proxmox n8n server: http://192.168.50.88:5678
 */

import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { buildPrompt } from './hairGeneration';

// n8n server configuration
const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'http://192.168.50.88:5678';
const N8N_WEBHOOK_PATH = '/webhook/hair-style-generate';

interface N8nGenerateParams {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  texture?: HairTexture;
  model?: 'openai' | 'gemini' | 'stability' | 'all';
}

interface N8nGenerateResponse {
  success: boolean;
  resultImage?: string;
  model?: string;
  allResults?: {
    model: string;
    image?: string;
    error?: string;
  }[];
  error?: string;
}

/**
 * Generate hairstyle using n8n backend
 */
export async function generateWithN8n(
  params: N8nGenerateParams
): Promise<N8nGenerateResponse> {
  const { userPhoto, style, settings, texture, model = 'openai' } = params;

  const stylePrompt = buildPrompt(style, settings, texture);

  // Build full prompt for image generation
  const fullPrompt = `Transform this person's hairstyle to: ${style.nameKo} (${style.name})

Style details: ${stylePrompt}

CRITICAL RULES:
1. Keep the person's FACE exactly the same - same eyes, nose, mouth, skin tone
2. Keep the same pose, angle, and background
3. Only change the HAIR to match the target style
4. Make the new hairstyle look natural and professional
5. The person should still be recognizable as the same person

Generate the image with the new hairstyle applied.`;

  try {
    console.log('[n8n] Sending request to n8n backend...');
    console.log('[n8n] URL:', `${N8N_BASE_URL}${N8N_WEBHOOK_PATH}`);
    console.log('[n8n] Model:', model);

    const response = await fetch(`${N8N_BASE_URL}${N8N_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image: userPhoto,
        style: {
          id: style.id,
          name: style.name,
          nameKo: style.nameKo,
        },
        settings,
        texture,
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[n8n] Error:', response.status, errorText);
      return {
        success: false,
        error: `n8n backend error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[n8n] Response received:', data);

    // Handle different response formats from n8n
    if (data.data && Array.isArray(data.data)) {
      // OpenAI DALL-E response format
      const imageData = data.data[0];
      if (imageData.url) {
        return {
          success: true,
          resultImage: imageData.url,
          model: 'openai',
        };
      } else if (imageData.b64_json) {
        return {
          success: true,
          resultImage: `data:image/png;base64,${imageData.b64_json}`,
          model: 'openai',
        };
      }
    }

    // Direct image URL
    if (data.url) {
      return {
        success: true,
        resultImage: data.url,
        model: model,
      };
    }

    // Direct base64 image
    if (data.image) {
      return {
        success: true,
        resultImage: data.image.startsWith('data:')
          ? data.image
          : `data:image/png;base64,${data.image}`,
        model: model,
      };
    }

    return {
      success: false,
      error: 'Invalid response format from n8n',
    };

  } catch (error) {
    console.error('[n8n] Request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'n8n request failed',
    };
  }
}

/**
 * Test n8n connection
 */
export async function testN8nConnection(): Promise<{
  connected: boolean;
  url: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/healthz`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return {
      connected: response.ok,
      url: N8N_BASE_URL,
    };
  } catch (error) {
    return {
      connected: false,
      url: N8N_BASE_URL,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get n8n backend URL
 */
export function getN8nUrl(): string {
  return N8N_BASE_URL;
}
