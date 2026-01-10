/**
 * Apple HIG Button Components
 *
 * Design Principles:
 * - Minimum 44pt touch target
 * - Clear visual feedback on press
 * - Consistent corner radius (12pt for small, 14pt for large)
 * - SF-style animations
 */

import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'filled';
type ButtonSize = 'sm' | 'md' | 'lg';

interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

// Apple HIG compliant button styles
const variantStyles: Record<ButtonVariant, { base: string; pressed: string }> = {
  primary: {
    base: 'bg-[var(--color-blue)] text-white',
    pressed: 'bg-[#0066CC] dark:bg-[#0066CC]',
  },
  secondary: {
    base: 'bg-[var(--color-fill-secondary)] text-[var(--color-label)]',
    pressed: 'bg-[var(--color-fill-primary)]',
  },
  ghost: {
    base: 'bg-transparent text-[var(--color-blue)]',
    pressed: 'bg-[var(--color-blue)]/10',
  },
  destructive: {
    base: 'bg-[var(--color-red)] text-white',
    pressed: 'bg-[#CC2929] dark:bg-[#CC2929]',
  },
  filled: {
    base: 'bg-[var(--color-label)] text-[var(--color-bg-primary)]',
    pressed: 'bg-[var(--color-label-secondary)]',
  },
};

// Apple HIG size specs (minimum 44pt touch target)
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-subheadline rounded-xl gap-2',
  md: 'h-[50px] px-5 text-body rounded-[14px] gap-2',
  lg: 'h-[56px] px-6 text-body rounded-2xl gap-2.5',
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
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  const handlePressStart = () => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  };

  const handlePressEnd = () => {
    setIsPressed(false);
  };

  const styles = variantStyles[variant];

  return (
    <button
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center font-semibold
        transition-all duration-150 ease-out
        transform-gpu
        ${isPressed ? 'scale-[0.97] opacity-90' : 'scale-100 opacity-100'}
        ${isPressed ? styles.pressed : styles.base}
        disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
        </div>
      )}

      {/* Content */}
      <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''} ${iconPosition === 'right' ? 'flex-row-reverse' : ''}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

// Icon Button (Circular) - Apple HIG Style
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
  disabled,
  ...props
}: IOSIconButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Apple HIG: Minimum 44pt touch target
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  const handlePressStart = () => !disabled && setIsPressed(true);
  const handlePressEnd = () => setIsPressed(false);

  const styles = variantStyles[variant];

  return (
    <button
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-150 transform-gpu
        ${isPressed ? 'scale-[0.92] opacity-90' : 'scale-100 opacity-100'}
        ${isPressed ? styles.pressed : styles.base}
        disabled:opacity-40 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// Card Style Button - Apple HIG Style
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
  disabled,
  ...props
}: IOSCardButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  const handlePressStart = () => !disabled && setIsPressed(true);
  const handlePressEnd = () => setIsPressed(false);

  return (
    <button
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-2.5 p-4
        bg-[var(--color-bg-grouped-secondary)] dark:bg-[var(--color-gray-5)]
        rounded-2xl
        transition-all duration-150 transform-gpu
        ${isPressed ? 'scale-[0.96] opacity-90' : 'scale-100'}
        ${selected
          ? 'ring-2 ring-[var(--color-blue)]'
          : ''
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <div className={`text-2xl transition-transform duration-200 ${selected ? 'scale-110' : isPressed ? 'scale-95' : 'scale-100'}`}>
        {icon}
      </div>
      <div className="text-center">
        <div className={`font-semibold text-subheadline ${selected ? 'text-[var(--color-blue)]' : 'text-label'}`}>
          {title}
        </div>
        {subtitle && (
          <div className="text-caption-1 text-[var(--color-label-secondary)] mt-0.5">{subtitle}</div>
        )}
      </div>
    </button>
  );
}

// Text Button - Apple HIG Style (for navigation bars)
interface IOSTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive';
  children: ReactNode;
}

export function IOSTextButton({
  variant = 'default',
  children,
  className = '',
  disabled,
  ...props
}: IOSTextButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressStart = () => !disabled && setIsPressed(true);
  const handlePressEnd = () => setIsPressed(false);

  return (
    <button
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      disabled={disabled}
      className={`
        min-h-11 px-2 text-body font-medium
        transition-opacity duration-150
        ${isPressed ? 'opacity-50' : 'opacity-100'}
        ${variant === 'destructive' ? 'text-[var(--color-red)]' : 'text-[var(--color-blue)]'}
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// Segmented Control - Apple HIG Style
interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  return (
    <div className={`flex bg-[var(--color-fill-tertiary)] rounded-[10px] p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 py-2 px-3 text-footnote font-semibold rounded-lg
            transition-all duration-200
            ${value === option.value
              ? 'bg-[var(--color-bg-primary)] text-label shadow-sm'
              : 'text-[var(--color-label-secondary)]'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
