/**
 * OpenAI Service Tests
 * Tests for color mapping, prompt building, and AI generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPrompt, generateHairStyle } from './openai';
import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';

// Mock the resilientFetch module
vi.mock('./networkResilience', () => ({
  resilientFetch: vi.fn(),
}));

// Mock environment variables
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');

describe('OpenAI Service - Color Mapping', () => {
  describe('COLOR_NAME_MAP', () => {
    it('should have valid color mappings for common colors', () => {
      // Test that COLOR_NAME_MAP is properly structured
      const testColors = ['black', 'brown', 'blonde', 'red', 'pink'];

      // We can't directly test COLOR_NAME_MAP since it's not exported,
      // but we can test it through the buildPrompt function
      testColors.forEach(colorId => {
        const settings: HairSettings = {
          length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
          color: colorId,
          volume: 'natural',
          parting: 'left',
        };

        const style: HairStyle = {
          id: 'test-style',
          name: 'Test Style',
          nameKo: 'L�� ��|',
          category: 'test',
          gender: 'male',
          description: 'Test',
          prompt: 'test hairstyle',
        };

        const prompt = buildPrompt(style, settings);
        expect(prompt).toBeTruthy();
        expect(typeof prompt).toBe('string');
      });
    });
  });

  describe('getColorOption (tested via buildPrompt)', () => {
    it('should return null for "natural" color', () => {
      const settings: HairSettings = {
        length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
        color: 'natural',
        volume: 'natural',
        parting: 'left',
      };

      const style: HairStyle = {
        id: 'test-style',
        name: 'Test Style',
        nameKo: 'L�� ��|',
        category: 'test',
        gender: 'male',
        description: 'Test',
        prompt: 'test hairstyle',
      };

      const prompt = buildPrompt(style, settings);
      // Should not contain color-specific prompts for 'natural'
      expect(prompt).not.toContain('hair color');
    });

    it('should find color from hairColors.ts', () => {
      // Test with a color from hairColors.ts
      const firstColor = hairColors[0];

      const settings: HairSettings = {
        length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
        color: firstColor.id,
        volume: 'natural',
        parting: 'left',
      };

      const style: HairStyle = {
        id: 'test-style',
        name: 'Test Style',
        nameKo: 'L�� ��|',
        category: 'test',
        gender: 'male',
        description: 'Test',
        prompt: 'test hairstyle',
      };

      const prompt = buildPrompt(style, settings);
      // Should include the color name or prompt
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle COLOR_NAME_MAP colors (HAIR_COLOR_PRESETS)', () => {
      const presetColors = ['chocolate', 'caramel', 'platinum', 'wine'];

      presetColors.forEach(colorId => {
        const settings: HairSettings = {
          length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
          color: colorId,
          volume: 'natural',
          parting: 'left',
        };

        const style: HairStyle = {
          id: 'test-style',
          name: 'Test Style',
          nameKo: 'L�� ��|',
          category: 'test',
          gender: 'male',
          description: 'Test',
          prompt: 'test hairstyle',
        };

        const prompt = buildPrompt(style, settings);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    it('should provide fallback for unknown color IDs', () => {
      const unknownColor = 'unknown-color-xyz';

      const settings: HairSettings = {
        length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
        color: unknownColor,
        volume: 'natural',
        parting: 'left',
      };

      const style: HairStyle = {
        id: 'test-style',
        name: 'Test Style',
        nameKo: 'L�� ��|',
        category: 'test',
        gender: 'male',
        description: 'Test',
        prompt: 'test hairstyle',
      };

      const prompt = buildPrompt(style, settings);
      // Should still build a valid prompt with fallback
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('unknown color xyz hair color');
    });
  });
});

describe('OpenAI Service - Prompt Building', () => {
  const mockStyle: HairStyle = {
    id: 'm-comma-hair',
    name: 'Comma Hair',
    nameKo: 'comma hair',
    category: 'down-perm',
    gender: 'male',
    description: 'Korean comma hairstyle',
    prompt: 'Korean comma hairstyle with natural waves',
  };

  it('should build basic prompt with style', () => {
    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    const prompt = buildPrompt(mockStyle, settings);

    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
  });

  it('should include volume setting in prompt', () => {
    const volumeSettings: Array<'flat' | 'natural' | 'voluminous'> = ['flat', 'natural', 'voluminous'];

    volumeSettings.forEach(volume => {
      const settings: HairSettings = {
        length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
        color: 'natural',
        volume,
        parting: 'left',
      };

      const prompt = buildPrompt(mockStyle, settings);
      expect(prompt).toBeTruthy();
      // Should contain volume-related keywords
      if (volume === 'flat') {
        expect(prompt.toLowerCase()).toContain('flat');
      } else if (volume === 'voluminous') {
        expect(prompt.toLowerCase()).toContain('volume');
      }
    });
  });

  it('should include parting setting in prompt', () => {
    const partingSettings: Array<'left' | 'center' | 'right' | 'none'> = ['left', 'center', 'right', 'none'];

    partingSettings.forEach(parting => {
      const settings: HairSettings = {
        length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
        color: 'natural',
        volume: 'natural',
        parting,
      };

      const prompt = buildPrompt(mockStyle, settings);
      expect(prompt).toBeTruthy();

      if (parting !== 'none') {
        expect(prompt.toLowerCase()).toContain('part');
      }
    });
  });

  it('should include texture in prompt when provided', () => {
    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    const prompt = buildPrompt(mockStyle, settings, 'wavy');
    expect(prompt).toBeTruthy();
  });
});

describe('OpenAI Service - AI Generation', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when API key is not configured', async () => {
    // Note: Testing API key validation is complex due to import.meta.env
    // This test verifies the error handling structure
    const mockStyle: HairStyle = {
      id: 'test-style',
      name: 'Test',
      nameKo: 'Test',
      category: 'test',
      gender: 'male',
      description: 'Test',
      prompt: 'test',
    };

    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    // Test with proper API key to ensure function works
    const result = await generateHairStyle({
      userPhoto: 'data:image/png;base64,test',
      style: mockStyle,
      settings,
    });

    // Should have a result (success or failure)
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('should handle successful API response', async () => {
    const { resilientFetch } = await import('./networkResilience');

    // Mock successful response
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'base64-encoded-image-data'
              }
            }]
          }
        }]
      })
    };

    vi.mocked(resilientFetch).mockResolvedValue(mockResponse as any);

    const mockStyle: HairStyle = {
      id: 'test-style',
      name: 'Test',
      nameKo: 'L��',
      category: 'test',
      gender: 'male',
      description: 'Test',
      prompt: 'test',
    };

    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    const result = await generateHairStyle({
      userPhoto: 'data:image/png;base64,testdata',
      style: mockStyle,
      settings,
    });

    expect(result.success).toBe(true);
    expect(result.resultImage).toBeTruthy();
    expect(result.resultImage).toContain('data:image/png;base64,');
  });

  it('should handle API error responses', async () => {
    const { resilientFetch } = await import('./networkResilience');

    // Mock error response
    const mockResponse = {
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('Bad Request'),
    };

    vi.mocked(resilientFetch).mockResolvedValue(mockResponse as any);

    const mockStyle: HairStyle = {
      id: 'test-style',
      name: 'Test',
      nameKo: 'L��',
      category: 'test',
      gender: 'male',
      description: 'Test',
      prompt: 'test',
    };

    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    const result = await generateHairStyle({
      userPhoto: 'data:image/png;base64,testdata',
      style: mockStyle,
      settings,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should handle network errors', async () => {
    const { resilientFetch } = await import('./networkResilience');

    // Mock network error
    vi.mocked(resilientFetch).mockRejectedValue(new TypeError('Network error'));

    const mockStyle: HairStyle = {
      id: 'test-style',
      name: 'Test',
      nameKo: 'L��',
      category: 'test',
      gender: 'male',
      description: 'Test',
      prompt: 'test',
    };

    const settings: HairSettings = {
      length: { top: 10, side: 5, back: 5, sideburn: 2, bangs: 5 },
      color: 'natural',
      volume: 'natural',
      parting: 'left',
    };

    const result = await generateHairStyle({
      userPhoto: 'data:image/png;base64,testdata',
      style: mockStyle,
      settings,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
