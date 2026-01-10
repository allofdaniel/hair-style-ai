/**
 * 플로팅 처리 진행 상태 표시기
 * - 화면 하단에 떠있는 작은 인디케이터
 * - 클릭하면 대기열/완료 목록 확인 가능
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcessingQueue } from '../stores/useProcessingQueue';

export default function ProcessingIndicator() {
  const navigate = useNavigate();
  const {
    queue,
    completedItems,
    unreadCompletedCount,
    currentProcessingId,
    markAsRead,
    clearCompletedItem,
  } = useProcessingQueue();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompleteToast, setShowCompleteToast] = useState(false);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

  // 현재 처리 중인 항목
  const processingItem = queue.find((item) => item.id === currentProcessingId);
  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const completedCount = completedItems.length;

  // 새 완료 알림 감지
  useEffect(() => {
    if (completedItems.length > 0 && completedItems[0].id !== lastCompletedId) {
      setLastCompletedId(completedItems[0].id);
      setShowCompleteToast(true);
      setTimeout(() => setShowCompleteToast(false), 4000);
    }
  }, [completedItems, lastCompletedId]);

  // 아무것도 없으면 표시 안함
  if (!processingItem && pendingCount === 0 && completedCount === 0) {
    return null;
  }

  const handleViewResult = (item: typeof completedItems[0]) => {
    // 결과를 localStorage에 저장하고 result 페이지로 이동
    localStorage.setItem(
      'multiResults',
      JSON.stringify([
        {
          styleId: item.styleId,
          styleName: item.styleNameKo,
          resultImage: item.resultImage,
          backViewImage: item.backViewImage,
        },
      ])
    );
    markAsRead();
    setIsExpanded(false);
    navigate('/result');
  };

  return (
    <>
      {/* 완료 토스트 알림 */}
      {showCompleteToast && completedItems[0] && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-slide-down"
          onClick={() => handleViewResult(completedItems[0])}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20">
              {completedItems[0].resultImage && (
                <img
                  src={completedItems[0].resultImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-[13px] font-semibold">생성 완료!</p>
              <p className="text-[12px] opacity-90">{completedItems[0].styleNameKo}</p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      )}

      {/* 플로팅 인디케이터 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-[#3182f6] to-[#6b5ce7] text-white rounded-full shadow-2xl shadow-blue-500/30 flex items-center gap-2 px-4 py-3 active:scale-95 transition-all"
      >
        {processingItem ? (
          <>
            {/* 처리 중 */}
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 -rotate-90 animate-spin" style={{ animationDuration: '2s' }}>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${processingItem.progress * 0.628} 62.8`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[13px] font-medium">
              {Math.round(processingItem.progress)}%
            </span>
            {pendingCount > 0 && (
              <span className="text-[11px] opacity-80">+{pendingCount}</span>
            )}
          </>
        ) : completedCount > 0 ? (
          <>
            {/* 완료된 항목 있음 */}
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {unreadCompletedCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {unreadCompletedCount}
                </div>
              )}
            </div>
            <span className="text-[13px] font-medium">{completedCount}개 완료</span>
          </>
        ) : (
          <>
            {/* 대기 중 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-[13px] font-medium">{pendingCount}개 대기</span>
          </>
        )}
      </button>

      {/* 확장된 패널 */}
      {isExpanded && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsExpanded(false)}
          />

          {/* 패널 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] overflow-hidden animate-slide-up">
            {/* 핸들 */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="px-5 pb-4 border-b border-gray-100">
              <h2 className="text-[17px] font-bold text-gray-900">생성 현황</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                {processingItem ? '생성 중...' : pendingCount > 0 ? `${pendingCount}개 대기 중` : `${completedCount}개 완료`}
              </p>
            </div>

            {/* 콘텐츠 */}
            <div className="overflow-y-auto max-h-[50vh] px-5 py-4">
              {/* 현재 처리 중 */}
              {processingItem && (
                <div className="mb-4">
                  <p className="text-[12px] font-medium text-gray-400 mb-2">처리 중</p>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="4"
                            strokeDasharray={`${processingItem.progress * 1.256} 125.6`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3182f6" />
                              <stop offset="100%" stopColor="#6b5ce7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-blue-600">
                          {Math.round(processingItem.progress)}%
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-gray-900">
                          {processingItem.styleNameKo}
                        </p>
                        <p className="text-[12px] text-gray-500">AI가 생성 중입니다...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 대기 중 */}
              {pendingCount > 0 && (
                <div className="mb-4">
                  <p className="text-[12px] font-medium text-gray-400 mb-2">대기 중 ({pendingCount})</p>
                  <div className="space-y-2">
                    {queue
                      .filter((item) => item.status === 'pending')
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#9ca3af"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                          </div>
                          <p className="text-[14px] text-gray-600">{item.styleNameKo}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 완료됨 */}
              {completedCount > 0 && (
                <div>
                  <p className="text-[12px] font-medium text-gray-400 mb-2">완료됨 ({completedCount})</p>
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-green-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:bg-green-100 transition-colors"
                        onClick={() => handleViewResult(item)}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200">
                          {item.resultImage && (
                            <img
                              src={item.resultImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-medium text-gray-900">
                            {item.styleNameKo}
                          </p>
                          <p className="text-[12px] text-green-600">탭하여 결과 보기</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCompletedItem(item.id);
                          }}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#6b7280"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 비어있음 */}
              {!processingItem && pendingCount === 0 && completedCount === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400">대기 중인 항목이 없습니다</p>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-5 border-t border-gray-100 safe-area-bottom">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  navigate('/style-select');
                }}
                className="w-full h-12 bg-gradient-to-r from-[#3182f6] to-[#6b5ce7] text-white rounded-xl font-medium text-[15px] active:scale-[0.98] transition-transform"
              >
                + 새 스타일 추가하기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
