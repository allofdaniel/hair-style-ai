import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useI18n';
import { useAuthStore } from '../stores/useAuthStore';

type AuthMode = 'signin' | 'signup' | 'reset';

export function Auth() {
  const navigate = useNavigate();
  const { t, dir } = useTranslation();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      navigate('/');
    } catch (err) {
      console.error('Apple sign in error:', err);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email) {
      setLocalError(t('auth_error_email_required'));
      return;
    }

    if (!validateEmail(email)) {
      setLocalError(t('auth_error_invalid_email'));
      return;
    }

    if (mode === 'reset') {
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err) {
        console.error('Reset password error:', err);
      }
      return;
    }

    if (!password) {
      setLocalError(t('auth_error_password_required'));
      return;
    }

    if (password.length < 6) {
      setLocalError(t('auth_error_weak_password'));
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError(t('auth_error_password_mismatch'));
      return;
    }

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error('Email auth error:', err);
    }
  };

  const handleGuestContinue = () => {
    navigate('/');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    clearError();
    setResetSent(false);
    if (newMode !== 'reset') {
      setShowEmailForm(false);
    }
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4"
      dir={dir}
    >
      <div className="w-full max-w-md">
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('auth_welcome')}</h1>
          <p className="text-white/80">{t('auth_welcome_desc')}</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6">
          {mode === 'reset' ? (
            /* Password Reset */
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {t('auth_reset_password')}
              </h2>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t('auth_reset_password_sent')}</p>
                  <button
                    onClick={() => switchMode('signin')}
                    className="mt-4 text-indigo-600 font-medium hover:underline"
                  >
                    {t('auth_sign_in')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth_email')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    disabled={isLoading}
                  />
                  {displayError && (
                    <p className="text-red-500 text-sm">{displayError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isLoading ? '...' : t('auth_reset_password')}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="w-full text-gray-600 text-sm hover:underline"
                  >
                    {t('auth_sign_in')}
                  </button>
                </form>
              )}
            </div>
          ) : showEmailForm ? (
            /* Email Form */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {mode === 'signin' ? t('auth_sign_in') : t('auth_sign_up')}
              </h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth_email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth_password')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
              {mode === 'signup' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth_confirm_password')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              )}
              {displayError && (
                <p className="text-red-500 text-sm">{displayError}</p>
              )}
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  {t('auth_forgot_password')}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isLoading ? '...' : mode === 'signin' ? t('auth_sign_in') : t('auth_sign_up')}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                {t('cancel')}
              </button>
            </form>
          ) : (
            /* Social Login Buttons */
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {mode === 'signin' ? t('auth_sign_in') : t('auth_sign_up')}
              </h2>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">{t('auth_continue_with_google')}</span>
              </button>

              {/* Apple Sign In */}
              <button
                onClick={handleAppleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
                </svg>
                <span className="font-medium">{t('auth_continue_with_apple')}</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-gray-500 text-sm">{t('auth_or')}</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Email Sign In */}
              <button
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">{t('auth_continue_with_email')}</span>
              </button>

              {/* Guest Continue */}
              <button
                onClick={handleGuestContinue}
                disabled={isLoading}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition"
              >
                {t('auth_continue_as_guest')}
              </button>

              {/* Switch Mode */}
              <div className="text-center pt-4 border-t border-gray-200">
                <span className="text-gray-600 text-sm">
                  {mode === 'signin' ? t('auth_no_account') : t('auth_have_account')}{' '}
                </span>
                <button
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  {mode === 'signin' ? t('auth_sign_up') : t('auth_sign_in')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-white/60 text-xs text-center mt-6 px-8">
          {t('auth_terms_agree')}
        </p>
      </div>
    </div>
  );
}

export default Auth;
