import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function Home() {
  const navigate = useNavigate();
  const { gender, setGender, credits, history } = useAppStore();

  const handleStart = () => {
    navigate('/camera');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col safe-area-top safe-area-bottom overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-sm text-white/70">{history.length}</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span className="text-sm font-semibold text-amber-400">{credits}</span>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo & Title */}
        <div className="mb-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" fill="currentColor"/>
                <path d="M9 6c-.5-1 0-3 3-3s3.5 2 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-sm">AI</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            HairStyle <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-white/50 text-lg">
            Try new hairstyles in seconds
          </p>
        </div>

        {/* Gender Selection */}
        <div className="w-full max-w-sm mb-8">
          <p className="text-center text-white/40 text-sm mb-4 uppercase tracking-wider">
            Select your style preference
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 py-5 px-4 rounded-2xl font-medium transition-all duration-300 ${
                gender === 'male'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/30 scale-[1.02]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className={gender === 'male' ? 'text-white' : 'text-white/40'}>
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z"/>
                </svg>
                <span className="text-base">Male</span>
              </div>
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 py-5 px-4 rounded-2xl font-medium transition-all duration-300 ${
                gender === 'female'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-500/30 scale-[1.02]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className={gender === 'female' ? 'text-white' : 'text-white/40'}>
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M12 14c-4 0-8 2-8 6h16c0-4-4-6-8-6z"/>
                  <path d="M8 7c0-2 1.5-5 4-5s4 3 4 5" strokeWidth="2" stroke="currentColor" fill="none"/>
                </svg>
                <span className="text-base">Female</span>
              </div>
            </button>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStart}
          className="w-full max-w-sm py-5 px-8 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:shadow-purple-500/40"
        >
          <div className="flex items-center justify-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Start Transformation</span>
          </div>
        </button>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-xs text-white/60 font-medium">45+</p>
            <p className="text-xs text-white/40">Styles</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-xs text-white/60 font-medium">K-Pop</p>
            <p className="text-xs text-white/40">Celeb Styles</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-xs text-white/60 font-medium">100%</p>
            <p className="text-xs text-white/40">Face Safe</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4">
        <p className="text-center text-xs text-white/30">
          Your identity is preserved - only hair is transformed
        </p>
      </footer>
    </div>
  );
}
