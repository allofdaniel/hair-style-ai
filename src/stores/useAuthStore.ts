import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../config/firebase';

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

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithPopup(auth, googleProvider);
          const authUser = mapFirebaseUser(result.user, 'google');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signInWithApple: async () => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithPopup(auth, appleProvider);
          const authUser = mapFirebaseUser(result.user, 'apple');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Apple sign in failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signInWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
          const authUser = mapFirebaseUser(result.user, 'email');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Email sign in failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signUpWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
          const authUser = mapFirebaseUser(result.user, 'email');
          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordResetEmail(auth, email);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: () => {
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
