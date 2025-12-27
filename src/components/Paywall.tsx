/**
 * 페이월 컴포넌트
 * - 구독 플랜 선택 UI
 * - 다국어 지원
 * - 결제 플로우 연동 준비
 */

import { useState, useEffect, useRef } from 'react';
import { useI18n, type Language } from '../i18n/useI18n';
import { useProStore, PRO_FEATURES, PRICING } from '../stores/useProStore';

// 페이월 텍스트 (다국어)
const PAYWALL_TEXTS: Record<Language, Record<string, string>> = {
  ko: {
    title: 'Pro로 업그레이드',
    subtitle: '무제한 시뮬레이션과 프리미엄 기능을 즐기세요',
    monthly: '월간',
    yearly: '연간',
    perMonth: '/월',
    bestValue: '최고 가치',
    save: '절약',
    startFreeTrial: '7일 무료 체험 시작',
    continue: '계속하기',
    restore: '구매 복원',
    termsNotice: '구독은 자동으로 갱신됩니다. 언제든 취소 가능합니다.',
    features: '포함된 기능',
    close: '닫기',
    popular: '인기',
    limitReached: '일일 무료 사용 한도에 도달했습니다',
    upgradeToUnlock: 'Pro로 업그레이드하여 무제한 이용하세요',
  },
  en: {
    title: 'Upgrade to Pro',
    subtitle: 'Enjoy unlimited simulations and premium features',
    monthly: 'Monthly',
    yearly: 'Yearly',
    perMonth: '/mo',
    bestValue: 'Best Value',
    save: 'Save',
    startFreeTrial: 'Start 7-Day Free Trial',
    continue: 'Continue',
    restore: 'Restore Purchase',
    termsNotice: 'Subscription auto-renews. Cancel anytime.',
    features: 'Features Included',
    close: 'Close',
    popular: 'Popular',
    limitReached: 'Daily free limit reached',
    upgradeToUnlock: 'Upgrade to Pro for unlimited access',
  },
  zh: {
    title: '升级到 Pro',
    subtitle: '享受无限模拟和高级功能',
    monthly: '月度',
    yearly: '年度',
    perMonth: '/月',
    bestValue: '最佳价值',
    save: '节省',
    startFreeTrial: '开始7天免费试用',
    continue: '继续',
    restore: '恢复购买',
    termsNotice: '订阅自动续订。可随时取消。',
    features: '包含功能',
    close: '关闭',
    popular: '热门',
    limitReached: '已达到每日免费限制',
    upgradeToUnlock: '升级到 Pro 享受无限使用',
  },
  ja: {
    title: 'Proにアップグレード',
    subtitle: '無制限のシミュレーションとプレミアム機能を楽しもう',
    monthly: '月額',
    yearly: '年額',
    perMonth: '/月',
    bestValue: 'お得',
    save: '節約',
    startFreeTrial: '7日間無料トライアル開始',
    continue: '続ける',
    restore: '購入を復元',
    termsNotice: 'サブスクリプションは自動更新されます。いつでもキャンセル可能。',
    features: '含まれる機能',
    close: '閉じる',
    popular: '人気',
    limitReached: '1日の無料制限に達しました',
    upgradeToUnlock: 'Proにアップグレードして無制限に',
  },
  es: {
    title: 'Actualizar a Pro',
    subtitle: 'Disfruta de simulaciones ilimitadas y funciones premium',
    monthly: 'Mensual',
    yearly: 'Anual',
    perMonth: '/mes',
    bestValue: 'Mejor Valor',
    save: 'Ahorra',
    startFreeTrial: 'Iniciar Prueba de 7 Días',
    continue: 'Continuar',
    restore: 'Restaurar Compra',
    termsNotice: 'La suscripción se renueva automáticamente. Cancela cuando quieras.',
    features: 'Funciones Incluidas',
    close: 'Cerrar',
    popular: 'Popular',
    limitReached: 'Límite diario gratuito alcanzado',
    upgradeToUnlock: 'Actualiza a Pro para acceso ilimitado',
  },
  pt: {
    title: 'Atualizar para Pro',
    subtitle: 'Aproveite simulações ilimitadas e recursos premium',
    monthly: 'Mensal',
    yearly: 'Anual',
    perMonth: '/mês',
    bestValue: 'Melhor Valor',
    save: 'Economize',
    startFreeTrial: 'Iniciar Teste de 7 Dias',
    continue: 'Continuar',
    restore: 'Restaurar Compra',
    termsNotice: 'A assinatura é renovada automaticamente. Cancele a qualquer momento.',
    features: 'Recursos Incluídos',
    close: 'Fechar',
    popular: 'Popular',
    limitReached: 'Limite diário gratuito atingido',
    upgradeToUnlock: 'Atualize para Pro para acesso ilimitado',
  },
  fr: {
    title: 'Passer à Pro',
    subtitle: 'Profitez de simulations illimitées et de fonctionnalités premium',
    monthly: 'Mensuel',
    yearly: 'Annuel',
    perMonth: '/mois',
    bestValue: 'Meilleur Valeur',
    save: 'Économisez',
    startFreeTrial: 'Commencer l\'essai de 7 jours',
    continue: 'Continuer',
    restore: 'Restaurer l\'achat',
    termsNotice: 'L\'abonnement se renouvelle automatiquement. Annulez à tout moment.',
    features: 'Fonctionnalités Incluses',
    close: 'Fermer',
    popular: 'Populaire',
    limitReached: 'Limite quotidienne gratuite atteinte',
    upgradeToUnlock: 'Passez à Pro pour un accès illimité',
  },
  de: {
    title: 'Auf Pro upgraden',
    subtitle: 'Unbegrenzte Simulationen und Premium-Funktionen genießen',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    perMonth: '/Monat',
    bestValue: 'Bester Wert',
    save: 'Sparen',
    startFreeTrial: '7-tägige Testversion starten',
    continue: 'Fortfahren',
    restore: 'Kauf wiederherstellen',
    termsNotice: 'Das Abonnement verlängert sich automatisch. Jederzeit kündbar.',
    features: 'Enthaltene Funktionen',
    close: 'Schließen',
    popular: 'Beliebt',
    limitReached: 'Tägliches Gratis-Limit erreicht',
    upgradeToUnlock: 'Auf Pro upgraden für unbegrenzten Zugang',
  },
  th: {
    title: 'อัปเกรดเป็น Pro',
    subtitle: 'เพลิดเพลินกับการจำลองไม่จำกัดและฟีเจอร์พรีเมียม',
    monthly: 'รายเดือน',
    yearly: 'รายปี',
    perMonth: '/เดือน',
    bestValue: 'คุ้มค่าที่สุด',
    save: 'ประหยัด',
    startFreeTrial: 'เริ่มทดลองใช้ฟรี 7 วัน',
    continue: 'ดำเนินการต่อ',
    restore: 'กู้คืนการซื้อ',
    termsNotice: 'สมัครสมาชิกต่ออายุอัตโนมัติ สามารถยกเลิกได้ทุกเมื่อ',
    features: 'ฟีเจอร์ที่รวมอยู่',
    close: 'ปิด',
    popular: 'ยอดนิยม',
    limitReached: 'ถึงขีดจำกัดฟรีรายวันแล้ว',
    upgradeToUnlock: 'อัปเกรดเป็น Pro เพื่อใช้งานไม่จำกัด',
  },
  vi: {
    title: 'Nâng cấp lên Pro',
    subtitle: 'Tận hưởng mô phỏng không giới hạn và tính năng cao cấp',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    perMonth: '/tháng',
    bestValue: 'Giá trị tốt nhất',
    save: 'Tiết kiệm',
    startFreeTrial: 'Bắt đầu dùng thử 7 ngày',
    continue: 'Tiếp tục',
    restore: 'Khôi phục giao dịch',
    termsNotice: 'Đăng ký tự động gia hạn. Hủy bất cứ lúc nào.',
    features: 'Tính năng bao gồm',
    close: 'Đóng',
    popular: 'Phổ biến',
    limitReached: 'Đã đạt giới hạn miễn phí hàng ngày',
    upgradeToUnlock: 'Nâng cấp lên Pro để truy cập không giới hạn',
  },
  id: {
    title: 'Upgrade ke Pro',
    subtitle: 'Nikmati simulasi tak terbatas dan fitur premium',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    perMonth: '/bulan',
    bestValue: 'Nilai Terbaik',
    save: 'Hemat',
    startFreeTrial: 'Mulai Uji Coba 7 Hari',
    continue: 'Lanjutkan',
    restore: 'Pulihkan Pembelian',
    termsNotice: 'Langganan diperbarui otomatis. Batalkan kapan saja.',
    features: 'Fitur Termasuk',
    close: 'Tutup',
    popular: 'Populer',
    limitReached: 'Batas harian gratis tercapai',
    upgradeToUnlock: 'Upgrade ke Pro untuk akses tak terbatas',
  },
  hi: {
    title: 'Pro में अपग्रेड करें',
    subtitle: 'असीमित सिमुलेशन और प्रीमियम सुविधाओं का आनंद लें',
    monthly: 'मासिक',
    yearly: 'वार्षिक',
    perMonth: '/महीना',
    bestValue: 'सर्वोत्तम मूल्य',
    save: 'बचाएं',
    startFreeTrial: '7 दिन का निःशुल्क परीक्षण शुरू करें',
    continue: 'जारी रखें',
    restore: 'खरीद पुनर्स्थापित करें',
    termsNotice: 'सदस्यता स्वचालित रूप से नवीनीकृत होती है। कभी भी रद्द करें।',
    features: 'शामिल सुविधाएं',
    close: 'बंद करें',
    popular: 'लोकप्रिय',
    limitReached: 'दैनिक मुफ्त सीमा पूरी हुई',
    upgradeToUnlock: 'असीमित पहुंच के लिए Pro में अपग्रेड करें',
  },
  ar: {
    title: 'الترقية إلى Pro',
    subtitle: 'استمتع بمحاكاة غير محدودة وميزات متميزة',
    monthly: 'شهري',
    yearly: 'سنوي',
    perMonth: '/شهر',
    bestValue: 'أفضل قيمة',
    save: 'وفر',
    startFreeTrial: 'ابدأ التجربة المجانية لمدة 7 أيام',
    continue: 'متابعة',
    restore: 'استعادة الشراء',
    termsNotice: 'يتجدد الاشتراك تلقائياً. يمكن الإلغاء في أي وقت.',
    features: 'الميزات المتضمنة',
    close: 'إغلاق',
    popular: 'شائع',
    limitReached: 'تم الوصول إلى الحد اليومي المجاني',
    upgradeToUnlock: 'قم بالترقية إلى Pro للوصول غير المحدود',
  },
};

