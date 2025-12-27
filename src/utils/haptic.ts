// Haptic Feedback 유틸리티
// iOS Safari와 Android에서 진동 피드백 지원

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// 진동 패턴 정의 (밀리초)
const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 50, 20, 50, 20],
  error: [50, 100, 50],
  selection: 5,
};

export function hapticFeedback(style: HapticStyle = 'light'): void {
  // iOS Safari Haptic (if available)
  if ('vibrate' in navigator) {
    try {
      const pattern = vibrationPatterns[style];
      navigator.vibrate(pattern);
    } catch {
      // Vibration API not supported or failed
    }
  }
}

// 버튼 클릭용 가벼운 피드백
export function hapticLight(): void {
  hapticFeedback('light');
}

// 토글/스위치용 중간 피드백
export function hapticMedium(): void {
  hapticFeedback('medium');
}

// 중요한 액션용 강한 피드백
export function hapticHeavy(): void {
  hapticFeedback('heavy');
}

// 성공 피드백
export function hapticSuccess(): void {
  hapticFeedback('success');
}

// 경고 피드백
export function hapticWarning(): void {
  hapticFeedback('warning');
}

// 에러 피드백
export function hapticError(): void {
  hapticFeedback('error');
}

// 선택 변경용 미세 피드백
export function hapticSelection(): void {
  hapticFeedback('selection');
}
