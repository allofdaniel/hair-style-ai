import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female';
export type HairTexture = 'straight' | 'wavy' | 'curly';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'unlimited';

// 염색 색상 타입
export interface HairColorOption {
  id: string;
  name: string;
  nameKo: string;
  hex: string;
  category: 'natural' | 'fashion' | 'highlight';
}

// 내 머리 프로필
export interface MyHairProfile {
  texture: 'straight' | 'wavy' | 'curly' | 'coily';  // 모질
  thickness: 'thin' | 'normal' | 'thick';            // 굵기
  density: 'sparse' | 'normal' | 'dense';            // 머리숱
  condition: 'damaged' | 'normal' | 'healthy';       // 손상도
  scalpType: 'dry' | 'normal' | 'oily';              // 두피 타입
  currentLength: number;                              // 현재 길이 (cm)
  naturalColor: string;                               // 자연 머리색
  notes: string;                                      // 추가 메모
}

// 친구 추천 시스템
export interface ReferralInfo {
  myCode: string;           // 내 추천 코드
  usedCodes: string[];      // 내가 사용한 추천 코드들
  referredCount: number;    // 내 코드로 가입한 친구 수
  earnedTokens: number;     // 추천으로 획득한 토큰
}

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
    bangs: number;   // 앞머리 cm
  };
  color: string;
  volume: 'flat' | 'natural' | 'voluminous';
  parting: 'left' | 'center' | 'right' | 'none';
}

// 커스텀 헤어 설정
export interface CustomHairSettings {
  // 길이 설정 (cm)
  frontLength: number;      // 앞머리 길이
  sideLength: number;       // 옆머리 길이
  topLength: number;        // 윗머리 길이
  backLength: number;       // 뒷머리 길이

  // 숱치기 설정
  thinning: {
    top: boolean;           // 윗머리 숱치기
    sides: boolean;         // 옆머리 숱치기
    back: boolean;          // 뒷머리 숱치기
    amount: 'light' | 'medium' | 'heavy';  // 숱치기 정도
  };

  // 다운펌/펌 설정
  perm: {
    type: 'none' | 'down' | 'volume' | 'wave';  // 펌 종류
    areas: {
      sideBack: boolean;    // 옆뒤 다운펌
      sideOnly: boolean;    // 옆만 다운펌
      top: boolean;         // 윗머리 펌
      bangs: boolean;       // 앞머리 펌
    };
  };

  // 투블럭/페이드 설정
  undercut: {
    enabled: boolean;
    height: number;         // 밀어올리는 높이 (mm)
    fadeType: 'none' | 'low' | 'mid' | 'high' | 'skin';
  };

  // 기타 설정
  layering: boolean;        // 레이어드
  texturizing: boolean;     // 텍스쳐링
}

interface AppState {
  // 약관 동의 상태
  hasConsented: boolean;
  setHasConsented: (consented: boolean) => void;
  consentDate: string | null;

  // User photo
  userPhoto: string | null;
  setUserPhoto: (photo: string | null) => void;

  // 내 기본 사진 (커스텀 모드용)
  myBasePhoto: string | null;
  setMyBasePhoto: (photo: string | null) => void;

  // 커스텀 헤어 설정
  customSettings: CustomHairSettings;
  updateCustomSettings: (settings: Partial<CustomHairSettings>) => void;
  useCustomMode: boolean;
  setUseCustomMode: (mode: boolean) => void;

  // 염색 설정
  selectedHairColor: string | null;  // 선택된 염색 색상 (hex)
  setSelectedHairColor: (color: string | null) => void;
  colorMode: boolean;  // 염색 모드 활성화
  setColorMode: (mode: boolean) => void;

  // 내 머리 프로필
  myHairProfile: MyHairProfile;
  updateMyHairProfile: (profile: Partial<MyHairProfile>) => void;

  // 친구 추천 시스템
  referralInfo: ReferralInfo;
  applyReferralCode: (code: string) => boolean;
  addReferralTokens: (amount: number) => void;

