/**
 * useAppStore Zustand Store Tests
 * Tests for state management and persisted data
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { HairStyle } from './useAppStore';

describe('useAppStore - State Management', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = useAppStore.getState();
    reset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should have default state', () => {
    const state = useAppStore.getState();
    
    expect(state.gender).toBe('male');
    expect(state.userPhoto).toBeNull();
    expect(state.selectedStyle).toBeNull();
    expect(state.resultImage).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.credits).toBe(5); // Default free credits
    expect(state.subscriptionPlan).toBe('free');
  });

  it('should update user photo', () => {
    const { setUserPhoto } = useAppStore.getState();
    const testPhoto = 'data:image/png;base64,test';
    
    setUserPhoto(testPhoto);
    
    const state = useAppStore.getState();
    expect(state.userPhoto).toBe(testPhoto);
  });

  it('should update gender', () => {
    const { setGender } = useAppStore.getState();
    
    setGender('female');
    
    const state = useAppStore.getState();
    expect(state.gender).toBe('female');
  });

  it('should update selected style', () => {
    const { setSelectedStyle } = useAppStore.getState();
    const mockStyle: HairStyle = {
      id: 'test-style',
      name: 'Test',
      nameKo: '테스트',
      category: 'test',
      gender: 'male',
      description: 'Test style',
      prompt: 'test prompt',
    };
    
    setSelectedStyle(mockStyle);
    
    const state = useAppStore.getState();
    expect(state.selectedStyle).toEqual(mockStyle);
  });

  it('should update hair settings', () => {
    const { updateHairSettings } = useAppStore.getState();
    
    updateHairSettings({ color: 'blonde', volume: 'voluminous' });
    
    const state = useAppStore.getState();
    expect(state.hairSettings.color).toBe('blonde');
    expect(state.hairSettings.volume).toBe('voluminous');
  });

  it('should reset state', () => {
    const { setUserPhoto, setSelectedStyle, reset } = useAppStore.getState();
    
    setUserPhoto('data:image/png;base64,test');
    setSelectedStyle({
      id: 'test',
      name: 'Test',
      nameKo: '테스트',
      category: 'test',
      gender: 'male',
      description: 'Test',
      prompt: 'test',
    });
    
    reset();
    
    const state = useAppStore.getState();
    expect(state.userPhoto).toBeNull();
    expect(state.selectedStyle).toBeNull();
  });
});

describe('useAppStore - Credits System', () => {
  beforeEach(() => {
    const { reset, setCredits } = useAppStore.getState();
    reset();
    setCredits(5);
    localStorage.clear();
  });

  it('should have initial credits', () => {
    const { credits } = useAppStore.getState();
    expect(credits).toBe(5);
  });

  it('should use credit and decrement', () => {
    const { useCredit, credits: initialCredits } = useAppStore.getState();
    
    const success = useCredit();
    
    expect(success).toBe(true);
    const { credits: newCredits } = useAppStore.getState();
    expect(newCredits).toBe(initialCredits - 1);
  });

  it('should not use credit when depleted', () => {
    const { setCredits, useCredit } = useAppStore.getState();
    
    setCredits(0);
    const success = useCredit();
    
    expect(success).toBe(false);
    const { credits } = useAppStore.getState();
    expect(credits).toBe(0);
  });

  it('should allow unlimited usage for premium users', () => {
    const { setSubscriptionPlan, setCredits, useCredit } = useAppStore.getState();
    
    setSubscriptionPlan('premium');
    setCredits(0);
    
    const success = useCredit();
    
    expect(success).toBe(true);
  });

  it('should add credits', () => {
    const { addCredits, credits: initial } = useAppStore.getState();
    
    addCredits(10);
    
    const { credits } = useAppStore.getState();
    expect(credits).toBe(initial + 10);
  });
});

describe('useAppStore - Favorites', () => {
  beforeEach(() => {
    const { reset } = useAppStore.getState();
    reset();
    localStorage.clear();
  });

  it('should toggle favorite', () => {
    const { toggleFavorite, isFavorite } = useAppStore.getState();
    const styleId = 'm-쉼표머리';
    
    expect(isFavorite(styleId)).toBe(false);
    
    toggleFavorite(styleId);
    expect(isFavorite(styleId)).toBe(true);
    
    toggleFavorite(styleId);
    expect(isFavorite(styleId)).toBe(false);
  });

  it('should maintain multiple favorites', () => {
    const { toggleFavorite, favoriteStyleIds } = useAppStore.getState();
    
    toggleFavorite('style-1');
    toggleFavorite('style-2');
    toggleFavorite('style-3');
    
    const state = useAppStore.getState();
    expect(state.favoriteStyleIds).toHaveLength(3);
    expect(state.favoriteStyleIds).toContain('style-1');
    expect(state.favoriteStyleIds).toContain('style-2');
    expect(state.favoriteStyleIds).toContain('style-3');
  });
});

describe('useAppStore - Referral System', () => {
  beforeEach(() => {
    const { reset } = useAppStore.getState();
    reset();
    localStorage.clear();
  });

  it('should have referral code', () => {
    const { referralInfo } = useAppStore.getState();
    
    expect(referralInfo.myCode).toBeDefined();
    expect(referralInfo.myCode).toMatch(/^HAIR[A-Z0-9]{6}$/);
  });

  it('should apply valid referral code', () => {
    const { applyReferralCode, credits: initial } = useAppStore.getState();
    
    const success = applyReferralCode('HAIRABC123');
    
    expect(success).toBe(true);
    const { credits, referralInfo } = useAppStore.getState();
    expect(credits).toBe(initial + 5);
    expect(referralInfo.usedCodes).toContain('HAIRABC123');
  });

  it('should reject duplicate referral code', () => {
    const { applyReferralCode } = useAppStore.getState();
    
    applyReferralCode('HAIRABC123');
    const success = applyReferralCode('HAIRABC123');
    
    expect(success).toBe(false);
  });

  it('should reject own referral code', () => {
    const { applyReferralCode, referralInfo } = useAppStore.getState();
    
    const success = applyReferralCode(referralInfo.myCode);
    
    expect(success).toBe(false);
  });

  it('should reject invalid referral code format', () => {
    const { applyReferralCode } = useAppStore.getState();
    
    const success = applyReferralCode('INVALID');
    
    expect(success).toBe(false);
  });
});
