/**
 * SEO 최적화 서비스
 * - 다국어 hreflang 태그
 * - 동적 메타 태그 관리
 * - 구조화된 데이터 (Schema.org)
 * - Open Graph / Twitter Cards
 * - 언어별 타이틀 및 설명
 */

import type { Language } from '../i18n/translations';

// 언어 코드를 hreflang 형식으로 매핑
const HREFLANG_MAP: Record<Language, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  es: 'es-ES',
  pt: 'pt-BR',
  fr: 'fr-FR',
  de: 'de-DE',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  hi: 'hi-IN',
  ar: 'ar-SA',
};

// 언어별 SEO 제목
const PAGE_TITLES: Record<Language, Record<string, string>> = {
  ko: {
    home: 'LookSim - AI 헤어스타일 시뮬레이터 | 무료 가상 헤어 체험',
    camera: '사진 촬영 | LookSim',
    result: '시뮬레이션 결과 | LookSim',
    custom: '커스텀 스타일 | LookSim',
    analysis: '얼굴형 분석 | LookSim',
    settings: '설정 | LookSim',
    history: '히스토리 | LookSim',
  },
  en: {
    home: 'LookSim - AI Hair Simulator | Free Virtual Hair Try-On',
    camera: 'Take Photo | LookSim',
    result: 'Simulation Result | LookSim',
    custom: 'Custom Style | LookSim',
    analysis: 'Face Analysis | LookSim',
    settings: 'Settings | LookSim',
    history: 'History | LookSim',
  },
  zh: {
    home: 'LookSim - AI发型模拟器 | 免费虚拟发型体验',
    camera: '拍照 | LookSim',
    result: '模拟结果 | LookSim',
    custom: '自定义风格 | LookSim',
    analysis: '脸型分析 | LookSim',
    settings: '设置 | LookSim',
    history: '历史记录 | LookSim',
  },
  ja: {
    home: 'LookSim - AIヘアスタイルシミュレーター | 無料バーチャルヘア体験',
    camera: '写真を撮る | LookSim',
    result: 'シミュレーション結果 | LookSim',
    custom: 'カスタムスタイル | LookSim',
    analysis: '顔の分析 | LookSim',
    settings: '設定 | LookSim',
    history: '履歴 | LookSim',
  },
  es: {
    home: 'LookSim - Simulador de Peinados con IA | Prueba Virtual Gratis',
    camera: 'Tomar Foto | LookSim',
    result: 'Resultado de Simulación | LookSim',
    custom: 'Estilo Personalizado | LookSim',
    analysis: 'Análisis Facial | LookSim',
    settings: 'Configuración | LookSim',
    history: 'Historial | LookSim',
  },
  pt: {
    home: 'LookSim - Simulador de Cabelo com IA | Teste Virtual Grátis',
    camera: 'Tirar Foto | LookSim',
    result: 'Resultado da Simulação | LookSim',
    custom: 'Estilo Personalizado | LookSim',
    analysis: 'Análise Facial | LookSim',
    settings: 'Configurações | LookSim',
    history: 'Histórico | LookSim',
  },
  fr: {
    home: 'LookSim - Simulateur de Coiffure IA | Essai Virtuel Gratuit',
    camera: 'Prendre une Photo | LookSim',
    result: 'Résultat de Simulation | LookSim',
    custom: 'Style Personnalisé | LookSim',
    analysis: 'Analyse du Visage | LookSim',
    settings: 'Paramètres | LookSim',
    history: 'Historique | LookSim',
  },
  de: {
    home: 'LookSim - KI-Frisuren-Simulator | Kostenlose Virtuelle Frisur',
    camera: 'Foto aufnehmen | LookSim',
    result: 'Simulationsergebnis | LookSim',
    custom: 'Benutzerdefinierter Stil | LookSim',
    analysis: 'Gesichtsanalyse | LookSim',
    settings: 'Einstellungen | LookSim',
    history: 'Verlauf | LookSim',
  },
  th: {
    home: 'LookSim - จำลองทรงผม AI | ทดลองทรงผมเสมือนจริงฟรี',
    camera: 'ถ่ายรูป | LookSim',
    result: 'ผลการจำลอง | LookSim',
    custom: 'สไตล์กำหนดเอง | LookSim',
    analysis: 'วิเคราะห์ใบหน้า | LookSim',
    settings: 'การตั้งค่า | LookSim',
    history: 'ประวัติ | LookSim',
  },
  vi: {
    home: 'LookSim - Mô phỏng Kiểu tóc AI | Thử Tóc Ảo Miễn phí',
    camera: 'Chụp Ảnh | LookSim',
    result: 'Kết quả Mô phỏng | LookSim',
    custom: 'Phong cách Tùy chỉnh | LookSim',
    analysis: 'Phân tích Khuôn mặt | LookSim',
    settings: 'Cài đặt | LookSim',
    history: 'Lịch sử | LookSim',
  },
  id: {
    home: 'LookSim - Simulator Rambut AI | Coba Rambut Virtual Gratis',
    camera: 'Ambil Foto | LookSim',
    result: 'Hasil Simulasi | LookSim',
    custom: 'Gaya Kustom | LookSim',
    analysis: 'Analisis Wajah | LookSim',
    settings: 'Pengaturan | LookSim',
    history: 'Riwayat | LookSim',
  },
  hi: {
    home: 'LookSim - AI हेयर सिम्युलेटर | मुफ्त वर्चुअल हेयर ट्राई-ऑन',
    camera: 'फोटो लें | LookSim',
    result: 'सिमुलेशन परिणाम | LookSim',
    custom: 'कस्टम स्टाइल | LookSim',
    analysis: 'फेस एनालिसिस | LookSim',
    settings: 'सेटिंग्स | LookSim',
    history: 'इतिहास | LookSim',
  },
  ar: {
    home: 'LookSim - محاكي تسريحات الشعر بالذكاء الاصطناعي | تجربة شعر افتراضية مجانية',
    camera: 'التقاط صورة | LookSim',
    result: 'نتيجة المحاكاة | LookSim',
    custom: 'نمط مخصص | LookSim',
    analysis: 'تحليل الوجه | LookSim',
    settings: 'الإعدادات | LookSim',
    history: 'السجل | LookSim',
  },
};

