/**
 * 로딩 및 에러 상태 UI 컴포넌트 모음
 * - 스켈레톤 로딩
 * - 프로그레스 인디케이터
 * - 에러 상태
 * - 빈 상태
 * - 다국어 지원
 */

import { useI18n, type Language } from '../i18n/useI18n';

// 상태 텍스트 (다국어)
const STATE_TEXTS: Record<Language, Record<string, string>> = {
  ko: {
    loading: '로딩 중...',
    processing: '처리 중...',
    generating: 'AI가 생성 중...',
    analyzing: '분석 중...',
    error_title: '문제가 발생했습니다',
    error_message: '잠시 후 다시 시도해 주세요',
    retry: '다시 시도',
    no_data: '데이터가 없습니다',
    no_results: '결과가 없습니다',
    no_history: '기록이 없습니다',
    try_first: '처음 시뮬레이션을 시작해보세요!',
    offline: '인터넷 연결을 확인해 주세요',
    timeout: '요청 시간이 초과되었습니다',
    go_back: '뒤로 가기',
    ai_tip: 'AI가 최적의 결과를 찾고 있어요...',
  },
  en: {
    loading: 'Loading...',
    processing: 'Processing...',
    generating: 'AI is generating...',
    analyzing: 'Analyzing...',
    error_title: 'Something went wrong',
    error_message: 'Please try again later',
    retry: 'Try Again',
    no_data: 'No data',
    no_results: 'No results',
    no_history: 'No history',
    try_first: 'Try your first simulation!',
    offline: 'Please check your internet connection',
    timeout: 'Request timed out',
    go_back: 'Go Back',
    ai_tip: 'AI is finding the best result for you...',
  },
  zh: {
    loading: '加载中...',
    processing: '处理中...',
    generating: 'AI正在生成...',
    analyzing: '分析中...',
    error_title: '出现问题',
    error_message: '请稍后重试',
    retry: '重试',
    no_data: '无数据',
    no_results: '无结果',
    no_history: '无记录',
    try_first: '开始您的第一次模拟！',
    offline: '请检查网络连接',
    timeout: '请求超时',
    go_back: '返回',
    ai_tip: 'AI正在为您寻找最佳结果...',
  },
  ja: {
    loading: '読み込み中...',
    processing: '処理中...',
    generating: 'AI生成中...',
    analyzing: '分析中...',
    error_title: '問題が発生しました',
    error_message: '後でもう一度お試しください',
    retry: 'リトライ',
    no_data: 'データなし',
    no_results: '結果なし',
    no_history: '履歴なし',
    try_first: '最初のシミュレーションを試してみましょう！',
    offline: 'インターネット接続を確認してください',
    timeout: 'リクエストがタイムアウトしました',
    go_back: '戻る',
    ai_tip: 'AIが最適な結果を探しています...',
  },
  es: {
    loading: 'Cargando...',
    processing: 'Procesando...',
    generating: 'IA generando...',
    analyzing: 'Analizando...',
    error_title: 'Algo salió mal',
    error_message: 'Por favor, inténtelo más tarde',
    retry: 'Reintentar',
    no_data: 'Sin datos',
    no_results: 'Sin resultados',
    no_history: 'Sin historial',
    try_first: '¡Prueba tu primera simulación!',
    offline: 'Verifique su conexión a internet',
    timeout: 'Tiempo de espera agotado',
    go_back: 'Volver',
    ai_tip: 'La IA está buscando el mejor resultado para ti...',
  },
  pt: {
    loading: 'Carregando...',
    processing: 'Processando...',
    generating: 'IA gerando...',
    analyzing: 'Analisando...',
    error_title: 'Algo deu errado',
    error_message: 'Por favor, tente novamente mais tarde',
    retry: 'Tentar Novamente',
    no_data: 'Sem dados',
    no_results: 'Sem resultados',
    no_history: 'Sem histórico',
    try_first: 'Experimente sua primeira simulação!',
    offline: 'Verifique sua conexão com a internet',
    timeout: 'Tempo limite excedido',
    go_back: 'Voltar',
    ai_tip: 'A IA está encontrando o melhor resultado para você...',
  },
  fr: {
    loading: 'Chargement...',
    processing: 'Traitement...',
    generating: 'L\'IA génère...',
    analyzing: 'Analyse...',
    error_title: 'Une erreur s\'est produite',
    error_message: 'Veuillez réessayer plus tard',
    retry: 'Réessayer',
    no_data: 'Pas de données',
    no_results: 'Pas de résultats',
    no_history: 'Pas d\'historique',
    try_first: 'Essayez votre première simulation !',
    offline: 'Vérifiez votre connexion internet',
    timeout: 'Délai d\'attente dépassé',
    go_back: 'Retour',
    ai_tip: 'L\'IA trouve le meilleur résultat pour vous...',
  },
  de: {
    loading: 'Laden...',
    processing: 'Verarbeiten...',
    generating: 'KI generiert...',
    analyzing: 'Analysieren...',
    error_title: 'Etwas ist schiefgelaufen',
    error_message: 'Bitte versuchen Sie es später erneut',
    retry: 'Erneut Versuchen',
    no_data: 'Keine Daten',
    no_results: 'Keine Ergebnisse',
    no_history: 'Kein Verlauf',
    try_first: 'Probieren Sie Ihre erste Simulation!',
    offline: 'Überprüfen Sie Ihre Internetverbindung',
    timeout: 'Zeitüberschreitung',
    go_back: 'Zurück',
    ai_tip: 'KI findet das beste Ergebnis für Sie...',
  },
  th: {
    loading: 'กำลังโหลด...',
    processing: 'กำลังประมวลผล...',
    generating: 'AI กำลังสร้าง...',
    analyzing: 'กำลังวิเคราะห์...',
    error_title: 'เกิดข้อผิดพลาด',
    error_message: 'กรุณาลองใหม่ภายหลัง',
    retry: 'ลองอีกครั้ง',
    no_data: 'ไม่มีข้อมูล',
    no_results: 'ไม่มีผลลัพธ์',
    no_history: 'ไม่มีประวัติ',
    try_first: 'ลองจำลองครั้งแรกของคุณ!',
    offline: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
    timeout: 'หมดเวลาคำขอ',
    go_back: 'ย้อนกลับ',
    ai_tip: 'AI กำลังหาผลลัพธ์ที่ดีที่สุดให้คุณ...',
  },
  vi: {
    loading: 'Đang tải...',
    processing: 'Đang xử lý...',
    generating: 'AI đang tạo...',
    analyzing: 'Đang phân tích...',
    error_title: 'Đã xảy ra lỗi',
    error_message: 'Vui lòng thử lại sau',
    retry: 'Thử Lại',
    no_data: 'Không có dữ liệu',
    no_results: 'Không có kết quả',
    no_history: 'Không có lịch sử',
    try_first: 'Thử mô phỏng đầu tiên của bạn!',
    offline: 'Vui lòng kiểm tra kết nối internet',
    timeout: 'Yêu cầu hết thời gian',
    go_back: 'Quay Lại',
    ai_tip: 'AI đang tìm kết quả tốt nhất cho bạn...',
  },
  id: {
    loading: 'Memuat...',
    processing: 'Memproses...',
    generating: 'AI sedang membuat...',
    analyzing: 'Menganalisis...',
    error_title: 'Terjadi kesalahan',
    error_message: 'Silakan coba lagi nanti',
    retry: 'Coba Lagi',
    no_data: 'Tidak ada data',
    no_results: 'Tidak ada hasil',
    no_history: 'Tidak ada riwayat',
    try_first: 'Coba simulasi pertama Anda!',
    offline: 'Periksa koneksi internet Anda',
    timeout: 'Permintaan habis waktu',
    go_back: 'Kembali',
    ai_tip: 'AI sedang mencari hasil terbaik untuk Anda...',
  },
  hi: {
    loading: 'लोड हो रहा है...',
    processing: 'प्रोसेसिंग...',
    generating: 'AI बना रहा है...',
    analyzing: 'विश्लेषण...',
    error_title: 'कुछ गलत हो गया',
    error_message: 'कृपया बाद में पुनः प्रयास करें',
    retry: 'पुनः प्रयास',
    no_data: 'कोई डेटा नहीं',
    no_results: 'कोई परिणाम नहीं',
    no_history: 'कोई इतिहास नहीं',
    try_first: 'अपना पहला सिमुलेशन आज़माएं!',
    offline: 'कृपया इंटरनेट कनेक्शन जांचें',
    timeout: 'अनुरोध समय समाप्त',
    go_back: 'वापस जाएं',
    ai_tip: 'AI आपके लिए सर्वोत्तम परिणाम खोज रहा है...',
  },
  ar: {
    loading: 'جاري التحميل...',
    processing: 'جاري المعالجة...',
    generating: 'الذكاء الاصطناعي يُنشئ...',
    analyzing: 'جاري التحليل...',
    error_title: 'حدث خطأ ما',
    error_message: 'يرجى المحاولة مرة أخرى لاحقاً',
    retry: 'إعادة المحاولة',
    no_data: 'لا توجد بيانات',
    no_results: 'لا توجد نتائج',
    no_history: 'لا يوجد سجل',
    try_first: 'جرب محاكاتك الأولى!',
    offline: 'يرجى التحقق من اتصال الإنترنت',
    timeout: 'انتهت مهلة الطلب',
    go_back: 'رجوع',
    ai_tip: 'الذكاء الاصطناعي يجد أفضل نتيجة لك...',
  },
};

