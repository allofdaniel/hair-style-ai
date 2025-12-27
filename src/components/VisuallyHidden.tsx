/**
 * VisuallyHidden - 시각적으로 숨기지만 스크린 리더는 읽을 수 있는 컴포넌트
 * 접근성을 위한 추가 설명 텍스트에 사용
 */
import { memo, type ReactNode, type ElementType } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: ElementType;
}

const VisuallyHidden = memo(function VisuallyHidden({
  children,
  as: Component = 'span',
}: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
});

export default VisuallyHidden;
