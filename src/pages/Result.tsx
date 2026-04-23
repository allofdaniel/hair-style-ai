/**
 * Result Page - Stitch Premium Design
 * Before/After 비교, 앞머리/뒷머리 전환
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { generateBackView } from '../services/openai';
import { hairStyles } from '../data/hairStyles';
import { resilientFetch } from '../services/networkResilience';
import { logger } from '../services/logger';
import ShareSheet from '../components/ShareSheet';
import RatingPrompt, { shouldShowRatingPrompt, incrementSimulationCount } from '../components/RatingPrompt';
import HairRefinementPanel from '../components/HairRefinementPanel';
import { useI18n, type Language } from '../i18n/useI18n';
import Toast from '../components/Toast';

const RESULT_TEXTS: Record<Language, Record<string, string>> = {
  ko: { result: '시뮬레이션 결과', single: '단일 결과', compare: '비교하기', slider: '슬라이더', before: 'Before', after: 'After', frontView: '앞머리', backView: '뒷머리 (AI 생성)', generating: '생성 중...', refine: '미세 조정', save: '이미지 저장', tryAnother: '다른 스타일 시도하기', saved: '저장 완료!', backViewFailed: '뒷머리 생성에 실패했습니다.', errorOccurred: '오류가 발생했습니다.' },
  en: { result: 'Simulation Result', single: 'Single', compare: 'Compare', slider: 'Slider', before: 'Before', after: 'After', frontView: 'Front', backView: 'Back (AI Generated)', generating: 'Generating...', refine: 'Fine Tune', save: 'Save Image', tryAnother: 'Try Another Style', saved: 'Saved!', backViewFailed: 'Back view generation failed.', errorOccurred: 'An error occurred.' },
  zh: { result: '模拟结果', single: '单一结果', compare: '对比', slider: '滑块', before: '之前', after: '之后', frontView: '正面', backView: '背面 (AI生成)', generating: '生成中...', refine: '微调', save: '保存图片', tryAnother: '尝试其他风格', saved: '已保存!', backViewFailed: '背面生成失败。', errorOccurred: '发生错误。' },
  ja: { result: 'シミュレーション結果', single: '単一結果', compare: '比較', slider: 'スライダー', before: 'Before', after: 'After', frontView: '前髪', backView: '後ろ髪 (AI生成)', generating: '生成中...', refine: '微調整', save: '画像を保存', tryAnother: '他のスタイルを試す', saved: '保存完了!', backViewFailed: '後ろ髪の生成に失敗しました。', errorOccurred: 'エラーが発生しました。' },
  es: { result: 'Resultado de Simulación', single: 'Individual', compare: 'Comparar', slider: 'Control', before: 'Antes', after: 'Después', frontView: 'Frente', backView: 'Atrás (IA)', generating: 'Generando...', refine: 'Ajuste Fino', save: 'Guardar Imagen', tryAnother: 'Probar Otro Estilo', saved: '¡Guardado!', backViewFailed: 'Falló la generación de vista trasera.', errorOccurred: 'Ocurrió un error.' },
  pt: { result: 'Resultado da Simulação', single: 'Individual', compare: 'Comparar', slider: 'Controle', before: 'Antes', after: 'Depois', frontView: 'Frente', backView: 'Atrás (IA)', generating: 'Gerando...', refine: 'Ajuste Fino', save: 'Salvar Imagem', tryAnother: 'Tentar Outro Estilo', saved: 'Salvo!', backViewFailed: 'Falha ao gerar vista traseira.', errorOccurred: 'Ocorreu um erro.' },
  fr: { result: 'Résultat de Simulation', single: 'Simple', compare: 'Comparer', slider: 'Curseur', before: 'Avant', after: 'Après', frontView: 'Face', backView: 'Dos (IA)', generating: 'Génération...', refine: 'Affiner', save: 'Sauvegarder', tryAnother: 'Essayer un Autre Style', saved: 'Sauvegardé!', backViewFailed: 'Échec de la génération de la vue arrière.', errorOccurred: 'Une erreur est survenue.' },
  de: { result: 'Simulationsergebnis', single: 'Einzeln', compare: 'Vergleichen', slider: 'Regler', before: 'Vorher', after: 'Nachher', frontView: 'Vorne', backView: 'Hinten (KI)', generating: 'Wird erstellt...', refine: 'Feinabstimmung', save: 'Bild Speichern', tryAnother: 'Anderen Stil Probieren', saved: 'Gespeichert!', backViewFailed: 'Rückansicht-Generierung fehlgeschlagen.', errorOccurred: 'Ein Fehler ist aufgetreten.' },
  th: { result: 'ผลการจำลอง', single: 'เดี่ยว', compare: 'เปรียบเทียบ', slider: 'ตัวเลื่อน', before: 'ก่อน', after: 'หลัง', frontView: 'ด้านหน้า', backView: 'ด้านหลัง (AI)', generating: 'กำลังสร้าง...', refine: 'ปรับแต่ง', save: 'บันทึกรูป', tryAnother: 'ลองสไตล์อื่น', saved: 'บันทึกแล้ว!', backViewFailed: 'สร้างมุมหลังไม่สำเร็จ', errorOccurred: 'เกิดข้อผิดพลาด' },
  vi: { result: 'Kết quả Mô phỏng', single: 'Đơn lẻ', compare: 'So sánh', slider: 'Thanh trượt', before: 'Trước', after: 'Sau', frontView: 'Phía trước', backView: 'Phía sau (AI)', generating: 'Đang tạo...', refine: 'Tinh chỉnh', save: 'Lưu ảnh', tryAnother: 'Thử Kiểu Khác', saved: 'Đã lưu!', backViewFailed: 'Tạo mặt sau thất bại.', errorOccurred: 'Đã xảy ra lỗi.' },
  id: { result: 'Hasil Simulasi', single: 'Tunggal', compare: 'Bandingkan', slider: 'Penggeser', before: 'Sebelum', after: 'Sesudah', frontView: 'Depan', backView: 'Belakang (AI)', generating: 'Membuat...', refine: 'Sesuaikan', save: 'Simpan Gambar', tryAnother: 'Coba Gaya Lain', saved: 'Tersimpan!', backViewFailed: 'Gagal membuat tampak belakang.', errorOccurred: 'Terjadi kesalahan.' },
  hi: { result: 'सिमुलेशन परिणाम', single: 'एकल', compare: 'तुलना', slider: 'स्लाइडर', before: 'पहले', after: 'बाद में', frontView: 'सामने', backView: 'पीछे (AI)', generating: 'बना रहा है...', refine: 'फाइन ट्यून', save: 'छवि सहेजें', tryAnother: 'अन्य स्टाइल आज़माएं', saved: 'सहेजा गया!', backViewFailed: 'पीछे का दृश्य बनाने में विफल।', errorOccurred: 'एक त्रुटि हुई।' },
  ar: { result: 'نتيجة المحاكاة', single: 'مفرد', compare: 'مقارنة', slider: 'المنزلق', before: 'قبل', after: 'بعد', frontView: 'أمامي', backView: 'خلفي (AI)', generating: 'جاري الإنشاء...', refine: 'ضبط دقيق', save: 'حفظ الصورة', tryAnother: 'جرب ستايل آخر', saved: 'تم الحفظ!', backViewFailed: 'فشل إنشاء المنظر الخلفي.', errorOccurred: 'حدث خطأ.' },
};

interface MultiResult {
  styleId: string;
  styleName: string;
  resultImage: string;
  backImage?: string;
  backViewImage?: string;
}

export default function Result() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const texts = RESULT_TEXTS[language] || RESULT_TEXTS.en;
  const { userPhoto, resultImage, reset, hairSettings } = useAppStore();
  const [currentIndex] = useState(0);
  const [results, setResults] = useState<MultiResult[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'slider'>('compare');
  const [hairView, setHairView] = useState<'front' | 'back'>('front');
  const [isGeneratingBack, setIsGeneratingBack] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    incrementSimulationCount();
    const timer = setTimeout(() => {
      if (shouldShowRatingPrompt()) setShowRatingPrompt(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem('multiResults');
      if (savedResults) {
        const parsed = JSON.parse(savedResults) as MultiResult[];
        setResults(parsed);
        localStorage.removeItem('multiResults');
      } else if (resultImage) {
        setResults([{ styleId: 'single', styleName: '스타일', resultImage }]);
      }
    } catch {
      if (resultImage) setResults([{ styleId: 'single', styleName: '스타일', resultImage }]);
    }
  }, [resultImage]);

  const currentResult = results[currentIndex];
  const backViewImg = currentResult?.backViewImage || currentResult?.backImage;
  const displayImage = hairView === 'back' && backViewImg ? backViewImg : currentResult?.resultImage;

  const handleGenerateBack = async () => {
    if (!currentResult || isGeneratingBack) return;
    if (currentResult.backViewImage || currentResult.backImage) {
      setHairView('back');
      return;
    }

    setIsGeneratingBack(true);
    try {
      const style = hairStyles.find(s => s.id === currentResult.styleId);
      if (!style) { setIsGeneratingBack(false); return; }

      const result = await generateBackView({
        userPhoto: userPhoto || '',
        frontResultImage: currentResult.resultImage,
        style,
        settings: hairSettings,
      });

      if (result.success && result.resultImage) {
        setResults(prev => prev.map((r, idx) =>
          idx === currentIndex ? { ...r, backImage: result.resultImage } : r
        ));
        setHairView('back');
      } else {
        setErrorMessage(texts.backViewFailed);
        setShowErrorToast(true);
      }
    } catch {
      setErrorMessage(texts.errorOccurred);
      setShowErrorToast(true);
    } finally {
      setIsGeneratingBack(false);
    }
  };

  const handleStartOver = () => { reset(); navigate('/'); };

  const handleSave = async () => {
    if (!displayImage) return;
    try {
      const fileName = `hairstyle-${currentResult?.styleName || 'result'}-${Date.now()}.png`;

      // data URL을 직접 blob으로 변환 (fetch 없이)
      let blob: Blob;
      if (displayImage.startsWith('data:')) {
        const [header, base64Data] = displayImage.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mimeType });
      } else {
        // URL인 경우 fetch 사용
        const response = await resilientFetch(displayImage);
        blob = await response.blob();
      }

      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      // Try navigator.share with file (works in Capacitor/Android WebView)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: blob URL download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      // User cancelled share sheet - not an error
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error('Save error:', error);
      setErrorMessage('이미지 저장에 실패했습니다.');
      setShowErrorToast(true);
    }
  };

  const handleSliderTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  if (!displayImage || !userPhoto) {
    if (results.length === 0 && !resultImage) { navigate('/'); return null; }
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden">
      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-5 py-2.5 bg-green-500 rounded-full text-white text-sm font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            {texts.saved}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none px-4 py-2 flex items-center justify-between relative">
        <button onClick={handleStartOver} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#007AFF]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-center flex-1 tracking-tight">{texts.result}</h1>
        <button onClick={() => setShowShareSheet(true)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#007AFF] opacity-0 pointer-events-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex-none flex items-center text-[15px] font-medium border-b border-gray-200 dark:border-gray-800">
        {(['single', 'compare', 'slider'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-3 transition-colors ${
              viewMode === mode
                ? 'border-b-[2px] border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            {mode === 'single' ? texts.single : mode === 'compare' ? texts.compare : texts.slider}
          </button>
        ))}
      </div>

      {/* Front/Back Toggle */}
      <div className="flex-none px-4 py-3 bg-white dark:bg-black">
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setHairView('front')}
            className={`flex-1 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              hairView === 'front'
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M3 21c0-4.4 3.6-8 8-8h2c4.4 0 8 3.6 8 8"/>
            </svg>
            {texts.frontView}
          </button>
          <button
            onClick={handleGenerateBack}
            disabled={isGeneratingBack}
            className={`flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              hairView === 'back'
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            } ${isGeneratingBack ? 'opacity-50' : ''}`}
          >
            {isGeneratingBack ? (
              <>
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                {texts.generating}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21c0-4.4-3.6-8-8-8s-8 3.6-8 8"/>
                </svg>
                {texts.backView}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative w-full overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col">
        {viewMode === 'single' && (
          <div className="flex-1 w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
              <img src={displayImage} alt="Result" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="relative flex-1 w-full h-full flex items-stretch">
            {/* Before Label */}
            <div className="absolute top-0 left-0 w-1/2 h-8 z-20 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <span className="text-xs font-semibold text-gray-500">{texts.before}</span>
            </div>
            {/* After Label */}
            <div className="absolute top-0 right-0 w-1/2 h-8 z-20 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/50 backdrop-blur-sm">
              <span className="text-xs font-semibold text-[#007AFF]">{texts.after}</span>
            </div>
            {/* Before Image */}
            <div className="w-1/2 h-full relative overflow-hidden bg-gray-200 dark:bg-gray-800 border-r border-white/20">
              <img src={userPhoto} alt="Before" className="w-full h-full object-cover" />
            </div>
            {/* After Image */}
            <div className="w-1/2 h-full relative overflow-hidden bg-gray-300 dark:bg-gray-700">
              <img src={displayImage} alt="After" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {viewMode === 'slider' && (
          <div
            ref={sliderRef}
            className="flex-1 w-full h-full relative cursor-ew-resize touch-none"
            onMouseDown={(e) => {
              handleSliderTouch(e);
              const handleMove = (ev: MouseEvent) => handleSliderTouch(ev as unknown as React.MouseEvent);
              const handleUp = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
              };
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
            onTouchStart={handleSliderTouch}
            onTouchMove={handleSliderTouch}
          >
            <img src={userPhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img src={displayImage} alt="After" className="w-full h-full object-cover" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
                  <path d="M18 8l4 4-4 4M6 8l-4 4 4 4"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white font-medium">
              {texts.before}
            </div>
            <div className="absolute bottom-3 right-3 bg-[#007AFF] px-3 py-1.5 rounded-full text-xs text-white font-medium">
              {texts.after}
            </div>
          </div>
        )}

        {/* Style Name */}
        {currentResult && (
          <div className="flex-none bg-[#F9FAFB] dark:bg-[#1E1E1E] py-3 border-t border-gray-200 dark:border-gray-800 text-center">
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{currentResult.styleName}</span>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="flex-none bg-white dark:bg-[#121212] px-5 pt-4 pb-8 flex flex-col gap-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setShowRefinementPanel(true)}
          className="w-full h-[54px] rounded-2xl bg-[#007AFF] text-white font-bold text-[16px] shadow-lg shadow-[#007AFF]/25 hover:bg-[#0062cc] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v18M3 12h18"/>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
          </svg>
          {texts.refine}
        </button>
        <button
          onClick={handleSave}
          className="w-full h-[54px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          {texts.save}
        </button>
        <button
          onClick={handleStartOver}
          className="w-full h-[48px] mt-1 rounded-2xl text-gray-500 dark:text-gray-400 font-medium text-[14px] hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center underline decoration-gray-300 underline-offset-4"
        >
          {texts.tryAnother}
        </button>
      </footer>

      {/* Share Sheet */}
      {showShareSheet && displayImage && (
        <ShareSheet
          imageUrl={displayImage}
          styleName={currentResult?.styleName || 'Hairstyle'}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* Rating Prompt */}
      {showRatingPrompt && <RatingPrompt onClose={() => setShowRatingPrompt(false)} />}

      {/* Refinement Panel */}
      {showRefinementPanel && currentResult && displayImage && userPhoto && (
        <HairRefinementPanel
          resultImage={displayImage}
          userPhoto={userPhoto}
          styleName={currentResult.styleName}
          onRefinementComplete={(newImage) => {
            setResults(prev => prev.map((r, idx) => idx === currentIndex ? { ...r, resultImage: newImage } : r));
            setShowRefinementPanel(false);
          }}
          onClose={() => setShowRefinementPanel(false)}
          language={language === 'ko' ? 'ko' : 'en'}
        />
      )}

      {/* Error Toast */}
      <Toast message={errorMessage} type="error" visible={showErrorToast} onClose={() => setShowErrorToast(false)} />
    </div>
  );
}
