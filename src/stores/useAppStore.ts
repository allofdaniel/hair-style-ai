import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female';
export type HairTexture = 'straight' | 'wavy' | 'curly';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'unlimited';

export interface HairStyle {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  gender: Gender;
  description: string;
  celebrities?: string[];
  prompt: string;
  thumbnail?: string;
}

export interface ReferenceAnalysis {
  styleName: string;
  styleNameKo: string;
  description: string;
  characteristics: string[];
  length: string;
  texture: string;
  volume: string;
  color: string;
}

export interface HairSettings {
  length: {
    top: number;     // cm
    side: number;    // cm
    back: number;    // cm
    sideburn: number; // cm
  };
  color: string;
  volume: 'flat' | 'natural' | 'voluminous';
  parting: 'left' | 'center' | 'right' | 'none';
}

interface AppState {
  // User photo
  userPhoto: string | null;
  setUserPhoto: (photo: string | null) => void;

  // Gender selection
  gender: Gender;
  setGender: (gender: Gender) => void;

  // Hair texture analysis
  hairTexture: HairTexture | null;
  setHairTexture: (texture: HairTexture | null) => void;

  // Selected style
  selectedStyle: HairStyle | null;
  setSelectedStyle: (style: HairStyle | null) => void;

  // Reference photo (for custom style)
  referencePhoto: string | null;
  setReferencePhoto: (photo: string | null) => void;
  referenceAnalysis: ReferenceAnalysis | null;
  setReferenceAnalysis: (analysis: ReferenceAnalysis | null) => void;
  useReferenceMode: boolean;
  setUseReferenceMode: (mode: boolean) => void;

  // Hair settings
  hairSettings: HairSettings;
  updateHairSettings: (settings: Partial<HairSettings>) => void;

  // Result
  resultImage: string | null;
  setResultImage: (image: string | null) => void;

  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  processingProgress: number;
  setProcessingProgress: (progress: number) => void;

  // History
  history: Array<{ original: string; result: string; style: HairStyle; date: Date }>;
  addToHistory: (item: { original: string; result: string; style: HairStyle }) => void;

  // Credits (for subscription)
  credits: number;
  setCredits: (credits: number) => void;
  useCredit: () => boolean;

  // Subscription
  subscriptionPlan: SubscriptionPlan;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
  isPremium: () => boolean;

  // Reset
  reset: () => void;
}

const defaultHairSettings: HairSettings = {
  length: {
    top: 10,
    side: 5,
    back: 5,
    sideburn: 2,
  },
  color: 'natural',
  volume: 'natural',
  parting: 'left',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User photo
      userPhoto: null,
      setUserPhoto: (photo) => set({ userPhoto: photo }),

      // Gender
      gender: 'male',
      setGender: (gender) => set({ gender }),

      // Hair texture
      hairTexture: null,
      setHairTexture: (texture) => set({ hairTexture: texture }),

      // Selected style
      selectedStyle: null,
      setSelectedStyle: (style) => set({ selectedStyle: style }),

      // Reference photo
      referencePhoto: null,
      setReferencePhoto: (photo) => set({ referencePhoto: photo }),
      referenceAnalysis: null,
      setReferenceAnalysis: (analysis) => set({ referenceAnalysis: analysis }),
      useReferenceMode: false,
      setUseReferenceMode: (mode) => set({ useReferenceMode: mode }),

      // Hair settings
      hairSettings: defaultHairSettings,
      updateHairSettings: (settings) =>
        set((state) => ({
          hairSettings: { ...state.hairSettings, ...settings },
        })),

      // Result
      resultImage: null,
      setResultImage: (image) => set({ resultImage: image }),

      // Processing
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      processingProgress: 0,
      setProcessingProgress: (progress) => set({ processingProgress: progress }),

      // History
      history: [],
      addToHistory: (item) =>
        set((state) => ({
          history: [{ ...item, date: new Date() }, ...state.history].slice(0, 20),
        })),

      // Credits
      credits: 99, // Increased for testing - change to 3 for production
      setCredits: (credits) => set({ credits }),
      useCredit: () => {
        const { credits, subscriptionPlan } = get();
        if (subscriptionPlan === 'unlimited') return true;
        if (credits > 0) {
          set({ credits: credits - 1 });
          return true;
        }
        return false;
      },

      // Subscription
      subscriptionPlan: 'free',
      setSubscriptionPlan: (plan) => set({ subscriptionPlan: plan }),
      isPremium: () => {
        const { subscriptionPlan } = get();
        return subscriptionPlan !== 'free';
      },

      // Reset
      reset: () =>
        set({
          userPhoto: null,
          selectedStyle: null,
          hairSettings: defaultHairSettings,
          resultImage: null,
          isProcessing: false,
          processingProgress: 0,
          referencePhoto: null,
          referenceAnalysis: null,
          useReferenceMode: false,
        }),
    }),
    {
      name: 'hair-style-ai-storage',
      partialize: (state) => ({
        // Only persist these fields
        history: state.history,
        credits: state.credits,
        subscriptionPlan: state.subscriptionPlan,
        gender: state.gender,
      }),
    }
  )
);
