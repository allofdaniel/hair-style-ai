import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type UserCredential,
  type Auth,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider, isFirebaseConfigReady } from '../config/firebase';

interface AuthErrorState {
  code?: string;
  message: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'apple' | 'email' | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

const MISSING_AUTH_CONFIG_ERROR = 'Firebase ?몄쬆 ?ㅼ젙??鍮꾩뼱 ?덉뼱 濡쒓렇??湲곕뒫???ъ슜?????놁뒿?덈떎.';

const mapFirebaseUser = (user: User, provider: AuthUser['provider']): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  provider,
});

const getProviderFromUser = (user: User): AuthUser['provider'] => {
  const providerId = user.providerData[0]?.providerId;
  if (providerId === 'google.com') return 'google';
  if (providerId === 'apple.com') return 'apple';
  if (providerId === 'password') return 'email';
  return null;
};

const formatAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    const typedError = error as AuthErrorState;
    const code = typedError.code;

    if (code === 'auth/configuration-not-found') {
      return 'Firebase ?몄쬆 ?ㅼ젙???섎せ?섏뿀?듬땲??';
    }
    if (code === 'auth/popup-closed-by-user') {
      return '濡쒓렇??李쎌씠 ?ロ삍?듬땲??';
    }
    return error.message;
  }

  return '?????녿뒗 ?몄쬆 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.';
};

const getAuthClient = (): Auth => {
  if (!isFirebaseConfigReady || !auth) {
    throw new Error(MISSING_AUTH_CONFIG_ERROR);
  }
  return auth;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      signInWithGoogle: async () => {
        if (!googleProvider) {
          const error = new Error(MISSING_AUTH_CONFIG_ERROR);
          set({ error: error.message, isLoading: false });
          throw error;
        }

        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithPopup(getAuthClient(), googleProvider);
          const authUser = mapFirebaseUser(result.user, 'google');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signInWithApple: async () => {
        if (!appleProvider) {
          const error = new Error(MISSING_AUTH_CONFIG_ERROR);
          set({ error: error.message, isLoading: false });
          throw error;
        }

        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithPopup(getAuthClient(), appleProvider);
          const authUser = mapFirebaseUser(result.user, 'apple');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signInWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithEmailAndPassword(
            getAuthClient(),
            email,
            password
          );
          const authUser = mapFirebaseUser(result.user, 'email');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signUpWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await createUserWithEmailAndPassword(
            getAuthClient(),
            email,
            password
          );
          const authUser = mapFirebaseUser(result.user, 'email');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await signOut(getAuthClient());
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordResetEmail(getAuthClient(), email);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = formatAuthError(error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: () => {
        if (!isFirebaseConfigReady || !auth) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return () => {};
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            const provider = getProviderFromUser(user);
            const authUser = mapFirebaseUser(user, provider);
            set({ user: authUser, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'beforecut-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