// 언어별 SEO 설명
const PAGE_DESCRIPTIONS: Record<Language, Record<string, string>> = {
  ko: {
    home: 'AI 기술로 50가지 이상의 헤어스타일을 즉시 체험하세요. 무료, 계정 불필요, 완전 프라이버시 보장. 미용실 방문 전 완벽한 스타일 찾기!',
    camera: '사진을 촬영하거나 업로드하여 AI 헤어 시뮬레이션을 시작하세요.',
    result: 'AI가 생성한 새로운 헤어스타일 결과를 확인하세요.',
    custom: '텍스트로 원하는 헤어스타일을 설명하고 AI가 만들어줍니다.',
    analysis: 'AI가 당신의 얼굴형을 분석하고 어울리는 헤어스타일을 추천합니다.',
    settings: 'LookSim 앱 설정을 관리하세요.',
    history: '이전 시뮬레이션 결과를 확인하세요.',
  },
  en: {
    home: 'Try 50+ hairstyles instantly with AI technology. Free, no account needed, complete privacy. Find your perfect look before visiting the salon!',
    camera: 'Take or upload a photo to start your AI hair simulation.',
    result: 'View your AI-generated new hairstyle result.',
    custom: 'Describe any hairstyle in text and let AI create it for you.',
    analysis: 'AI analyzes your face shape and recommends flattering hairstyles.',
    settings: 'Manage your LookSim app settings.',
    history: 'View your previous simulation results.',
  },
  zh: {
    home: '使用AI技术即时体验50多种发型。免费，无需账户，完全隐私保护。在去美发沙龙之前找到完美造型！',
    camera: '拍照或上传照片开始AI发型模拟。',
    result: '查看AI生成的新发型效果。',
    custom: '用文字描述任何发型，让AI为你创建。',
    analysis: 'AI分析你的脸型并推荐适合的发型。',
    settings: '管理LookSim应用设置。',
    history: '查看之前的模拟结果。',
  },
  ja: {
    home: 'AI技術で50以上のヘアスタイルを即体験。無料、アカウント不要、完全プライバシー。サロン訪問前に完璧なスタイルを見つけよう！',
    camera: '写真を撮るかアップロードしてAIヘアシミュレーションを開始。',
    result: 'AI生成の新しいヘアスタイル結果を確認。',
    custom: 'テキストで好きなヘアスタイルを説明し、AIに作成してもらう。',
    analysis: 'AIがあなたの顔の形を分析し、似合うヘアスタイルを推薦。',
    settings: 'LookSimアプリの設定を管理。',
    history: '以前のシミュレーション結果を確認。',
  },
  es: {
    home: '¡Prueba más de 50 peinados al instante con tecnología de IA! Gratis, sin cuenta, privacidad completa. ¡Encuentra tu look perfecto antes de ir al salón!',
    camera: 'Toma o sube una foto para iniciar la simulación de cabello con IA.',
    result: 'Visualiza tu nuevo peinado generado por IA.',
    custom: 'Describe cualquier peinado con texto y deja que la IA lo cree para ti.',
    analysis: 'La IA analiza la forma de tu rostro y recomienda peinados favorecedores.',
    settings: 'Administra la configuración de tu app LookSim.',
    history: 'Visualiza tus resultados de simulación anteriores.',
  },
  pt: {
    home: 'Experimente mais de 50 penteados instantaneamente com tecnologia de IA! Grátis, sem conta, privacidade completa. Encontre seu visual perfeito antes de ir ao salão!',
    camera: 'Tire ou envie uma foto para iniciar a simulação de cabelo com IA.',
    result: 'Visualize seu novo penteado gerado por IA.',
    custom: 'Descreva qualquer penteado com texto e deixe a IA criar para você.',
    analysis: 'A IA analisa o formato do seu rosto e recomenda penteados que combinam.',
    settings: 'Gerencie as configurações do app LookSim.',
    history: 'Visualize seus resultados de simulação anteriores.',
  },
  fr: {
    home: 'Essayez plus de 50 coiffures instantanément avec la technologie IA! Gratuit, sans compte, confidentialité totale. Trouvez votre look parfait avant le salon!',
    camera: 'Prenez ou téléchargez une photo pour démarrer la simulation de coiffure IA.',
    result: 'Visualisez votre nouvelle coiffure générée par IA.',
    custom: 'Décrivez n\'importe quelle coiffure en texte et laissez l\'IA la créer.',
    analysis: 'L\'IA analyse la forme de votre visage et recommande des coiffures flatteuses.',
    settings: 'Gérez les paramètres de l\'application LookSim.',
    history: 'Visualisez vos résultats de simulation précédents.',
  },
  de: {
    home: 'Probieren Sie über 50 Frisuren sofort mit KI-Technologie! Kostenlos, kein Konto nötig, vollständige Privatsphäre. Finden Sie Ihren perfekten Look vor dem Salonbesuch!',
    camera: 'Nehmen Sie ein Foto auf oder laden Sie es hoch, um die KI-Haarsimulation zu starten.',
    result: 'Sehen Sie Ihr von KI generiertes neues Frisurenergebnis.',
    custom: 'Beschreiben Sie jede Frisur im Text und lassen Sie die KI sie erstellen.',
    analysis: 'KI analysiert Ihre Gesichtsform und empfiehlt schmeichelhafte Frisuren.',
    settings: 'Verwalten Sie Ihre LookSim-App-Einstellungen.',
    history: 'Sehen Sie Ihre vorherigen Simulationsergebnisse.',
  },
  th: {
    home: 'ลองทรงผมกว่า 50 แบบทันทีด้วยเทคโนโลยี AI! ฟรี ไม่ต้องลงทะเบียน ความเป็นส่วนตัวเต็มที่ ค้นหาลุคที่ใช่ก่อนไปร้านทำผม!',
    camera: 'ถ่ายหรืออัปโหลดรูปเพื่อเริ่มการจำลองทรงผมด้วย AI',
    result: 'ดูผลทรงผมใหม่ที่สร้างโดย AI',
    custom: 'อธิบายทรงผมใดก็ได้ด้วยข้อความแล้วให้ AI สร้างให้คุณ',
    analysis: 'AI วิเคราะห์รูปหน้าของคุณและแนะนำทรงผมที่เหมาะสม',
    settings: 'จัดการการตั้งค่าแอป LookSim',
    history: 'ดูผลการจำลองก่อนหน้า',
  },
  vi: {
    home: 'Thử hơn 50 kiểu tóc ngay lập tức với công nghệ AI! Miễn phí, không cần tài khoản, bảo mật tuyệt đối. Tìm kiểu tóc hoàn hảo trước khi đến salon!',
    camera: 'Chụp hoặc tải ảnh lên để bắt đầu mô phỏng tóc bằng AI.',
    result: 'Xem kết quả kiểu tóc mới được tạo bởi AI.',
    custom: 'Mô tả bất kỳ kiểu tóc nào bằng văn bản và để AI tạo cho bạn.',
    analysis: 'AI phân tích hình dạng khuôn mặt và đề xuất kiểu tóc phù hợp.',
    settings: 'Quản lý cài đặt ứng dụng LookSim.',
    history: 'Xem kết quả mô phỏng trước đây.',
  },
  id: {
    home: 'Coba lebih dari 50 gaya rambut secara instan dengan teknologi AI! Gratis, tanpa akun, privasi lengkap. Temukan tampilan sempurna sebelum ke salon!',
    camera: 'Ambil atau unggah foto untuk memulai simulasi rambut AI.',
    result: 'Lihat hasil gaya rambut baru yang dihasilkan AI.',
    custom: 'Jelaskan gaya rambut apa pun dengan teks dan biarkan AI membuatnya.',
    analysis: 'AI menganalisis bentuk wajah dan merekomendasikan gaya rambut yang cocok.',
    settings: 'Kelola pengaturan aplikasi LookSim.',
    history: 'Lihat hasil simulasi sebelumnya.',
  },
  hi: {
    home: 'AI तकनीक से 50+ हेयरस्टाइल तुरंत आज़माएं! मुफ्त, कोई अकाउंट नहीं, पूर्ण गोपनीयता। सैलून जाने से पहले अपना परफेक्ट लुक खोजें!',
    camera: 'AI हेयर सिमुलेशन शुरू करने के लिए फोटो लें या अपलोड करें।',
    result: 'AI द्वारा बनाया गया नया हेयरस्टाइल देखें।',
    custom: 'किसी भी हेयरस्टाइल का टेक्स्ट में वर्णन करें और AI को बनाने दें।',
    analysis: 'AI आपके चेहरे के आकार का विश्लेषण करता है और उपयुक्त हेयरस्टाइल सुझाता है।',
    settings: 'LookSim ऐप सेटिंग्स प्रबंधित करें।',
    history: 'पिछले सिमुलेशन परिणाम देखें।',
  },
  ar: {
    home: 'جرب أكثر من 50 تسريحة فوراً بتقنية الذكاء الاصطناعي! مجاني، بدون حساب، خصوصية تامة. اعثر على إطلالتك المثالية قبل زيارة الصالون!',
    camera: 'التقط أو ارفع صورة لبدء محاكاة الشعر بالذكاء الاصطناعي.',
    result: 'شاهد نتيجة تسريحة شعرك الجديدة المُنشأة بالذكاء الاصطناعي.',
    custom: 'صف أي تسريحة بالنص ودع الذكاء الاصطناعي ينشئها لك.',
    analysis: 'يحلل الذكاء الاصطناعي شكل وجهك ويوصي بتسريحات مناسبة.',
    settings: 'إدارة إعدادات تطبيق LookSim.',
    history: 'عرض نتائج المحاكاة السابقة.',
  },
};

