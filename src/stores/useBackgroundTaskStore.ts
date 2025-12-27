/**
 * 백그라운드 작업 관리 스토어
 * - 이미지 생성을 백그라운드에서 처리
 * - 완료 시 알림 및 결과 접근
 * - 화면 가리지 않고 작업 진행
 */

import { create } from 'zustand';

export interface BackgroundTask {
  id: string;
  type: 'hair_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  styleName: string;
  styleNameKo: string;
  styleId: string;
  userPhoto: string;
  resultImage?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface BackgroundTaskState {
  tasks: BackgroundTask[];
  activeTaskId: string | null;

  // 작업 관리
  addTask: (task: Omit<BackgroundTask, 'id' | 'startedAt' | 'status' | 'progress'>) => string;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // 조회
  getTask: (id: string) => BackgroundTask | undefined;
  getActiveTasks: () => BackgroundTask[];
  getCompletedTasks: () => BackgroundTask[];
  hasActiveTask: () => boolean;

  // 알림 상태
  unreadCompletedCount: number;
  markAsRead: () => void;
}

export const useBackgroundTaskStore = create<BackgroundTaskState>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  unreadCompletedCount: 0,

  addTask: (taskData) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const task: BackgroundTask = {
      ...taskData,
      id,
      status: 'pending',
      progress: 0,
      startedAt: Date.now(),
    };

    set((state) => ({
      tasks: [...state.tasks, task],
      activeTaskId: state.activeTaskId || id,
    }));

    return id;
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((task) => {
        if (task.id !== id) return task;

        const updated = { ...task, ...updates };

        // 완료 시 타임스탬프 및 알림 카운트 증가
        if (updates.status === 'completed' && task.status !== 'completed') {
          updated.completedAt = Date.now();
        }

        return updated;
      });

      // 완료된 작업이면 unread 카운트 증가
      const taskWasCompleted = updates.status === 'completed';
      const previousTask = state.tasks.find(t => t.id === id);
      const wasNotCompleted = previousTask?.status !== 'completed';

      return {
        tasks,
        unreadCompletedCount: taskWasCompleted && wasNotCompleted
          ? state.unreadCompletedCount + 1
          : state.unreadCompletedCount,
      };
    });
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
    }));
  },

  clearCompletedTasks: () => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status !== 'completed' && t.status !== 'failed'),
      unreadCompletedCount: 0,
    }));
  },

  getTask: (id) => get().tasks.find((t) => t.id === id),

  getActiveTasks: () => get().tasks.filter((t) => t.status === 'pending' || t.status === 'processing'),

  getCompletedTasks: () => get().tasks.filter((t) => t.status === 'completed'),

  hasActiveTask: () => get().tasks.some((t) => t.status === 'pending' || t.status === 'processing'),

  markAsRead: () => set({ unreadCompletedCount: 0 }),
}));
