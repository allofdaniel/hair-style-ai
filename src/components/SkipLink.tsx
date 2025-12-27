/**
 * SkipLink - 접근성을 위한 스킵 내비게이션 컴포넌트
 * 스크린 리더 사용자가 반복 내비게이션을 건너뛸 수 있게 함
 */
import { memo } from 'react';

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

const SkipLink = memo(function SkipLink({
  targetId = 'main-content',
  label = '본문으로 건너뛰기',
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#3182f6] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
      tabIndex={0}
    >
      {label}
    </a>
  );
});

export default SkipLink;
