import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function Settings() {
  const navigate = useNavigate();
  const { credits, history } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    localStorage.removeItem('hair-style-history');
    window.location.reload();
  };

  const handleRateApp = () => {
    // Play Store URL - 출시 후 실제 URL로 변경
    window.open('https://play.google.com/store/apps/details?id=com.allofdaniel.hairstyleai', '_blank');
  };

  const handleContact = () => {
    window.open('mailto:support@hairstyleai.app?subject=HairStyle AI Feedback', '_blank');
  };

  const handlePrivacy = () => {
    // 개인정보 처리방침 페이지
    window.open('https://hairstyleai.app/privacy', '_blank');
  };

  const handleTerms = () => {
    // 이용약관 페이지
    window.open('https://hairstyleai.app/terms', '_blank');
  };

  // 광고 시청으로 크레딧 받기 (추후 AdMob 연동)
  const handleWatchAd = () => {
    // TODO: AdMob Rewarded Ad 연동
    alert('Coming soon! Watch ads to get free credits.');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex flex-col safe-area-top safe-area-bottom">
      <header className="p-4 flex items-center border-b border-[var(--color-bg-card)]">
        <button onClick={() => navigate(-1)} className="text-white text-2xl mr-4">
          ←
        </button>
        <h1 className="text-white font-bold text-lg">Settings</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Credits Section */}
        <section className="bg-[var(--color-bg-card)] rounded-2xl p-4">
          <h2 className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-3">
            My Credits
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-2xl">
                ✨
              </div>
              <div>
                <p className="text-white font-bold text-2xl">{credits}</p>
                <p className="text-[var(--color-text-secondary)] text-sm">credits remaining</p>
              </div>
            </div>
            <button
              onClick={handleWatchAd}
              className="px-4 py-2 bg-[var(--color-bg-input)] rounded-xl text-[var(--color-primary)] text-sm font-medium"
            >
              + Get More
            </button>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="bg-[var(--color-bg-card)] rounded-2xl p-4">
          <h2 className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-3">
            Upgrade Plan
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-bg-input)]">
              <div>
                <p className="text-white font-medium">Free</p>
                <p className="text-[var(--color-text-muted)] text-xs">3 credits • Watermark</p>
              </div>
              <span className="text-[var(--color-primary)] text-sm">Current</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10">
              <div>
                <p className="text-white font-medium">Basic</p>
                <p className="text-[var(--color-text-muted)] text-xs">30 credits/month • No watermark</p>
              </div>
              <span className="text-white text-sm font-bold">$4.99</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-bg-input)]">
              <div>
                <p className="text-white font-medium">Pro</p>
                <p className="text-[var(--color-text-muted)] text-xs">100 credits/month • HD Export</p>
              </div>
              <span className="text-white text-sm font-bold">$9.99</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-bg-input)]">
              <div>
                <p className="text-white font-medium">Unlimited</p>
                <p className="text-[var(--color-text-muted)] text-xs">Unlimited • All features</p>
              </div>
              <span className="text-white text-sm font-bold">$19.99</span>
            </div>
          </div>
          <button className="w-full mt-4 py-3 gradient-primary rounded-xl text-white font-medium">
            Upgrade Now
          </button>
        </section>

        {/* History */}
        <section className="bg-[var(--color-bg-card)] rounded-2xl p-4">
          <h2 className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-3">
            History
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="w-full flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📁</span>
              <span className="text-white">My Transformations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] text-sm">{history.length} items</span>
              <span className="text-[var(--color-text-muted)]">→</span>
            </div>
          </button>
          {history.length > 0 && (
            <>
              <div className="border-t border-[var(--color-bg-input)] my-2" />
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🗑️</span>
                  <span className="text-red-400">Clear History</span>
                </div>
              </button>
            </>
          )}
        </section>

        {/* General */}
        <section className="bg-[var(--color-bg-card)] rounded-2xl p-4">
          <h2 className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-3">
            General
          </h2>
          <div className="space-y-1">
            <button
              onClick={handleRateApp}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⭐</span>
                <span className="text-white">Rate App</span>
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </button>
            <div className="border-t border-[var(--color-bg-input)]" />
            <button
              onClick={handleContact}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <span className="text-white">Contact Us</span>
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </button>
            <div className="border-t border-[var(--color-bg-input)]" />
            <button
              onClick={handlePrivacy}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <span className="text-white">Privacy Policy</span>
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </button>
            <div className="border-t border-[var(--color-bg-input)]" />
            <button
              onClick={handleTerms}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span className="text-white">Terms of Service</span>
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="text-center py-4">
          <p className="text-[var(--color-text-muted)] text-sm">HairStyle AI</p>
          <p className="text-[var(--color-text-muted)] text-xs">Version 1.0.0</p>
        </section>
      </main>

      {/* Clear History Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Clear History?</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              This will permanently delete all your transformation history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--color-bg-input)] text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
