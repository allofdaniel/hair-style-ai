import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAppStore } from '../stores/useAppStore';

export default function Camera() {
  const navigate = useNavigate();
  const { setUserPhoto } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        setPreviewUrl(base64Image);
        setUserPhoto(base64Image);
      }
    } catch (error) {
      console.error('Camera error:', error);
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (image.base64String) {
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        setPreviewUrl(base64Image);
        setUserPhoto(base64Image);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewUrl(base64);
        setUserPhoto(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (previewUrl) {
      navigate('/style-select');
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setUserPhoto(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex flex-col safe-area-top safe-area-bottom">
      <header className="p-4 flex items-center">
        <button onClick={() => navigate('/')} className="text-white text-2xl">
          ←
        </button>
        <h1 className="flex-1 text-center text-white font-bold">Take Photo</h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {previewUrl ? (
          <div className="w-full max-w-sm">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[var(--color-bg-card)] mb-6">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRetake}
                className="flex-1 py-4 px-6 rounded-2xl bg-[var(--color-bg-card)] text-white font-medium"
              >
                Retake
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 py-4 px-6 rounded-2xl gradient-primary text-white font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="aspect-[3/4] rounded-3xl bg-[var(--color-bg-card)] flex items-center justify-center mb-8 border-2 border-dashed border-[var(--color-primary)]/30">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-[var(--color-text-secondary)]">Loading...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-[var(--color-text-secondary)]">Take a front-facing photo</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Make sure your hair is visible
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={selectFromGallery}
                disabled={isLoading}
                className="flex-1 py-4 px-6 rounded-2xl bg-[var(--color-bg-card)] text-white font-medium disabled:opacity-50"
              >
                <span className="text-xl block mb-1">🖼️</span>
                Gallery
              </button>
              <button
                onClick={takePhoto}
                disabled={isLoading}
                className="flex-1 py-4 px-6 rounded-2xl gradient-primary text-white font-medium disabled:opacity-50"
              >
                <span className="text-xl block mb-1">📷</span>
                Camera
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-6">
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-4">
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            💡 <span className="text-[var(--color-primary)]">Tip:</span> Take photo in good lighting for best results
          </p>
        </div>
      </footer>
    </div>
  );
}