// 기본 URL (프로덕션)
const BASE_URL = 'https://looksim.app';

/**
 * 페이지 타이틀 가져오기
 */
export const getPageTitle = (page: string, language: Language): string => {
  return PAGE_TITLES[language]?.[page] || PAGE_TITLES.en[page] || 'LookSim';
};

/**
 * 페이지 설명 가져오기
 */
export const getPageDescription = (page: string, language: Language): string => {
  return PAGE_DESCRIPTIONS[language]?.[page] || PAGE_DESCRIPTIONS.en[page] || '';
};

/**
 * hreflang 태그 생성
 */
export const generateHreflangTags = (currentPath: string): HTMLLinkElement[] => {
  const languages = Object.keys(HREFLANG_MAP) as Language[];
  const elements: HTMLLinkElement[] = [];

  languages.forEach((lang) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = HREFLANG_MAP[lang];
    link.href = `${BASE_URL}/${lang}${currentPath}`;
    elements.push(link);
  });

  // x-default (영어)
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${BASE_URL}/en${currentPath}`;
  elements.push(defaultLink);

  return elements;
};

/**
 * 메타 태그 업데이트
 */
export const updateMetaTags = (options: {
  title: string;
  description: string;
  language: Language;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
}): void => {
  const { title, description, language, url, image, type = 'website' } = options;

  // 타이틀 업데이트
  document.title = title;

  // 메타 태그 업데이트 또는 생성 함수
  const updateMeta = (name: string, content: string, property = false) => {
    const attr = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // 기본 메타 태그
  updateMeta('description', description);
  updateMeta('language', language);

  // Open Graph
  updateMeta('og:title', title, true);
  updateMeta('og:description', description, true);
  updateMeta('og:type', type, true);
  updateMeta('og:locale', HREFLANG_MAP[language], true);
  if (url) updateMeta('og:url', url, true);
  if (image) updateMeta('og:image', image, true);

  // Twitter Card
  updateMeta('twitter:card', 'summary_large_image');
  updateMeta('twitter:title', title);
  updateMeta('twitter:description', description);
  if (image) updateMeta('twitter:image', image);

  // 언어 속성 업데이트
  document.documentElement.lang = language;
};

/**
 * 구조화된 데이터 (Schema.org) 생성
 */
export const generateStructuredData = (options: {
  type: 'WebApplication' | 'SoftwareApplication' | 'WebPage';
  name: string;
  description: string;
  language: Language;
  url?: string;
  image?: string;
  rating?: { value: number; count: number };
}): string => {
  const { type, name, description, url, image, rating } = options;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url: url || BASE_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Android, iOS, Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  if (image) {
    data.image = image;
  }

  if (rating) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      ratingCount: rating.count,
    };
  }

  return JSON.stringify(data);
};

/**
 * 구조화된 데이터 삽입
 */
export const insertStructuredData = (jsonLd: string): void => {
  // 기존 스크립트 제거
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  // 새 스크립트 삽입
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = jsonLd;
  document.head.appendChild(script);
};

/**
 * 페이지 SEO 초기화 (종합)
 */
export const initPageSEO = (options: {
  page: string;
  language: Language;
  path: string;
  image?: string;
}): void => {
  const { page, language, path, image } = options;

  const title = getPageTitle(page, language);
  const description = getPageDescription(page, language);
  const url = `${BASE_URL}/${language}${path}`;

  // 메타 태그 업데이트
  updateMetaTags({
    title,
    description,
    language,
    url,
    image: image || `${BASE_URL}/og-image.png`,
  });

  // hreflang 태그 추가 (기존 제거 후)
  document.querySelectorAll('link[hreflang]').forEach((el) => el.remove());
  const hreflangTags = generateHreflangTags(path);
  hreflangTags.forEach((tag) => document.head.appendChild(tag));

  // 구조화된 데이터
  if (page === 'home') {
    const structuredData = generateStructuredData({
      type: 'WebApplication',
      name: 'LookSim - AI Hair Simulator',
      description: 'Try different hairstyles instantly with AI technology.',
      language,
      url,
      image: image || `${BASE_URL}/og-image.png`,
      rating: { value: 4.8, count: 1250 },
    });
    insertStructuredData(structuredData);
  }
};

/**
 * 언어별 Canonical URL 가져오기
 */
export const getCanonicalUrl = (path: string, language: Language): string => {
  return `${BASE_URL}/${language}${path}`;
};

/**
 * sitemap.xml용 언어별 URL 목록 생성
 */
export const generateSitemapUrls = (paths: string[]): string[] => {
  const languages = Object.keys(HREFLANG_MAP) as Language[];
  const urls: string[] = [];

  paths.forEach((path) => {
    languages.forEach((lang) => {
      urls.push(`${BASE_URL}/${lang}${path}`);
    });
  });

  return urls;
};

export default {
  getPageTitle,
  getPageDescription,
  generateHreflangTags,
  updateMetaTags,
  generateStructuredData,
  insertStructuredData,
  initPageSEO,
  getCanonicalUrl,
  generateSitemapUrls,
};
