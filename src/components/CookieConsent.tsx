import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useI18n';

interface ConsentSettings {
  necessary: boolean; // Always true, required
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_VERSION = '1.0';
const CONSENT_KEY = 'looksim-consent';

export const getConsentSettings = (): ConsentSettings | null => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
};

export const saveConsentSettings = (settings: Omit<ConsentSettings, 'timestamp' | 'version' | 'necessary'>) => {
  const fullSettings: ConsentSettings = {
    ...settings,
    necessary: true,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(fullSettings));

  // Dispatch event for analytics service
  window.dispatchEvent(new CustomEvent('consent-updated', { detail: fullSettings }));

  return fullSettings;
};

export const hasValidConsent = (): boolean => {
  const settings = getConsentSettings();
  return settings !== null && settings.version === CONSENT_VERSION;
};

export const canUseAnalytics = (): boolean => {
  const settings = getConsentSettings();
  return settings?.analytics === true;
};

export const canUseMarketing = (): boolean => {
  const settings = getConsentSettings();
  return settings?.marketing === true;
};

// Cookie consent translations
const consentTranslations = {
  ko: {
    title: '개인정보 보호',
    description: 'LookSim은 더 나은 서비스를 위해 쿠키를 사용합니다. 필수 쿠키는 앱 작동에 필요하며, 분석 및 마케팅 쿠키는 선택 사항입니다.',
    necessary: '필수 쿠키',
    necessary_desc: '앱 기본 기능에 필수',
    analytics: '분석 쿠키',
    analytics_desc: '앱 사용 패턴 분석',
    marketing: '마케팅 쿠키',
    marketing_desc: '맞춤 광고 제공',
    personalization: '개인화 쿠키',
    personalization_desc: '사용자 경험 개선',
    accept_all: '모두 수락',
    accept_necessary: '필수만 수락',
    customize: '설정',
    save: '저장',
    privacy_link: '개인정보처리방침',
  },
  en: {
    title: 'Privacy Settings',
    description: 'LookSim uses cookies to improve your experience. Essential cookies are required for the app to function. Analytics and marketing cookies are optional.',
    necessary: 'Essential Cookies',
    necessary_desc: 'Required for basic app functionality',
    analytics: 'Analytics Cookies',
    analytics_desc: 'Help us understand app usage',
    marketing: 'Marketing Cookies',
    marketing_desc: 'Used for targeted advertising',
    personalization: 'Personalization Cookies',
    personalization_desc: 'Improve your experience',
    accept_all: 'Accept All',
    accept_necessary: 'Essential Only',
    customize: 'Customize',
    save: 'Save',
    privacy_link: 'Privacy Policy',
  },
  es: {
    title: 'Configuración de Privacidad',
    description: 'LookSim utiliza cookies para mejorar tu experiencia. Las cookies esenciales son necesarias. Las cookies de análisis y marketing son opcionales.',
    necessary: 'Cookies Esenciales',
    necessary_desc: 'Necesarias para el funcionamiento',
    analytics: 'Cookies de Análisis',
    analytics_desc: 'Nos ayudan a entender el uso',
    marketing: 'Cookies de Marketing',
    marketing_desc: 'Para publicidad personalizada',
    personalization: 'Cookies de Personalización',
    personalization_desc: 'Mejoran tu experiencia',
    accept_all: 'Aceptar Todo',
    accept_necessary: 'Solo Esenciales',
    customize: 'Personalizar',
    save: 'Guardar',
    privacy_link: 'Política de Privacidad',
  },
  pt: {
    title: 'Configurações de Privacidade',
    description: 'O LookSim usa cookies para melhorar sua experiência. Cookies essenciais são necessários. Cookies de análise e marketing são opcionais.',
    necessary: 'Cookies Essenciais',
    necessary_desc: 'Necessários para funcionamento',
    analytics: 'Cookies de Análise',
    analytics_desc: 'Nos ajudam a entender o uso',
    marketing: 'Cookies de Marketing',
    marketing_desc: 'Para publicidade direcionada',
    personalization: 'Cookies de Personalização',
    personalization_desc: 'Melhoram sua experiência',
    accept_all: 'Aceitar Tudo',
    accept_necessary: 'Apenas Essenciais',
    customize: 'Personalizar',
    save: 'Salvar',
    privacy_link: 'Política de Privacidade',
  },
  fr: {
    title: 'Paramètres de Confidentialité',
    description: 'LookSim utilise des cookies pour améliorer votre expérience. Les cookies essentiels sont requis. Les cookies analytiques et marketing sont optionnels.',
    necessary: 'Cookies Essentiels',
    necessary_desc: 'Requis pour le fonctionnement',
    analytics: 'Cookies Analytiques',
    analytics_desc: 'Nous aident à comprendre l\'utilisation',
    marketing: 'Cookies Marketing',
    marketing_desc: 'Pour la publicité ciblée',
    personalization: 'Cookies de Personnalisation',
    personalization_desc: 'Améliorent votre expérience',
    accept_all: 'Tout Accepter',
    accept_necessary: 'Essentiels Uniquement',
    customize: 'Personnaliser',
    save: 'Enregistrer',
    privacy_link: 'Politique de Confidentialité',
  },
  de: {
    title: 'Datenschutzeinstellungen',
    description: 'LookSim verwendet Cookies zur Verbesserung Ihrer Erfahrung. Essentielle Cookies sind erforderlich. Analyse- und Marketing-Cookies sind optional.',
    necessary: 'Essentielle Cookies',
    necessary_desc: 'Für die Grundfunktionen erforderlich',
    analytics: 'Analyse-Cookies',
    analytics_desc: 'Helfen uns, die Nutzung zu verstehen',
    marketing: 'Marketing-Cookies',
    marketing_desc: 'Für gezielte Werbung',
    personalization: 'Personalisierungs-Cookies',
    personalization_desc: 'Verbessern Ihre Erfahrung',
    accept_all: 'Alle Akzeptieren',
    accept_necessary: 'Nur Essentielle',
    customize: 'Anpassen',
    save: 'Speichern',
    privacy_link: 'Datenschutzrichtlinie',
  },
  ar: {
    title: 'إعدادات الخصوصية',
    description: 'يستخدم LookSim ملفات تعريف الارتباط لتحسين تجربتك. ملفات تعريف الارتباط الأساسية مطلوبة. ملفات التحليل والتسويق اختيارية.',
    necessary: 'ملفات أساسية',
    necessary_desc: 'مطلوبة للوظائف الأساسية',
    analytics: 'ملفات التحليل',
    analytics_desc: 'تساعدنا في فهم الاستخدام',
    marketing: 'ملفات التسويق',
    marketing_desc: 'للإعلانات المستهدفة',
    personalization: 'ملفات التخصيص',
    personalization_desc: 'تحسين تجربتك',
    accept_all: 'قبول الكل',
    accept_necessary: 'الأساسية فقط',
    customize: 'تخصيص',
    save: 'حفظ',
    privacy_link: 'سياسة الخصوصية',
  },
  zh: {
    title: '隐私设置',
    description: 'LookSim使用Cookie来改善您的体验。必要Cookie是应用运行所必需的。分析和营销Cookie是可选的。',
    necessary: '必要Cookie',
    necessary_desc: '应用基本功能所需',
    analytics: '分析Cookie',
    analytics_desc: '帮助我们了解使用情况',
    marketing: '营销Cookie',
    marketing_desc: '用于定向广告',
    personalization: '个性化Cookie',
    personalization_desc: '改善您的体验',
    accept_all: '全部接受',
    accept_necessary: '仅必要',
    customize: '自定义',
    save: '保存',
    privacy_link: '隐私政策',
  },
  ja: {
    title: 'プライバシー設定',
    description: 'LookSimはお客様の体験を向上させるためにCookieを使用しています。必須Cookieはアプリの動作に必要です。分析・マーケティングCookieはオプションです。',
    necessary: '必須Cookie',
    necessary_desc: '基本機能に必要',
    analytics: '分析Cookie',
    analytics_desc: '使用状況の把握に役立ちます',
    marketing: 'マーケティングCookie',
    marketing_desc: 'ターゲット広告用',
    personalization: 'パーソナライズCookie',
    personalization_desc: '体験を向上させます',
    accept_all: 'すべて同意',
    accept_necessary: '必須のみ',
    customize: 'カスタマイズ',
    save: '保存',
    privacy_link: 'プライバシーポリシー',
  },
  th: {
    title: 'การตั้งค่าความเป็นส่วนตัว',
    description: 'LookSim ใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ คุกกี้ที่จำเป็นต้องใช้สำหรับการทำงานของแอป คุกกี้วิเคราะห์และการตลาดเป็นทางเลือก',
    necessary: 'คุกกี้ที่จำเป็น',
    necessary_desc: 'จำเป็นสำหรับฟังก์ชันพื้นฐาน',
    analytics: 'คุกกี้วิเคราะห์',
    analytics_desc: 'ช่วยเราเข้าใจการใช้งาน',
    marketing: 'คุกกี้การตลาด',
    marketing_desc: 'สำหรับโฆษณาเป้าหมาย',
    personalization: 'คุกกี้ส่วนบุคคล',
    personalization_desc: 'ปรับปรุงประสบการณ์ของคุณ',
    accept_all: 'ยอมรับทั้งหมด',
    accept_necessary: 'เฉพาะที่จำเป็น',
    customize: 'ปรับแต่ง',
    save: 'บันทึก',
    privacy_link: 'นโยบายความเป็นส่วนตัว',
  },
  vi: {
    title: 'Cài đặt Quyền riêng tư',
    description: 'LookSim sử dụng cookie để cải thiện trải nghiệm của bạn. Cookie thiết yếu là bắt buộc. Cookie phân tích và tiếp thị là tùy chọn.',
    necessary: 'Cookie Thiết yếu',
    necessary_desc: 'Cần thiết cho chức năng cơ bản',
    analytics: 'Cookie Phân tích',
    analytics_desc: 'Giúp chúng tôi hiểu việc sử dụng',
    marketing: 'Cookie Tiếp thị',
    marketing_desc: 'Cho quảng cáo nhắm mục tiêu',
    personalization: 'Cookie Cá nhân hóa',
    personalization_desc: 'Cải thiện trải nghiệm của bạn',
    accept_all: 'Chấp nhận Tất cả',
    accept_necessary: 'Chỉ Thiết yếu',
    customize: 'Tùy chỉnh',
    save: 'Lưu',
    privacy_link: 'Chính sách Bảo mật',
  },
  id: {
    title: 'Pengaturan Privasi',
    description: 'LookSim menggunakan cookie untuk meningkatkan pengalaman Anda. Cookie penting diperlukan. Cookie analitik dan pemasaran bersifat opsional.',
    necessary: 'Cookie Penting',
    necessary_desc: 'Diperlukan untuk fungsi dasar',
    analytics: 'Cookie Analitik',
    analytics_desc: 'Membantu kami memahami penggunaan',
    marketing: 'Cookie Pemasaran',
    marketing_desc: 'Untuk iklan bertarget',
    personalization: 'Cookie Personalisasi',
    personalization_desc: 'Meningkatkan pengalaman Anda',
    accept_all: 'Terima Semua',
    accept_necessary: 'Hanya Penting',
    customize: 'Sesuaikan',
    save: 'Simpan',
    privacy_link: 'Kebijakan Privasi',
  },
  hi: {
    title: 'गोपनीयता सेटिंग्स',
    description: 'LookSim आपके अनुभव को बेहतर बनाने के लिए कुकीज़ का उपयोग करता है। आवश्यक कुकीज़ अनिवार्य हैं। विश्लेषण और मार्केटिंग कुकीज़ वैकल्पिक हैं।',
    necessary: 'आवश्यक कुकीज़',
    necessary_desc: 'बुनियादी कार्यों के लिए आवश्यक',
    analytics: 'विश्लेषण कुकीज़',
    analytics_desc: 'उपयोग समझने में मदद करती हैं',
    marketing: 'मार्केटिंग कुकीज़',
    marketing_desc: 'लक्षित विज्ञापनों के लिए',
    personalization: 'वैयक्तिकरण कुकीज़',
    personalization_desc: 'आपके अनुभव को बेहतर बनाती हैं',
    accept_all: 'सभी स्वीकार करें',
    accept_necessary: 'केवल आवश्यक',
    customize: 'कस्टमाइज़ करें',
    save: 'सहेजें',
    privacy_link: 'गोपनीयता नीति',
  },
};