/**
 * 스피너 로딩
 */
export function LoadingSpinner({
  size = 'md',
  message,
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) {
  const { language } = useI18n();
  const texts = STATE_TEXTS[language] || STATE_TEXTS.en;

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={message || texts.loading}
    >
      <div
        className={`${sizeClasses[size]} border-[#e5e8eb] border-t-[#3182f6] rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-[14px] text-[#6b7684]">{message || texts.loading}</p>
      )}
    </div>
  );
}

/**
 * 전체화면 로딩
 */
export function FullPageLoading({ message }: { message?: string }) {
  const { language } = useI18n();
  const texts = STATE_TEXTS[language] || STATE_TEXTS.en;

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex items-center justify-center"
      role="status"
      aria-live="assertive"
      aria-label={message || texts.loading}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 border-3 border-[#e5e8eb] border-t-[#3182f6] rounded-full animate-spin mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-[15px] text-[#6b7684]">{message || texts.loading}</p>
      </div>
    </div>
  );
}

/**
 * AI 생성 로딩 (특별 애니메이션)
 */
export function AIGeneratingLoader({ progress }: { progress?: number }) {
  const { language } = useI18n();
  const texts = STATE_TEXTS[language] || STATE_TEXTS.en;
  const isRtl = language === 'ar';

  return (
    <div
      className="flex flex-col items-center gap-4 p-8"
      role="status"
      aria-live="polite"
      aria-label={texts.generating}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* AI 아이콘 애니메이션 */}
      <div className="relative w-24 h-24" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3182f6] to-[#6366f1] rounded-full animate-pulse" />
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <span className="text-4xl animate-bounce">✨</span>
        </div>
        {/* 회전 링 */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[#3182f6] rounded-full animate-spin" />
      </div>

      <p className="text-[16px] font-medium text-[#191f28]">{texts.generating}</p>

      {/* 프로그레스 바 */}
      {typeof progress === 'number' && (
        <div
          className="w-48 h-2 bg-[#f2f4f6] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-[#3182f6] to-[#6366f1] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 다국어 팁 */}
      <p className="text-[13px] text-[#8b95a1] text-center max-w-xs">
        {texts.ai_tip}
      </p>
    </div>
  );
}

/**
 * 스켈레톤 카드
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-[#f2f4f6] rounded-2xl aspect-[3/4]" />
      <div className="mt-2 h-4 bg-[#f2f4f6] rounded w-3/4" />
      <div className="mt-1 h-3 bg-[#f2f4f6] rounded w-1/2" />
    </div>
  );
}

/**
 * 스켈레톤 그리드
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * 에러 상태
 */
export function ErrorState({
  title,
  message,
  onRetry,
  onGoBack,
  type = 'general',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  type?: 'general' | 'offline' | 'timeout';
}) {
  const { language } = useI18n();
  const texts = STATE_TEXTS[language] || STATE_TEXTS.en;

  const icons = {
    general: '😕',
    offline: '📡',
    timeout: '⏱️',
  };

  const defaultMessages = {
    general: texts.error_message,
    offline: texts.offline,
    timeout: texts.timeout,
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-4">{icons[type]}</span>
      <h3 className="text-[18px] font-semibold text-[#191f28] mb-2">
        {title || texts.error_title}
      </h3>
      <p className="text-[14px] text-[#6b7684] mb-6 max-w-xs">
        {message || defaultMessages[type]}
      </p>

      <div className="flex gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-6 py-3 text-[14px] font-medium text-[#6b7684] bg-[#f2f4f6] rounded-xl active:bg-[#e5e8eb] transition-colors"
          >
            {texts.go_back}
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 text-[14px] font-medium text-white bg-[#3182f6] rounded-xl active:bg-[#1b64da] transition-colors"
          >
            {texts.retry}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 빈 상태
 */
export function EmptyState({
  type = 'no_data',
  message,
  action,
  actionLabel,
}: {
  type?: 'no_data' | 'no_results' | 'no_history';
  message?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  const { language } = useI18n();
  const texts = STATE_TEXTS[language] || STATE_TEXTS.en;

  const icons = {
    no_data: '📭',
    no_results: '🔍',
    no_history: '🕐',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-4 opacity-50">{icons[type]}</span>
      <p className="text-[16px] text-[#8b95a1] mb-4">
        {message || texts[type]}
      </p>

      {type === 'no_history' && (
        <p className="text-[14px] text-[#b0b8c1] mb-6">{texts.try_first}</p>
      )}

      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-3 text-[14px] font-medium text-white bg-[#3182f6] rounded-xl active:bg-[#1b64da] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * 프로그레스 바
 */
export function ProgressBar({
  progress,
  showLabel = false,
  color = 'blue',
}: {
  progress: number;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-[#3182f6] to-[#6366f1]',
    green: 'from-[#10b981] to-[#34d399]',
    purple: 'from-[#8b5cf6] to-[#a78bfa]',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-[12px] text-[#8b95a1] mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 단계 인디케이터
 */
export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((_step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-colors ${
              index < currentStep
                ? 'bg-[#10b981] text-white'
                : index === currentStep
                  ? 'bg-[#3182f6] text-white'
                  : 'bg-[#f2f4f6] text-[#8b95a1]'
            }`}
          >
            {index < currentStep ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                index < currentStep ? 'bg-[#10b981]' : 'bg-[#e5e8eb]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