// 기능 이름 다국어
const FEATURE_NAMES: Record<Language, Record<string, string>> = {
  ko: { no_ads: '광고 제거', unlimited_simulations: '무제한 시뮬레이션', hd_export: 'HD 저장', priority_processing: '우선 처리', exclusive_styles: '프리미엄 스타일', back_view: '뒷머리 생성', color_customization: '색상 커스텀', history_sync: '클라우드 동기화' },
  en: { no_ads: 'No Ads', unlimited_simulations: 'Unlimited Simulations', hd_export: 'HD Export', priority_processing: 'Priority Processing', exclusive_styles: 'Premium Styles', back_view: 'Back View', color_customization: 'Color Custom', history_sync: 'Cloud Sync' },
  zh: { no_ads: '无广告', unlimited_simulations: '无限模拟', hd_export: 'HD导出', priority_processing: '优先处理', exclusive_styles: '高级风格', back_view: '后视图', color_customization: '颜色定制', history_sync: '云同步' },
  ja: { no_ads: '広告なし', unlimited_simulations: '無制限シミュレーション', hd_export: 'HD保存', priority_processing: '優先処理', exclusive_styles: 'プレミアムスタイル', back_view: '後ろ姿', color_customization: 'カラーカスタム', history_sync: 'クラウド同期' },
  es: { no_ads: 'Sin Anuncios', unlimited_simulations: 'Simulaciones Ilimitadas', hd_export: 'Exportar HD', priority_processing: 'Procesamiento Prioritario', exclusive_styles: 'Estilos Premium', back_view: 'Vista Trasera', color_customization: 'Color Personalizado', history_sync: 'Sincronización en la Nube' },
  pt: { no_ads: 'Sem Anúncios', unlimited_simulations: 'Simulações Ilimitadas', hd_export: 'Exportar HD', priority_processing: 'Processamento Prioritário', exclusive_styles: 'Estilos Premium', back_view: 'Vista Traseira', color_customization: 'Cor Personalizada', history_sync: 'Sincronização na Nuvem' },
  fr: { no_ads: 'Sans Publicité', unlimited_simulations: 'Simulations Illimitées', hd_export: 'Export HD', priority_processing: 'Traitement Prioritaire', exclusive_styles: 'Styles Premium', back_view: 'Vue Arrière', color_customization: 'Couleur Personnalisée', history_sync: 'Synchronisation Cloud' },
  de: { no_ads: 'Keine Werbung', unlimited_simulations: 'Unbegrenzte Simulationen', hd_export: 'HD-Export', priority_processing: 'Prioritätsverarbeitung', exclusive_styles: 'Premium-Stile', back_view: 'Rückansicht', color_customization: 'Farbauswahl', history_sync: 'Cloud-Synchronisierung' },
  th: { no_ads: 'ไม่มีโฆษณา', unlimited_simulations: 'จำลองไม่จำกัด', hd_export: 'ส่งออก HD', priority_processing: 'ประมวลผลเร็ว', exclusive_styles: 'สไตล์พรีเมียม', back_view: 'มุมหลัง', color_customization: 'สีกำหนดเอง', history_sync: 'ซิงค์คลาวด์' },
  vi: { no_ads: 'Không Quảng cáo', unlimited_simulations: 'Mô phỏng Không giới hạn', hd_export: 'Xuất HD', priority_processing: 'Xử lý Ưu tiên', exclusive_styles: 'Kiểu dáng Cao cấp', back_view: 'Mặt sau', color_customization: 'Tùy chỉnh Màu', history_sync: 'Đồng bộ Đám mây' },
  id: { no_ads: 'Tanpa Iklan', unlimited_simulations: 'Simulasi Tak Terbatas', hd_export: 'Ekspor HD', priority_processing: 'Pemrosesan Prioritas', exclusive_styles: 'Gaya Premium', back_view: 'Tampilan Belakang', color_customization: 'Kustomisasi Warna', history_sync: 'Sinkronisasi Cloud' },
  hi: { no_ads: 'विज्ञापन नहीं', unlimited_simulations: 'असीमित सिमुलेशन', hd_export: 'HD निर्यात', priority_processing: 'प्राथमिकता प्रसंस्करण', exclusive_styles: 'प्रीमियम स्टाइल', back_view: 'पीछे का दृश्य', color_customization: 'रंग कस्टम', history_sync: 'क्लाउड सिंक' },
  ar: { no_ads: 'بدون إعلانات', unlimited_simulations: 'محاكاة غير محدودة', hd_export: 'تصدير HD', priority_processing: 'معالجة أولوية', exclusive_styles: 'أنماط متميزة', back_view: 'عرض خلفي', color_customization: 'تخصيص اللون', history_sync: 'مزامنة سحابية' },
};

