import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

// MediaPipe Hair Segmenter - REAL hair segmentation
let hairSegmenter: ImageSegmenter | null = null;

async function initHairSegmenter(): Promise<ImageSegmenter> {
  if (hairSegmenter) return hairSegmenter;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  hairSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });

  return hairSegmenter;
}

export default function MaskPreview() {
  const navigate = useNavigate();
  const { userPhoto, setHairMask, setMaskConfirmed } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMask, setShowMask] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading AI model...');
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!userPhoto) {
      navigate('/camera');
      return;
    }

    runHairSegmentation();
  }, [userPhoto]);

  const runHairSegmentation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load MediaPipe Hair Segmenter
      setLoadingMessage('Loading hair detection AI...');
      const segmenter = await initHairSegmenter();

      // Create image element from base64
      setLoadingMessage('Analyzing your photo...');
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = userPhoto!;
      });

      imageRef.current = img;

      // Run segmentation
      setLoadingMessage('Detecting hair region...');
      const result = segmenter.segment(img);

      if (!result.categoryMask) {
        throw new Error('No segmentation result');
      }

      // Convert category mask to canvas
      const { mask, overlay } = await createMaskFromSegmentation(img, result.categoryMask);

      setMaskImage(mask);
      setOverlayImage(overlay);
      setLoadingMessage('Done!');

    } catch (err) {
      console.error('Hair segmentation error:', err);
      setError('머리카락 인식 실패. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const createMaskFromSegmentation = async (
    img: HTMLImageElement,
    categoryMask: { width: number; height: number; getAsUint8Array: () => Uint8Array }
  ): Promise<{ mask: string; overlay: string }> => {
    const width = img.width;
    const height = img.height;
    const maskWidth = categoryMask.width;
    const maskHeight = categoryMask.height;

    // Get raw mask data (0 = background, 1 = hair)
    const maskData = categoryMask.getAsUint8Array();

    // Create mask canvas (scale to original image size)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Create temp canvas at mask resolution
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskWidth;
    tempCanvas.height = maskHeight;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Create ImageData from mask
    const tempImageData = tempCtx.createImageData(maskWidth, maskHeight);
    for (let i = 0; i < maskData.length; i++) {
      const isHair = maskData[i] === 1;
      const pixelIndex = i * 4;
      // White for hair (will be changed), black for non-hair (will be preserved)
      const value = isHair ? 255 : 0;
      tempImageData.data[pixelIndex] = value;     // R
      tempImageData.data[pixelIndex + 1] = value; // G
      tempImageData.data[pixelIndex + 2] = value; // B
      tempImageData.data[pixelIndex + 3] = 255;   // A
    }
    tempCtx.putImageData(tempImageData, 0, 0);

    // Scale mask to original image size
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingQuality = 'high';
    maskCtx.drawImage(tempCanvas, 0, 0, width, height);

    // Apply slight blur for smoother edges
    maskCtx.filter = 'blur(2px)';
    maskCtx.drawImage(maskCanvas, 0, 0);
    maskCtx.filter = 'none';

    // Threshold to clean up blur
    const finalMaskData = maskCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < finalMaskData.data.length; i += 4) {
      const val = finalMaskData.data[i] > 128 ? 255 : 0;
      finalMaskData.data[i] = val;
      finalMaskData.data[i + 1] = val;
      finalMaskData.data[i + 2] = val;
    }
    maskCtx.putImageData(finalMaskData, 0, 0);

    const mask = maskCanvas.toDataURL('image/png');

    // Create overlay (original image with red tint on hair)
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    const overlayCtx = overlayCanvas.getContext('2d')!;

    // Draw original image
    overlayCtx.drawImage(img, 0, 0);

    // Draw red tint on hair areas
    const overlayData = overlayCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < finalMaskData.data.length; i += 4) {
      if (finalMaskData.data[i] > 128) {
        // Hair pixel - add red tint
        overlayData.data[i] = Math.min(255, overlayData.data[i] * 0.5 + 255 * 0.5);     // R
        overlayData.data[i + 1] = Math.floor(overlayData.data[i + 1] * 0.5);            // G
        overlayData.data[i + 2] = Math.floor(overlayData.data[i + 2] * 0.5);            // B
      }
    }
    overlayCtx.putImageData(overlayData, 0, 0);

    const overlay = overlayCanvas.toDataURL('image/png');

    return { mask, overlay };
  };

  const handleConfirm = () => {
    if (maskImage) {
      setHairMask(maskImage);
      setMaskConfirmed(true);
      navigate('/style-select');
    }
  };

  const handleRetake = () => {
    navigate('/camera');
  };

  const handleRetry = () => {
    runHairSegmentation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="p-4 flex items-center">
        <button onClick={() => navigate('/camera')} className="text-white text-2xl">
          ←
        </button>
        <h1 className="flex-1 text-center text-white font-bold">Hair Region Check</h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-6">
        {/* Info text */}
        <div className="w-full max-w-sm mb-4">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
            <p className="text-white text-sm text-center">
              <span className="text-red-400 font-bold">Red area</span> = Hair region that will be changed
            </p>
            <p className="text-white/60 text-xs text-center mt-1">
              Face area (not red) will remain unchanged
            </p>
          </div>
        </div>

        {/* Image preview */}
        <div className="w-full max-w-sm">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#1a1a2e] mb-4">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-white/60">{loadingMessage}</p>
                <p className="text-white/40 text-sm mt-1">AI-powered detection</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-white/60 text-center">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-4 px-6 py-2 rounded-xl bg-purple-500 text-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <img
                  src={showMask ? overlayImage || userPhoto! : userPhoto!}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Toggle mask view button */}
                <button
                  onClick={() => setShowMask(!showMask)}
                  className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs"
                >
                  {showMask ? 'Hide Mask' : 'Show Mask'}
                </button>
              </>
            )}
          </div>

          {/* Detection info */}
          {!isLoading && !error && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 mb-4">
              <p className="text-green-400 text-sm text-center">
                ✓ Hair detected using MediaPipe AI
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isLoading && (
            <div className="flex gap-4">
              <button
                onClick={handleRetake}
                className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-medium"
              >
                Retake Photo
              </button>
              <button
                onClick={handleConfirm}
                disabled={!maskImage}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium disabled:opacity-50"
              >
                Confirm & Continue
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer tip */}
      <footer className="p-4">
        <div className="bg-white/5 rounded-2xl p-3">
          <p className="text-xs text-white/40 text-center">
            Powered by Google MediaPipe Hair Segmentation AI
          </p>
        </div>
      </footer>
    </div>
  );
}