  // 레퍼런스 이미지 업로드 (사용자가 원하는 스타일)
  uploadedReferenceImages: string[];
  addUploadedReference: (image: string) => void;
  removeUploadedReference: (index: number) => void;
  clearUploadedReferences: () => void;

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

  // Hair mask (confirmed by user)
  hairMask: string | null;
  setHairMask: (mask: string | null) => void;
  maskConfirmed: boolean;
  setMaskConfirmed: (confirmed: boolean) => void;

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

  // Saved Results (persisted, with thumbnail only)
  savedResults: Array<{ id: string; thumbnail: string; styleName: string; date: string }>;
  saveResult: (result: string, styleName: string) => void;
  deleteSavedResult: (id: string) => void;
  clearSavedResults: () => void;

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
    bangs: 5,
  },
  color: 'natural',
  volume: 'natural',
  parting: 'left',
};

const defaultMyHairProfile: MyHairProfile = {
  texture: 'straight',
  thickness: 'normal',
  density: 'normal',
  condition: 'normal',
  scalpType: 'normal',
  currentLength: 10,
  naturalColor: '#1a1a1a',
  notes: '',
};

const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HAIR';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const defaultReferralInfo: ReferralInfo = {
  myCode: generateReferralCode(),
  usedCodes: [],
  referredCount: 0,
  earnedTokens: 0,
};

