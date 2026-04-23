/**
 * Hair Styles Data Validation Tests
 * Tests for hairStyles and hairColors data integrity
 */

import { describe, it, expect } from 'vitest';
import {
  hairStyles,
  maleCategories,
  femaleCategories,
  malePopularStyleIds,
  femalePopularStyleIds,
  hairTextures,
  hairColors,
} from './hairStyles';
import type { HairStyle } from '../stores/useAppStore';

describe('Hair Styles Data Structure', () => {
  it('should have hairStyles array', () => {
    expect(hairStyles).toBeDefined();
    expect(Array.isArray(hairStyles)).toBe(true);
    expect(hairStyles.length).toBeGreaterThan(0);
  });

  it('should have valid structure for each hairstyle', () => {
    hairStyles.forEach((style: HairStyle) => {
      expect(style.id).toBeDefined();
      expect(typeof style.id).toBe('string');
      expect(style.id.length).toBeGreaterThan(0);

      expect(style.name).toBeDefined();
      expect(typeof style.name).toBe('string');

      expect(style.nameKo).toBeDefined();
      expect(typeof style.nameKo).toBe('string');

      expect(style.category).toBeDefined();
      expect(typeof style.category).toBe('string');

      expect(style.gender).toBeDefined();
      expect(['male', 'female']).toContain(style.gender);

      expect(style.description).toBeDefined();
      expect(typeof style.description).toBe('string');

      expect(style.prompt).toBeDefined();
      expect(typeof style.prompt).toBe('string');
      expect(style.prompt.length).toBeGreaterThan(0);
    });
  });

  it('should have unique style IDs', () => {
    const ids = hairStyles.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Hair Colors Data Structure', () => {
  it('should have hairColors array', () => {
    expect(hairColors).toBeDefined();
    expect(Array.isArray(hairColors)).toBe(true);
    expect(hairColors.length).toBeGreaterThan(0);
  });

  it('should have valid structure for each color', () => {
    hairColors.forEach(color => {
      expect(color.id).toBeDefined();
      expect(typeof color.id).toBe('string');
      expect(color.id.length).toBeGreaterThan(0);

      expect(color.nameKo).toBeDefined();
      expect(typeof color.nameKo).toBe('string');

      expect(color.hex).toBeDefined();
      expect(typeof color.hex).toBe('string');

      expect(color.category).toBeDefined();
      expect(['natural', 'fashion', 'highlight', 'ombre']).toContain(color.category);
    });
  });

  it('should have unique color IDs', () => {
    const ids = hairColors.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
