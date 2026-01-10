/**
 * 백그라운드 처리 큐 시스템
 * - 화면 가리지 않고 백그라운드에서 AI 생성
 * - 여러 스타일 대기열 지원
 * - 완료 시 알림
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyHairOverlay } from '../services/hairOverlayService';
import { generateFromReference } from '../services/gemini';
import { hairStyles } from '../data/hairStyles';
import { saveHistory, compressImage } from '../services/storage';
import type { HairSettings } from './useAppStore';

export interface QueueItem {
  id: string;
  styleId: string;
  styleName: string;
  styleNameKo: string;
  userPhoto: string;
  hairSettings: HairSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultImage?: string;
  backViewImage?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  // 레퍼런스 모드 지원
  referencePhoto?: string;
  isReferenceMode?: boolean;
}

interface ProcessingQueueState {
  // 대기열
  queue: QueueItem[];

  // 현재 처리 중인 항목 ID
  currentProcessingId: string | null;

  // 완료된 항목 (결과 보기용)
  completedItems: QueueItem[];

  // 새로운 완료 알림 (읽지 않은 개수)
  unreadCompletedCount: number;

  // 액션들
  addToQueue: (items: { styleId: string; userPhoto: string; hairSettings: HairSettings; referencePhoto?: string; isReferenceMode?: boolean }[]) => void;
  addReferenceToQueue: (params: { userPhoto: string; referencePhoto: string; hairSettings: HairSettings; styleName: string; styleNameKo: string }) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;

  // 처리 시작 (자동 호출)
  startProcessing: () => void;

  // 완료된 항목 관리
  markAsRead: () => void;
  clearCompletedItem: (id: string) => void;
  clearAllCompleted: () => void;

  // 결과 보기
  getCompletedResults: () => QueueItem[];

  // 내부 사용
  _updateItem: (id: string, updates: Partial<QueueItem>) => void;
  _isProcessing: boolean;
}

// 싱글톤 처리 플래그 (컴포넌트 외부)
let isProcessingGlobal = false;

export const useProcessingQueue = create<ProcessingQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentProcessingId: null,
      completedItems: [],
      unreadCompletedCount: 0,
      _isProcessing: false,

      addToQueue: (items) => {
        const newItems: QueueItem[] = items.map((item) => {
          const style = hairStyles.find((s) => s.id === item.styleId);
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            styleId: item.styleId,
            styleName: style?.name || item.styleId,
            styleNameKo: style?.nameKo || item.styleId,
            userPhoto: item.userPhoto,
            hairSettings: item.hairSettings,
            status: 'pending' as const,
            progress: 0,
            createdAt: Date.now(),
          };
        });

        set((state) => ({
          queue: [...state.queue, ...newItems],
        }));

        // 처리 시작
        setTimeout(() => get().startProcessing(), 100);
      },

      addReferenceToQueue: (params) => {
        const newItem: QueueItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          styleId: 'reference',
          styleName: params.styleName,
          styleNameKo: params.styleNameKo,
          userPhoto: params.userPhoto,
          hairSettings: params.hairSettings,
          referencePhoto: params.referencePhoto,
          isReferenceMode: true,
          status: 'pending' as const,
          progress: 0,
          createdAt: Date.now(),
        };

        set((state) => ({
          queue: [...state.queue, newItem],
        }));

        // 처리 시작
        setTimeout(() => get().startProcessing(), 100);
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        }));
      },

      clearQueue: () => {
        set({ queue: [], currentProcessingId: null });
      },

      startProcessing: async () => {
        const state = get();

        // 이미 처리 중이면 리턴
        if (isProcessingGlobal || state._isProcessing) {
          return;
        }

        // 처리할 항목 찾기
        const pendingItem = state.queue.find((item) => item.status === 'pending');
        if (!pendingItem) {
          return;
        }

        isProcessingGlobal = true;
        set({ _isProcessing: true, currentProcessingId: pendingItem.id });

        // 상태를 processing으로 변경
        get()._updateItem(pendingItem.id, { status: 'processing', progress: 10 });

        try {
          // 진행률 업데이트 인터벌 - 더 빠르게 진행되도록 수정
          const progressInterval = setInterval(() => {
            const currentItem = get().queue.find((i) => i.id === pendingItem.id);
            if (currentItem && currentItem.progress < 90) {
              get()._updateItem(pendingItem.id, {
                progress: Math.min(currentItem.progress + Math.random() * 10 + 3, 90),
              });
            }
          }, 500);

          let result: { success: boolean; resultImage?: string; backViewImage?: string; error?: string };

          // 레퍼런스 모드인 경우
          if (pendingItem.isReferenceMode && pendingItem.referencePhoto) {
            result = await generateFromReference({
              userPhoto: pendingItem.userPhoto,
              referencePhoto: pendingItem.referencePhoto,
              settings: pendingItem.hairSettings,
            });
          } else {
            // 일반 스타일 모드
            const style = hairStyles.find((s) => s.id === pendingItem.styleId);
            if (!style) {
              throw new Error('Style not found');
            }
            result = await applyHairOverlay({
              userPhoto: pendingItem.userPhoto,
              style,
              settings: pendingItem.hairSettings,
            });
          }

          clearInterval(progressInterval);

          if (result.success && result.resultImage) {
            // 성공 - 바로 100%로
            get()._updateItem(pendingItem.id, {
              status: 'completed',
              progress: 100,
              resultImage: result.resultImage,
              backViewImage: result.backViewImage,
              completedAt: Date.now(),
            });

            // 히스토리 저장
            try {
              const compressedOriginal = await compressImage(pendingItem.userPhoto, 600, 0.8);
              const compressedResult = await compressImage(result.resultImage, 600, 0.8);
              await saveHistory({
                original: compressedOriginal,
                result: compressedResult,
                styleName: pendingItem.styleName,
                styleNameKo: pendingItem.styleNameKo,
                date: new Date().toISOString(),
              });
            } catch (e) {
              console.warn('히스토리 저장 실패:', e);
            }

            // 완료 항목으로 이동
            const completedItem = get().queue.find((i) => i.id === pendingItem.id);
            if (completedItem) {
              set((state) => ({
                completedItems: [{ ...completedItem, progress: 100, status: 'completed' as const }, ...state.completedItems].slice(0, 50),
                queue: state.queue.filter((i) => i.id !== pendingItem.id),
                unreadCompletedCount: state.unreadCompletedCount + 1,
              }));
            }
          } else {
            // 실패
            get()._updateItem(pendingItem.id, {
              status: 'failed',
              error: result.error || '생성 실패',
              progress: 0,
            });
          }
        } catch (error) {
          console.error('Processing error:', error);
          get()._updateItem(pendingItem.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            progress: 0,
          });
        } finally {
          isProcessingGlobal = false;
          set({ _isProcessing: false, currentProcessingId: null });

          // 다음 항목 처리 - 더 빠르게
          setTimeout(() => get().startProcessing(), 200);
        }
      },

      markAsRead: () => {
        set({ unreadCompletedCount: 0 });
      },

      clearCompletedItem: (id) => {
        set((state) => ({
          completedItems: state.completedItems.filter((item) => item.id !== id),
        }));
      },

      clearAllCompleted: () => {
        set({ completedItems: [], unreadCompletedCount: 0 });
      },

      getCompletedResults: () => {
        return get().completedItems.filter((item) => item.status === 'completed');
      },

      _updateItem: (id, updates) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
    }),
    {
      name: 'hair-processing-queue',
      partialize: (state) => ({
        // 완료된 항목만 저장 (userPhoto 제외하고 결과만)
        completedItems: state.completedItems.map((item) => ({
          ...item,
          userPhoto: '', // 원본 사진은 저장하지 않음 (용량 절약)
        })),
        unreadCompletedCount: state.unreadCompletedCount,
      }),
    }
  )
);
