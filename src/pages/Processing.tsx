import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { generateHairStyleWithInpainting, generateFromReferenceWithInpainting } from '../services/stabilityAI';

const processingSteps = [
  { id: 1, text: 'Uploading photo...', textKo: '사진 업로드 중...', progress: 10 },
  { id: 2, text: 'Creating hair mask...', textKo: '헤어 마스크 생성 중...', progress: 30 },
  { id: 3, text: 'Applying new hairstyle...', textKo: '새 헤어스타일 적용 중...', progress: 70 },
  { id: 4, text: 'Finishing touches...', textKo: '마무리 중...', progress: 90 },
];

export default function Processing() {
  const navigate = useNavigate();
  const {
    userPhoto, selectedStyle, hairSettings, hairTexture,
    setResultImage, setIsProcessing, useCredit, addToHistory,
    useReferenceMode, referencePhoto, referenceAnalysis
  } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if we have valid input (either preset style or reference mode)
    const hasValidInput = userPhoto && (selectedStyle || (useReferenceMode && referencePhoto));
    if (!hasValidInput) {
      navigate('/');
      return;
    }

    let isCancelled = false;

    const processImage = async () => {
      setIsProcessing(true);

      // Start with step 0
      setCurrentStep(0);
      setProgress(10);

      try {
        let result;

        // Update to step 1 - analyzing
        setCurrentStep(1);
        setProgress(30);

        // Small delay to show the step change
        await new Promise(r => setTimeout(r, 300));

        // Update to step 2 - generating
        setCurrentStep(2);
        setProgress(50);

        if (useReferenceMode && referencePhoto) {
          // Use reference photo mode with inpainting
          result = await generateFromReferenceWithInpainting({
            userPhoto,
            referencePhoto,
            settings: hairSettings,
          });
        } else if (selectedStyle) {
          // Use preset style mode with inpainting
          result = await generateHairStyleWithInpainting({
            userPhoto,
            style: selectedStyle,
            settings: hairSettings,
            texture: hairTexture || undefined,
          });
        } else {
          throw new Error('No style or reference selected');
        }

        if (isCancelled) return;

        // Update to step 3 - almost done
        setCurrentStep(3);
        setProgress(90);

        if (result.success && result.resultImage) {
          // Complete!
          setProgress(100);
          const creditUsed = useCredit();
          if (!creditUsed) {
            navigate('/style-select');
            return;
          }

          setResultImage(result.resultImage);

          // Create a style object for history (use reference analysis or selected style)
          const styleForHistory = selectedStyle || {
            id: 'custom-reference',
            name: referenceAnalysis?.styleName || 'Custom Style',
            nameKo: referenceAnalysis?.styleNameKo || 'Custom Style',
            category: 'custom',
            gender: 'male' as const,
            description: referenceAnalysis?.description || 'Custom reference style',
            prompt: '',
          };

          addToHistory({ original: userPhoto, result: result.resultImage, style: styleForHistory });
          navigate('/result');
        } else {
          console.error('Generation failed:', result.error);
          // Show detailed error for debugging
          const errorDetail = result.error || 'Unknown error';
          alert(`Generation failed:\n\n${errorDetail}\n\nTry:\n• Different photo (clear face, good lighting)\n• Different hairstyle\n• Smaller image size`);
          navigate('/style-select');
        }
      } catch (error) {
        console.error('Processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        // Show detailed error for debugging
        alert(`Error:\n\n${errorMessage}\n\nPlease try again or use a different photo.`);
        navigate('/style-select');
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
    return () => { isCancelled = true; };
  }, []);

  const styleName = useReferenceMode ? referenceAnalysis?.styleNameKo : selectedStyle?.nameKo;
  const styleNameEn = useReferenceMode ? referenceAnalysis?.styleName : selectedStyle?.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Progress ring */}
        <div className="relative w-52 h-52 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="104" cy="104" r="92" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
            <circle
              cx="104" cy="104" r="92"
              stroke="url(#progressGradient)" strokeWidth="12" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 92}
              strokeDashoffset={2 * Math.PI * 92 * (1 - progress / 100)}
              className="transition-all duration-300 ease-out"
              style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white animate-pulse">
                  <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Creating Your Look</h2>
          <p className="text-white/60">{processingSteps[currentStep]?.text || 'Processing...'}</p>
          <p className="text-white/40 text-sm mt-1">{processingSteps[currentStep]?.textKo || ''}</p>
        </div>

        {/* Step indicators */}
        <div className="w-full mb-8">
          <div className="flex justify-between mb-3 px-2">
            {processingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                    : index === currentStep
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-110'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}
              >
                {index < currentStep ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Style card */}
        {(selectedStyle || (useReferenceMode && referenceAnalysis)) && (
          <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0">
                {useReferenceMode ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 mb-0.5">
                  {useReferenceMode ? 'Applying reference style' : 'Applying style'}
                </p>
                <p className="text-white font-semibold truncate">{styleName}</p>
                <p className="text-white/50 text-xs truncate">{styleNameEn}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer text */}
        <p className="mt-8 text-xs text-white/30 text-center">
          Please wait • Usually takes 15-30 seconds
        </p>
      </div>
    </div>
  );
}
