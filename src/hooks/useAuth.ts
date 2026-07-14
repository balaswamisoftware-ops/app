import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Ergonomic access to auth state + actions. Uses a shallow selector so
 * components only re-render when the fields they read change.
 *
 *   const { user, isAuthenticated, login, submitting, error } = useAuth();
 */
export function useAuth() {
  return useAuthStore(
    useShallow(state => ({
      status: state.status,
      user: state.user,
      submitting: state.submitting,
      error: state.error,
      isAuthenticated: state.status === 'authenticated',
      isHydrating: state.status === 'loading',
      hydrate: state.hydrate,
      login: state.login,
      signUp: state.signUp,
      logout: state.logout,
      verifyIdentity: state.verifyIdentity,
      resetPassword: state.resetPassword,
      clearError: state.clearError,
    })),
  );
}
