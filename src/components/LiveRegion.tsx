/**
 * LiveRegion - 스크린 리더에 동적 업데이트를 알리는 컴포넌트
 * 로딩 상태, 에러 메시지, 성공 알림 등에 사용
 */
import { memo } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  hidden?: boolean;
}

const LiveRegion = memo(function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  hidden = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={hidden ? 'sr-only' : ''}
    >
      {message}
    </div>
  );
});

export default LiveRegion;

/**
 * 로딩 상태 알림 컴포넌트
 */
export const LoadingAnnouncement = memo(function LoadingAnnouncement({
  isLoading,
  loadingMessage = '로딩 중입니다',
  completeMessage = '로딩이 완료되었습니다',
}: {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}) {
  return (
    <LiveRegion
      message={isLoading ? loadingMessage : completeMessage}
      politeness={isLoading ? 'polite' : 'assertive'}
    />
  );
});

/**
 * 에러 알림 컴포넌트
 */
export const ErrorAnnouncement = memo(function ErrorAnnouncement({
  error,
  prefix = '오류가 발생했습니다: ',
}: {
  error: string | null;
  prefix?: string;
}) {
  if (!error) return null;

  return (
    <LiveRegion
      message={`${prefix}${error}`}
      politeness="assertive"
    />
  );
});
