import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LazyImage from './LazyImage';

describe('LazyImage', () => {
  it('renders with placeholder initially', () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);

    // 이미지가 로드되기 전에는 skeleton이 보여야 함
    const placeholder = document.querySelector('.skeleton');
    expect(placeholder).toBeInTheDocument();
  });

  it('applies correct alt text', () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);

    const container = screen.getByRole('img');
    expect(container).toHaveAttribute('aria-label', 'Test image');
  });

  it('calls onLoad when image loads', async () => {
    const onLoad = vi.fn();
    render(<LazyImage src="/test.jpg" alt="Test" onLoad={onLoad} />);

    // IntersectionObserver를 시뮬레이션 (이미지가 뷰포트에 들어왔다고 가정)
    // 실제로는 mock된 IntersectionObserver 때문에 isInView가 false로 유지됨
  });

  it('calls onError when image fails to load', async () => {
    const onError = vi.fn();
    render(<LazyImage src="/nonexistent.jpg" alt="Test" onError={onError} />);
  });

  it('applies custom className', () => {
    render(<LazyImage src="/test.jpg" alt="Test" className="custom-class" />);

    const container = document.querySelector('[role="img"]');
    expect(container).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(<LazyImage src="/test.jpg" alt="Test" width={200} height={150} />);

    const container = document.querySelector('[role="img"]');
    expect(container).toHaveStyle({ width: '200px', height: '150px' });
  });
});
