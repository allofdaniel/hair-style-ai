/**
 * Toast Component - Simple notification toast
 */

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

export default function Toast({ message, type = 'success', duration = 2000, onClose, visible }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onClose]);

  if (!show) return null;

  const bgColor = type === 'success'
    ? 'bg-[var(--color-green)]'
    : type === 'error'
    ? 'bg-[var(--color-red)]'
    : 'bg-[var(--color-blue)]';

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down safe-area-top">
      <div className={`${bgColor} text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3`}>
        <span className="text-lg font-bold">{icon}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
