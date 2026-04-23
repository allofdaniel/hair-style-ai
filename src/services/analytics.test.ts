import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initGA, trackPageView, trackEvent, Analytics } from './analytics';

describe('Analytics Service', () => {
  beforeEach(() => {
    // gtag mock initialization
    window.gtag = vi.fn();
    window.dataLayer = [];

    window.localStorage.getItem = vi.fn().mockReturnValue(
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: false,
        timestamp: Date.now(),
        version: '1.0',
      })
    );

    initGA();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initGA', () => {
    it('should initialize and keep window.gtag available in test mode', () => {
      expect(window.dataLayer).toBeDefined();
      expect(typeof window.gtag).toBe('function');
    });
  });

  describe('trackPageView', () => {
    it('should call gtag with page_view event', () => {
      trackPageView({
        page_path: '/test',
        page_title: 'Test Page',
        page_location: 'http://localhost/test',
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/test',
        page_title: 'Test Page',
        page_location: 'http://localhost/test',
      });
    });

    it('should use current location if no data provided', () => {
      trackPageView();

      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
        page_path: expect.any(String),
        page_title: expect.any(String),
        page_location: expect.any(String),
      }));
    });
  });

  describe('trackEvent', () => {
    it('should call gtag with custom event', () => {
      trackEvent({
        action: 'button_click',
        category: 'engagement',
        label: 'signup_button',
        value: 1,
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'engagement',
        event_label: 'signup_button',
        value: 1,
      });
    });
  });

  describe('Analytics helpers', () => {
    it('should track simulation started', () => {
      Analytics.simulationStarted('hairstyle', 'style-123');

      expect(window.gtag).toHaveBeenCalledWith('event', 'simulation_started', expect.objectContaining({
        event_category: 'simulation',
        event_label: 'hairstyle',
      }));
    });

    it('should track photo capture', () => {
      Analytics.photoCapture('camera');

      expect(window.gtag).toHaveBeenCalledWith('event', 'photo_capture', expect.objectContaining({
        event_category: 'user_action',
        event_label: 'camera',
      }));
    });

    it('should track feature usage', () => {
      Analytics.featureUsed('weight_simulation');

      expect(window.gtag).toHaveBeenCalledWith('event', 'feature_used', expect.objectContaining({
        event_category: 'feature',
        event_label: 'weight_simulation',
      }));
    });

    it('should track PWA installation', () => {
      Analytics.pwaInstalled();

      expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_installed', expect.objectContaining({
        event_category: 'pwa',
      }));
    });
  });
});
