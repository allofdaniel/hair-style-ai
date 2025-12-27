import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkipLink from './SkipLink';

describe('SkipLink', () => {
  it('renders with default label', () => {
    render(<SkipLink />);

    const link = screen.getByText('본문으로 건너뛰기');
    expect(link).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<SkipLink label="Skip to content" />);

    const link = screen.getByText('Skip to content');
    expect(link).toBeInTheDocument();
  });

  it('has correct href attribute', () => {
    render(<SkipLink targetId="main" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main');
  });

  it('is visually hidden by default', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link');
    expect(link).toHaveClass('sr-only');
  });

  it('focuses target element on click', () => {
    // 타겟 요소 생성
    const target = document.createElement('div');
    target.id = 'main-content';
    target.tabIndex = -1;
    document.body.appendChild(target);

    render(<SkipLink targetId="main-content" />);

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(document.activeElement).toBe(target);

    // 클린업
    document.body.removeChild(target);
  });
});