type ConsentLang = keyof typeof consentTranslations;

export default function CookieConsent() {
  const { language } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState({
    analytics: true,
    marketing: false,
    personalization: true,
  });

  const t = consentTranslations[language as ConsentLang] || consentTranslations.en;

  useEffect(() => {
    // Check if consent is needed
    if (!hasValidConsent()) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    saveConsentSettings({
      analytics: true,
      marketing: true,
      personalization: true,
    });
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    saveConsentSettings({
      analytics: false,
      marketing: false,
      personalization: false,
    });
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    saveConsentSettings(settings);
    setShowBanner(false);
    setShowDetails(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 pointer-events-auto animate-slide-up"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <h2 id="cookie-consent-title" className="text-lg font-bold text-gray-900 mb-2">
          {t.title}
        </h2>

        <p id="cookie-consent-description" className="text-sm text-gray-600 mb-4">
          {t.description}
        </p>

        {showDetails && (
          <div className="space-y-3 mb-4 border-t border-gray-100 pt-4">
            {/* Necessary - Always enabled */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{t.necessary}</span>
                <p className="text-xs text-gray-500">{t.necessary_desc}</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-5 h-5 rounded text-primary bg-gray-200"
              />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="font-medium text-gray-900">{t.analytics}</span>
                <p className="text-xs text-gray-500">{t.analytics_desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.analytics}
                onChange={(e) => setSettings(s => ({ ...s, analytics: e.target.checked }))}
                className="w-5 h-5 rounded text-primary cursor-pointer"
              />
            </label>

            {/* Marketing */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="font-medium text-gray-900">{t.marketing}</span>
                <p className="text-xs text-gray-500">{t.marketing_desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.marketing}
                onChange={(e) => setSettings(s => ({ ...s, marketing: e.target.checked }))}
                className="w-5 h-5 rounded text-primary cursor-pointer"
              />
            </label>

            {/* Personalization */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="font-medium text-gray-900">{t.personalization}</span>
                <p className="text-xs text-gray-500">{t.personalization_desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.personalization}
                onChange={(e) => setSettings(s => ({ ...s, personalization: e.target.checked }))}
                className="w-5 h-5 rounded text-primary cursor-pointer"
              />
            </label>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {showDetails ? (
            <button
              onClick={handleSaveSettings}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl btn-feedback"
            >
              {t.save}
            </button>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl btn-feedback"
              >
                {t.accept_all}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl btn-feedback"
                >
                  {t.accept_necessary}
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl btn-feedback"
                >
                  {t.customize}
                </button>
              </div>
            </>
          )}
        </div>

        <a
          href="/privacy"
          className="block text-center text-sm text-primary mt-3 hover:underline"
        >
          {t.privacy_link}
        </a>
      </div>
    </div>
  );
}
