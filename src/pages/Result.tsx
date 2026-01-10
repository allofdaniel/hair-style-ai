/**
 * Result Page - Apple Human Interface Guidelines
 * - 44pt 최소 터치 타겟
 * - 시스템 색상 사용
 * - 라이트/다크 모드 지원
 * - 깔끔하고 미니멀한 디자인
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { generateBackView } from '../services/openai';
import { hairStyles } from '../data/hairStyles';
import ShareSheet from '../components/ShareSheet';
import RatingPrompt, { shouldShowRatingPrompt, incrementSimulationCount } from '../components/RatingPrompt';
import HairRefinementPanel from '../components/HairRefinementPanel';
import { useI18n, type Language } from '../i18n/useI18n';

// 결과 페이지 다국어 텍스트
const RESULT_TEXTS: Record<Language, Record<string, string>> = {
  ko: { result: '결과', before: 'Before', after: 'After', frontView: '앞머리', backView: '뒷머리', generating: '생성 중...', generate: '(생성)', save: '저장', saveAll: '전체', tryAnother: '다른 스타일 시도하기', saved: '저장 완료!', compare: '비교', slider: '슬라이더', backViewLabel: '뒷모습', refine: '미세 조정' },
  en: { result: 'Result', before: 'Before', after: 'After', frontView: 'Front', backView: 'Back', generating: 'Generating...', generate: '(Generate)', save: 'Save', saveAll: 'All', tryAnother: 'Try Another Style', saved: 'Saved!', compare: 'Compare', slider: 'Slider', backViewLabel: 'Back View', refine: 'Fine Tune' },
  zh: { result: '结果', before: '之前', after: '之后', frontView: '正面', backView: '背面', generating: '生成中...', generate: '(生成)', save: '保存', saveAll: '全部', tryAnother: '尝试其他风格', saved: '已保存!', compare: '对比', slider: '滑块', backViewLabel: '背面' },
  ja: { result: '結果', before: 'Before', after: 'After', frontView: '前', backView: '後ろ', generating: '生成中...', generate: '(生成)', save: '保存', saveAll: '全て', tryAnother: '他のスタイルを試す', saved: '保存完了!', compare: '比較', slider: 'スライダー', backViewLabel: '後ろ姿' },
  es: { result: 'Resultado', before: 'Antes', after: 'Después', frontView: 'Frente', backView: 'Atrás', generating: 'Generando...', generate: '(Generar)', save: 'Guardar', saveAll: 'Todo', tryAnother: 'Probar Otro Estilo', saved: '¡Guardado!', compare: 'Comparar', slider: 'Control', backViewLabel: 'Vista Posterior' },
  pt: { result: 'Resultado', before: 'Antes', after: 'Depois', frontView: 'Frente', backView: 'Atrás', generating: 'Gerando...', generate: '(Gerar)', save: 'Salvar', saveAll: 'Tudo', tryAnother: 'Tentar Outro Estilo', saved: 'Salvo!', compare: 'Comparar', slider: 'Controle', backViewLabel: 'Vista Traseira' },
  fr: { result: 'Résultat', before: 'Avant', after: 'Après', frontView: 'Face', backView: 'Dos', generating: 'Génération...', generate: '(Générer)', save: 'Sauvegarder', saveAll: 'Tout', tryAnother: 'Essayer un Autre Style', saved: 'Sauvegardé!', compare: 'Comparer', slider: 'Curseur', backViewLabel: 'Vue Arrière' },
  de: { result: 'Ergebnis', before: 'Vorher', after: 'Nachher', frontView: 'Vorne', backView: 'Hinten', generating: 'Wird erstellt...', generate: '(Erstellen)', save: 'Speichern', saveAll: 'Alle', tryAnother: 'Anderen Stil Probieren', saved: 'Gespeichert!', compare: 'Vergleich', slider: 'Regler', backViewLabel: 'Rückansicht' },
  th: { result: 'ผลลัพธ์', before: 'ก่อน', after: 'หลัง', frontView: 'ด้านหน้า', backView: 'ด้านหลัง', generating: 'กำลังสร้าง...', generate: '(สร้าง)', save: 'บันทึก', saveAll: 'ทั้งหมด', tryAnother: 'ลองสไตล์อื่น', saved: 'บันทึกแล้ว!', compare: 'เปรียบเทียบ', slider: 'ตัวเลื่อน', backViewLabel: 'มุมหลัง' },
  vi: { result: 'Kết quả', before: 'Trước', after: 'Sau', frontView: 'Phía trước', backView: 'Phía sau', generating: 'Đang tạo...', generate: '(Tạo)', save: 'Lưu', saveAll: 'Tất cả', tryAnother: 'Thử Kiểu Khác', saved: 'Đã lưu!', compare: 'So sánh', slider: 'Thanh trượt', backViewLabel: 'Mặt sau' },
  id: { result: 'Hasil', before: 'Sebelum', after: 'Sesudah', frontView: 'Depan', backView: 'Belakang', generating: 'Membuat...', generate: '(Buat)', save: 'Simpan', saveAll: 'Semua', tryAnother: 'Coba Gaya Lain', saved: 'Tersimpan!', compare: 'Bandingkan', slider: 'Penggeser', backViewLabel: 'Tampak Belakang' },
  hi: { result: 'परिणाम', before: 'पहले', after: 'बाद में', frontView: 'सामने', backView: 'पीछे', generating: 'बना रहा है...', generate: '(बनाएं)', save: 'सहेजें', saveAll: 'सभी', tryAnother: 'अन्य स्टाइल आज़माएं', saved: 'सहेजा गया!', compare: 'तुलना', slider: 'स्लाइडर', backViewLabel: 'पीछे का दृश्य' },
  ar: { result: 'النتيجة', before: 'قبل', after: 'بعد', frontView: 'أمامي', backView: 'خلفي', generating: 'جاري الإنشاء...', generate: '(إنشاء)', save: 'حفظ', saveAll: 'الكل', tryAnother: 'جرب ستايل آخر', saved: 'تم الحفظ!', compare: 'مقارنة', slider: 'المنزلق', backViewLabel: 'منظر خلفي' },
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<MultiResult[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'result' | 'compare' | 'slider'>('result');
  const [hairView, setHairView] = useState<'front' | 'back'>('front');
  const [isGeneratingBack, setIsGeneratingBack] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    incrementSimulationCount();
    const timer = setTimeout(() => {
      if (shouldShowRatingPrompt()) {
        setShowRatingPrompt(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedResults = localStorage.getItem('multiResults');
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults) as MultiResult[];
        setResults(parsed);
        localStorage.removeItem('multiResults');
      } catch {
        if (resultImage) {
          setResults([{ styleId: 'single', styleName: '스타일', resultImage }]);
        }
      }
    } else if (resultImage) {
      setResults([{ styleId: 'single', styleName: '스타일', resultImage }]);
    }
  }, [resultImage]);

  const currentResult = results[currentIndex];
  const backViewImg = currentResult?.backViewImage || currentResult?.backImage;
  const displayImage = hairView === 'back' && backViewImg
    ? backViewImg
    : currentResult?.resultImage;

  const handleGenerateBack = async () => {
    if (!currentResult || isGeneratingBack) return;

    if (currentResult.backViewImage || currentResult.backImage) {
      setHairView('back');
      return;
    }

    setIsGeneratingBack(true);

    try {
      const style = hairStyles.find(s => s.id === currentResult.styleId);
      if (!style) {
        console.error('Style not found:', currentResult.styleId);
        setIsGeneratingBack(false);
        return;
      }

      const result = await generateBackView({
        userPhoto: userPhoto || '',
        frontResultImage: currentResult.resultImage,
        style,
        settings: hairSettings,
      });

      if (result.success && result.resultImage) {
        setResults(prev => prev.map((r, idx) =>
          idx === currentIndex
            ? { ...r, backImage: result.resultImage }
            : r
        ));
        setHairView('back');
      } else {
        console.error('Back view generation failed:', result.error);
        alert('뒷머리 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error generating back view:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsGeneratingBack(false);
    }
  };

  const handleStartOver = () => {
    reset();
    navigate('/');
  };

  const handleSave = async () => {
    if (!displayImage) return;
    try {
      const link = document.createElement('a');
      link.href = displayImage;
      link.download = `hairstyle-${currentResult?.styleName || 'result'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleSaveAll = async () => {
    for (const result of results) {
      const link = document.createElement('a');
      link.href = result.resultImage;
      link.download = `hairstyle-${result.styleName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(r => setTimeout(r, 500));
    }
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleShare = () => {
    if (!displayImage) return;
    setShowShareSheet(true);
  };

  const handleRefinementComplete = (newImage: string) => {
    setResults(prev => prev.map((r, idx) =>
      idx === currentIndex
        ? { ...r, resultImage: newImage }
        : r
    ));
    setShowRefinementPanel(false);
  };

  const handleSliderTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  if (!displayImage || !userPhoto) {
    if (results.length === 0 && !resultImage) {
      navigate('/');
      return null;
    }
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[var(--color-blue)]/30 border-t-[var(--color-blue)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col safe-area-top safe-area-bottom">
      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-5 py-2.5 bg-[var(--color-green)] rounded-full text-white text-subheadline font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            {texts.saved}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative flex items-center justify-between h-11 px-4 bg-[var(--color-bg-primary)] border-b border-[var(--color-separator)]">
        <button
          onClick={handleStartOver}
          className="w-11 h-11 flex items-center justify-center -ml-2 active:opacity-60 transition-opacity"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-headline text-[var(--color-label)]">
          {results.length > 1 ? `${currentIndex + 1} / ${results.length}` : texts.result}
        </h1>
        <button
          onClick={handleShare}
          className="w-11 h-11 flex items-center justify-center -mr-2 active:opacity-60 transition-opacity text-[var(--color-blue)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
        </button>
      </header>

      {/* 멀티 결과 썸네일 */}
      {results.length > 1 && (
        <div className="px-4 py-3 bg-[var(--color-bg-secondary)]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {results.map((result, idx) => (
              <button
                key={result.styleId}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 relative transition-all ${
                  idx === currentIndex ? 'scale-105' : 'opacity-60'
                }`}
              >
                <img
                  src={result.resultImage}
                  alt={result.styleName}
                  className={`w-14 h-[72px] object-cover rounded-lg ${
                    idx === currentIndex ? 'ring-2 ring-[var(--color-blue)]' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 rounded-b-lg truncate px-1">
                  {result.styleName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Segmented Control */}
      <div className="px-4 py-3">
        <div className="flex bg-[var(--color-fill-tertiary)] rounded-[9px] p-[2px]">
          {[
            { id: 'result', label: texts.result },
            { id: 'compare', label: texts.compare },
            { id: 'slider', label: texts.slider }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as typeof viewMode)}
              className={`flex-1 py-2 rounded-[7px] text-subheadline font-medium transition-all ${
                viewMode === mode.id
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-label)] shadow-sm'
                  : 'text-[var(--color-label-secondary)]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Front/Back Toggle */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setHairView('front')}
            className={`flex-1 h-11 rounded-xl text-subheadline font-medium transition-all flex items-center justify-center gap-2 ${
              hairView === 'front'
                ? 'bg-[var(--color-blue)] text-white'
                : 'bg-[var(--color-fill-tertiary)] text-[var(--color-label)]'
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
            className={`flex-1 h-11 rounded-xl text-subheadline font-medium transition-all flex items-center justify-center gap-2 ${
              hairView === 'back'
                ? 'bg-[var(--color-blue)] text-white'
                : 'bg-[var(--color-fill-tertiary)] text-[var(--color-label)]'
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
                  <path d="M12 3v2"/>
                </svg>
                {texts.backView} {(currentResult?.backViewImage || currentResult?.backImage) ? '' : texts.generate}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-4 overflow-hidden">
        {viewMode === 'result' && (
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)]">
            <img src={displayImage} alt="Result" className="w-full h-full object-cover" />
            {hairView === 'back' && (
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-caption1 text-white">
                {texts.backViewLabel}
              </div>
            )}
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1">
              <div className="bg-[var(--color-fill-tertiary)] rounded-t-xl px-3 py-1.5">
                <p className="text-caption1 text-[var(--color-label-secondary)] text-center">{texts.before}</p>
              </div>
              <div className="aspect-[3/4] rounded-b-xl overflow-hidden bg-[var(--color-bg-secondary)]">
                <img src={userPhoto} alt="Before" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-[var(--color-blue)] rounded-t-xl px-3 py-1.5">
                <p className="text-caption1 text-white text-center">{texts.after}</p>
              </div>
              <div className="aspect-[3/4] rounded-b-xl overflow-hidden bg-[var(--color-bg-secondary)] ring-2 ring-[var(--color-blue)]">
                <img src={displayImage} alt="After" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'slider' && (
          <div
            ref={sliderRef}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] cursor-ew-resize touch-none"
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-label)" strokeWidth="2.5">
                  <path d="M18 8l4 4-4 4M6 8l-4 4 4 4"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-caption1 text-white">
              {texts.before}
            </div>
            <div className="absolute bottom-3 right-3 bg-[var(--color-blue)] px-3 py-1.5 rounded-full text-caption1 text-white">
              {texts.after}
            </div>
          </div>
        )}
      </main>

      {/* Style Name */}
      {currentResult && (
        <div className="px-4 pb-3">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center">
            <p className="text-[var(--color-label)] font-semibold text-body">{currentResult.styleName}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-3 safe-area-bottom">
        {/* 미세 조정 버튼 */}
        <button
          onClick={() => setShowRefinementPanel(true)}
          className="w-full h-[50px] rounded-xl bg-[var(--color-blue)] text-white font-semibold text-body flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v18M3 12h18"/>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
          </svg>
          {texts.refine}
        </button>

        {/* 저장 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 h-[50px] rounded-xl bg-[var(--color-fill-tertiary)] text-[var(--color-label)] font-medium text-body flex items-center justify-center gap-2 active:bg-[var(--color-fill-secondary)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            {texts.save}
          </button>
          {results.length > 1 && (
            <button
              onClick={handleSaveAll}
              className="flex-1 h-[50px] rounded-xl bg-[var(--color-fill-tertiary)] text-[var(--color-label)] font-medium text-body flex items-center justify-center gap-2 active:bg-[var(--color-fill-secondary)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              {texts.saveAll}
            </button>
          )}
        </div>

        {/* 다시 시도 버튼 */}
        <button
          onClick={handleStartOver}
          className="w-full h-[50px] rounded-xl bg-[var(--color-label)] text-[var(--color-bg-primary)] font-semibold text-body active:opacity-80 transition-opacity"
        >
          {texts.tryAnother}
        </button>
      </div>

      {/* Share Sheet */}
      {showShareSheet && displayImage && (
        <ShareSheet
          imageUrl={displayImage}
          styleName={currentResult?.styleName || 'Hairstyle'}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* Rating Prompt */}
      {showRatingPrompt && (
        <RatingPrompt onClose={() => setShowRatingPrompt(false)} />
      )}

      {/* Refinement Panel */}
      {showRefinementPanel && currentResult && displayImage && userPhoto && (
        <HairRefinementPanel
          resultImage={displayImage}
          userPhoto={userPhoto}
          styleName={currentResult.styleName}
          onRefinementComplete={handleRefinementComplete}
          onClose={() => setShowRefinementPanel(false)}
          language={language === 'ko' ? 'ko' : 'en'}
        />
      )}
    </div>
  );
}
