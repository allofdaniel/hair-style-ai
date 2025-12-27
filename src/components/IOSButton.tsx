/**
 * iOS/토스 스타일 버튼 컴포넌트
 * - 부드러운 스프링 애니메이션
 * - 햅틱 피드백 지원
 * - 다양한 스타일 variants
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#3182f6] text-white active:bg-[#1b64da] shadow-lg shadow-[#3182f6]/25',
  secondary: 'bg-[#f2f4f6] text-[#191f28] active:bg-[#e5e8eb]',
  ghost: 'bg-transparent text-[#3182f6] active:bg-[#3182f6]/10',
  danger: 'bg-[#ff5247] text-white active:bg-[#e53935] shadow-lg shadow-[#ff5247]/25',
  success: 'bg-[#00c471] text-white active:bg-[#00a65a] shadow-lg shadow-[#00c471]/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px] rounded-xl gap-1.5',
  md: 'h-12 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-[16px] rounded-2xl gap-2.5',
  xl: 'h-[60px] px-8 text-[17px] rounded-3xl gap-3',
};

export default function IOSButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className = '',
  onClick,
  ...props
}: IOSButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 햅틱 피드백 (지원되는 경우)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        active:scale-[0.97] active:transition-transform active:duration-100
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* 로딩 스피너 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 콘텐츠 */}
      <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''} ${iconPosition === 'right' ? 'flex-row-reverse' : ''}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

// 아이콘 버튼 (원형)
interface IOSIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function IOSIconButton({
  variant = 'secondary',
  size = 'md',
  children,
  className = '',
  onClick,
  ...props
}: IOSIconButtonProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200 ease-out
        active:scale-[0.92] active:transition-transform active:duration-100
        ${variantStyles[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// 카드 스타일 버튼 (세로형)
interface IOSCardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  selected?: boolean;
}

export function IOSCardButton({
  icon,
  title,
  subtitle,
  selected = false,
  className = '',
  onClick,
  ...props
}: IOSCardButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex flex-col items-center justify-center gap-2 p-4
        bg-white rounded-3xl
        transition-all duration-300 ease-out
        active:scale-[0.96]
        ${selected
          ? 'ring-2 ring-[#3182f6] shadow-lg shadow-[#3182f6]/20'
          : 'shadow-md shadow-black/5 hover:shadow-lg'
        }
        ${className}
      `}
      {...props}
    >
      <div className={`text-3xl ${selected ? 'scale-110' : ''} transition-transform duration-300`}>
        {icon}
      </div>
      <div className="text-center">
        <div className={`font-semibold text-[15px] ${selected ? 'text-[#3182f6]' : 'text-[#191f28]'}`}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-[#8b95a1] mt-0.5">{subtitle}</div>
        )}
      </div>
    </button>
  );
}