interface PaywallProps {
  onClose: () => void;
  reason?: 'limit_reached' | 'feature_locked' | 'upgrade';
  lockedFeature?: string;
}

export default function Paywall({ onClose, reason = 'upgrade', lockedFeature }: PaywallProps) {
  const { language } = useI18n();
  const texts = PAYWALL_TEXTS[language] || PAYWALL_TEXTS.en;
  const featureNames = FEATURE_NAMES[language] || FEATURE_NAMES.en;
  const { setSubscription } = useProStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('pro');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  // RTL 지원
  const isRtl = language === 'ar';

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isProcessing]);

  // 포커스 트랩
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, []);

  // lockedFeature에 따라 기본 플랜 선택
  useEffect(() => {
    if (lockedFeature) {
      const feature = PRO_FEATURES.find(f => f.id === lockedFeature);
      if (feature?.tier === 'premium') {
        setSelectedPlan('premium');
      }
    }
  }, [lockedFeature]);

  const pricing = PRICING[selectedPlan];
  const currentPrice = billingPeriod === 'yearly' ? pricing.yearly : pricing.monthly;
  const monthlyEquivalent = billingPeriod === 'yearly' ? pricing.yearlyMonthly : pricing.monthly;

  const handlePurchase = async () => {
    setIsProcessing(true);

    // TODO: 실제 인앱결제 연동
    // RevenueCat, Stripe, 또는 네이티브 결제 API 연동
    try {
      // 데모용 - 실제로는 결제 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 결제 성공 시 구독 상태 업데이트
      setSubscription({
        tier: selectedPlan,
        subscriptionId: `demo_${Date.now()}`,
        expiresAt: Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000,
        billingPeriod,
      });

      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    // TODO: 구매 복원 로직
    console.log('Restoring purchases...');
  };

  // Pro 플랜 기능
  const proFeatures = PRO_FEATURES.filter((f) => f.tier === 'pro').slice(0, 4);
  // Premium 플랜 추가 기능
  const premiumFeatures = PRO_FEATURES.filter((f) => f.tier === 'premium');

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget && !isProcessing) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={`bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto ${isRtl ? 'rtl' : 'ltr'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1a2e] to-transparent p-5 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-50"
            aria-label={texts.close}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleRestore}
            disabled={isProcessing}
            className="text-sm text-white/60 px-3 py-1.5 disabled:opacity-50"
          >
            {texts.restore}
          </button>
        </div>

        {/* Hero */}
        <div className="px-6 text-center pb-6">
          {/* 제한 도달 메시지 */}
          {reason === 'limit_reached' && (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4 mb-4">
              <p className="text-orange-300 font-medium">{texts.limitReached}</p>
              <p className="text-orange-200/70 text-sm mt-1">{texts.upgradeToUnlock}</p>
            </div>
          )}

          {/* 아이콘 */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <span className="text-4xl">
              {selectedPlan === 'premium' ? '👑' : '⭐'}
            </span>
          </div>

          <h2 id="paywall-title" className="text-2xl font-bold text-white mb-2">{texts.title}</h2>
          <p className="text-white/60 text-sm">{texts.subtitle}</p>
        </div>

        {/* Plan Selection */}
        <div className="px-6 pb-4">
          <div className="flex gap-3">
            {/* Pro Plan */}
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                selectedPlan === 'pro'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Pro</span>
                {selectedPlan === 'pro' && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {texts.popular}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-xs text-left">
                ${PRICING.pro.yearlyMonthly}{texts.perMonth}
              </p>
            </button>

            {/* Premium Plan */}
            <button
              onClick={() => setSelectedPlan('premium')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                selectedPlan === 'premium'
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Premium</span>
                <span className="text-amber-400">👑</span>
              </div>
              <p className="text-white/60 text-xs text-left">
                ${PRICING.premium.yearlyMonthly}{texts.perMonth}
              </p>
            </button>
          </div>
        </div>

        {/* Billing Period */}
        <div className="px-6 pb-4">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50'
              }`}
            >
              {texts.monthly}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white/50'
              }`}
            >
              {texts.yearly}
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {texts.save} {pricing.savings}
              </span>
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="px-6 pb-4 text-center">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">${currentPrice}</span>
              <span className="text-white/50">
                /{billingPeriod === 'yearly' ? 'year' : 'month'}
              </span>
            </div>
            {billingPeriod === 'yearly' && (
              <p className="text-white/50 text-sm mt-1">
                ${monthlyEquivalent}{texts.perMonth}
              </p>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="px-6 pb-4">
          <h3 className="text-white/80 text-sm font-medium mb-3">{texts.features}</h3>
          <div className="space-y-2">
            {proFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center gap-3 p-2">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-white/80 text-sm">
                  {featureNames[feature.id] || feature.name}
                </span>
                <svg className="w-4 h-4 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ))}
            {selectedPlan === 'premium' && premiumFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-xl">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-amber-200/80 text-sm">
                  {featureNames[feature.id] || feature.name}
                </span>
                <span className="text-amber-400 text-xs ml-auto">Premium</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-6 pb-4">
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              texts.startFreeTrial
            )}
          </button>
        </div>

        {/* Terms Notice */}
        <div className="px-6 pb-8 text-center">
          <p className="text-white/40 text-xs">{texts.termsNotice}</p>
        </div>
      </div>
    </div>
  );
}

// 사용량 제한 표시 컴포넌트
export function UsageIndicator() {
  const { language } = useI18n();
  const { tier, getRemainingSimulations } = useProStore();
  const [showPaywall, setShowPaywall] = useState(false);

  if (tier !== 'free') return null;

  const remaining = getRemainingSimulations();

  const texts: Record<Language, { remaining: string; upgrade: string }> = {
    ko: { remaining: '남은 횟수', upgrade: '업그레이드' },
    en: { remaining: 'Remaining', upgrade: 'Upgrade' },
    zh: { remaining: '剩余次数', upgrade: '升级' },
    ja: { remaining: '残り回数', upgrade: 'アップグレード' },
    es: { remaining: 'Restantes', upgrade: 'Actualizar' },
    pt: { remaining: 'Restantes', upgrade: 'Atualizar' },
    fr: { remaining: 'Restants', upgrade: 'Mettre à niveau' },
    de: { remaining: 'Verbleibend', upgrade: 'Upgraden' },
    th: { remaining: 'เหลือ', upgrade: 'อัปเกรด' },
    vi: { remaining: 'Còn lại', upgrade: 'Nâng cấp' },
    id: { remaining: 'Tersisa', upgrade: 'Upgrade' },
    hi: { remaining: 'शेष', upgrade: 'अपग्रेड' },
    ar: { remaining: 'المتبقي', upgrade: 'ترقية' },
  };

  const t = texts[language] || texts.en;

  return (
    <>
      <button
        onClick={() => setShowPaywall(true)}
        className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5"
      >
        <span className="text-white/60 text-xs">{t.remaining}:</span>
        <span className={`font-semibold text-sm ${remaining <= 1 ? 'text-red-400' : 'text-white'}`}>
          {remaining}/5
        </span>
        <span className="text-purple-400 text-xs font-medium">{t.upgrade}</span>
      </button>

      {showPaywall && (
        <Paywall onClose={() => setShowPaywall(false)} reason="upgrade" />
      )}
    </>
  );
}