const defaultCustomSettings: CustomHairSettings = {
  frontLength: 5,
  sideLength: 3,
  topLength: 7,
  backLength: 4,
  thinning: {
    top: false,
    sides: false,
    back: false,
    amount: 'medium',
  },
  perm: {
    type: 'none',
    areas: {
      sideBack: false,
      sideOnly: false,
      top: false,
      bangs: false,
    },
  },
  undercut: {
    enabled: false,
    height: 0,
    fadeType: 'none',
  },
  layering: false,
  texturizing: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 약관 동의 상태
      hasConsented: false,
      setHasConsented: (consented) => set({
        hasConsented: consented,
        consentDate: consented ? new Date().toISOString() : null,
      }),
      consentDate: null,

      // User photo
      userPhoto: null,
      setUserPhoto: (photo) => set({ userPhoto: photo }),

      // 내 기본 사진
      myBasePhoto: null,
      setMyBasePhoto: (photo) => set({ myBasePhoto: photo }),

      // 커스텀 설정
      customSettings: defaultCustomSettings,
      updateCustomSettings: (settings) =>
        set((state) => ({
          customSettings: { ...state.customSettings, ...settings },
        })),
      useCustomMode: false,
      setUseCustomMode: (mode) => set({ useCustomMode: mode }),

      // 염색 설정
      selectedHairColor: null,
      setSelectedHairColor: (color) => set({ selectedHairColor: color }),
      colorMode: false,
      setColorMode: (mode) => set({ colorMode: mode }),

      // 내 머리 프로필
      myHairProfile: defaultMyHairProfile,
      updateMyHairProfile: (profile) =>
        set((state) => ({
          myHairProfile: { ...state.myHairProfile, ...profile },
        })),

      // 친구 추천 시스템
      referralInfo: defaultReferralInfo,
      applyReferralCode: (code: string) => {
        const { referralInfo, credits } = get();
        // 이미 사용한 코드인지 확인
        if (referralInfo.usedCodes.includes(code)) {
          return false;
        }
        // 자기 코드인지 확인
        if (code === referralInfo.myCode) {
          return false;
        }
        // 유효한 코드 형식인지 확인 (HAIR + 6자)
        if (!code.startsWith('HAIR') || code.length !== 10) {
          return false;
        }
        // 추천 코드 적용 - 5토큰 지급
        set({
          referralInfo: {
            ...referralInfo,
            usedCodes: [...referralInfo.usedCodes, code],
          },
          credits: credits + 5,
        });
        return true;
      },
      addReferralTokens: (amount: number) => {
        const { referralInfo, credits } = get();
        set({
          referralInfo: {
            ...referralInfo,
            referredCount: referralInfo.referredCount + 1,
            earnedTokens: referralInfo.earnedTokens + amount,
          },
          credits: credits + amount,
        });
      },

      // 레퍼런스 이미지 업로드
      uploadedReferenceImages: [],
      addUploadedReference: (image: string) =>
        set((state) => ({
          uploadedReferenceImages: [...state.uploadedReferenceImages, image].slice(0, 5),
        })),
      removeUploadedReference: (index: number) =>
        set((state) => ({
          uploadedReferenceImages: state.uploadedReferenceImages.filter((_, i) => i !== index),
        })),
      clearUploadedReferences: () => set({ uploadedReferenceImages: [] }),

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

      // Hair mask
      hairMask: null,
      setHairMask: (mask) => set({ hairMask: mask }),
      maskConfirmed: false,
      setMaskConfirmed: (confirmed) => set({ maskConfirmed: confirmed }),

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

      // History - limit to 5 items to prevent localStorage quota exceeded
      history: [],
      addToHistory: (item) => {
        try {
          set((state) => ({
            history: [{ ...item, date: new Date() }, ...state.history].slice(0, 5),
          }));
        } catch {
          // If localStorage is full, clear old history and try again
          console.warn('Storage quota exceeded, clearing old history');
          set({ history: [{ ...item, date: new Date() }] });
        }
      },

      // Saved Results - persisted with compressed thumbnails
      savedResults: [],
      saveResult: (result: string, styleName: string) => {
        try {
          // Create a smaller thumbnail version to save storage
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.onload = () => {
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Center crop
              const size = Math.min(img.width, img.height);
              const x = (img.width - size) / 2;
              const y = (img.height - size) / 2;
              ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.6);

              set((state) => ({
                savedResults: [
                  {
                    id: Date.now().toString(),
                    thumbnail,
                    styleName,
                    date: new Date().toISOString(),
                  },
                  ...state.savedResults,
                ].slice(0, 20), // Max 20 saved results
              }));
            }
          };
          img.src = result;
        } catch (e) {
          console.warn('Failed to save result:', e);
        }
      },
      deleteSavedResult: (id: string) => {
        set((state) => ({
          savedResults: state.savedResults.filter((r) => r.id !== id),
        }));
      },
      clearSavedResults: () => set({ savedResults: [] }),

      // Credits
      credits: 999999, // DEV MODE: Unlimited credits for testing
      setCredits: (credits) => set({ credits }),
      useCredit: () => {
        // DEV MODE: Always return true, don't decrease credits
        // TODO: Re-enable credit system for production
        return true;

        // Production code (commented out for now):
        // const { credits, subscriptionPlan } = get();
        // if (subscriptionPlan === 'unlimited') return true;
        // if (credits > 0) {
        //   set({ credits: credits - 1 });
        //   return true;
        // }
        // return false;
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
          hairMask: null,
          maskConfirmed: false,
        }),
    }),
    {
      name: 'hair-style-ai-storage',
      version: 2, // 버전 추가로 마이그레이션 지원
      partialize: (state) => ({
        // Only persist these fields - NO history (too large with base64 images)
        hasConsented: state.hasConsented,
        consentDate: state.consentDate,
        credits: state.credits,
        subscriptionPlan: state.subscriptionPlan,
        gender: state.gender,
        myBasePhoto: state.myBasePhoto,
        customSettings: state.customSettings,
        myHairProfile: state.myHairProfile,
        referralInfo: state.referralInfo,
        selectedHairColor: state.selectedHairColor,
        savedResults: state.savedResults, // Saved results with thumbnails
      }),
      // 기존 데이터와 새 기본값을 안전하게 병합
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        return {
          ...currentState,
          ...persisted,
          // 새 필드들의 기본값 보장
          hasConsented: persisted?.hasConsented ?? false,
          consentDate: persisted?.consentDate ?? null,
        };
      },
    }
  )
);
