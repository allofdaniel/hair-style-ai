/**
 * 백그라운드 작업 진행 표시 컴포넌트
 * - 화면 하단에 작은 카드로 표시
 * - 진행률 및 완료 알림
 * - 탭하여 결과 보기
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackgroundTaskStore, type BackgroundTask } from '../stores/useBackgroundTaskStore';

export default function BackgroundTaskIndicator() {
  const navigate = useNavigate();
  const { tasks, unreadCompletedCount, markAsRead, removeTask } = useBackgroundTaskStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  const hasAnyTask = tasks.length > 0;

  if (!hasAnyTask) return null;

  const handleTaskClick = (task: BackgroundTask) => {
    if (task.status === 'completed' && task.resultImage) {
      // 결과 페이지로 이동
      localStorage.setItem('multiResults', JSON.stringify([{
        styleId: task.styleId,
        styleName: task.styleName,
        resultImage: task.resultImage,
      }]));
      markAsRead();
      navigate('/result');
    }
  };

  const handleDismiss = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTask(taskId);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 safe-area-bottom">
      {/* 축소된 상태 - 플로팅 버튼 */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="ml-auto flex items-center gap-3 bg-white rounded-2xl shadow-xl shadow-black/10 px-4 py-3 border border-gray-100 transition-all duration-300 hover:shadow-2xl active:scale-[0.98]"
        >
          {activeTasks.length > 0 ? (
            <>
              {/* 회전하는 프로그레스 */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="#f2f4f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="#3182f6"
                    strokeWidth="3"
                    strokeDasharray={`${(activeTasks[0]?.progress || 0) * 0.88} 88`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#3182f6]">
                  {Math.round(activeTasks[0]?.progress || 0)}%
                </span>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-[#191f28] line-clamp-1">
                  {activeTasks[0]?.styleNameKo} 생성 중
                </p>
                <p className="text-[11px] text-[#8b95a1]">
                  {activeTasks.length > 1 ? `+${activeTasks.length - 1}개 대기 중` : '잠시만 기다려주세요'}
                </p>
              </div>
            </>
          ) : completedTasks.length > 0 ? (
            <>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#00c471] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                {unreadCompletedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCompletedCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-[#191f28]">
                  {completedTasks.length}개 완료됨
                </p>
                <p className="text-[11px] text-[#00c471]">탭하여 결과 보기</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500">!</span>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-red-500">생성 실패</p>
                <p className="text-[11px] text-[#8b95a1]">탭하여 자세히 보기</p>
              </div>
            </>
          )}

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      ) : (
        /* 확장된 상태 - 작업 목록 */
        <div className="bg-white rounded-3xl shadow-xl shadow-black/15 border border-gray-100 overflow-hidden animate-slide-up">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-[15px] text-[#191f28]">진행 중인 작업</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7684" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          {/* 작업 목록 */}
          <div className="max-h-[300px] overflow-y-auto">
            {/* 진행 중 */}
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#f2f4f6" strokeWidth="3"/>
                    <circle
                      cx="20" cy="20" r="18"
                      fill="none" stroke="#3182f6" strokeWidth="3"
                      strokeDasharray={`${task.progress * 1.13} 113`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#3182f6] animate-pulse"/>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#191f28] truncate">{task.styleNameKo}</p>
                  <p className="text-[12px] text-[#8b95a1]">{Math.round(task.progress)}% 완료</p>
                </div>
              </div>
            ))}

            {/* 완료됨 */}
            {completedTasks.map(task => (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#00c471]/10 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#191f28] truncate">{task.styleNameKo}</p>
                  <p className="text-[12px] text-[#00c471]">완료 - 탭하여 보기</p>
                </div>
                <button
                  onClick={(e) => handleDismiss(task.id, e)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </button>
            ))}

            {/* 실패 */}
            {failedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff5247" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#191f28] truncate">{task.styleNameKo}</p>
                  <p className="text-[12px] text-red-500">{task.error || '생성 실패'}</p>
                </div>
                <button
                  onClick={(e) => handleDismiss(task.id, e)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
