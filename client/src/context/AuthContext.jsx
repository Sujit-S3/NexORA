// NexORA — Auth Context
// Provides authentication state and actions to the entire app.
// Auth is tracked purely via the server's httpOnly session cookie — the
// client never stores the JWT itself, only the resulting user object.

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '@services/authService';
import { identifyUser, resetUser } from '@services/analyticsService';

// ── Initial state ─────────────────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true during initial /me check
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Ask the server whether the session cookie is still valid on mount —
  // there is nothing meaningful to check client-side beforehand.
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data } = await authService.getMe();
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.data } });
      } catch {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };
    verifyAuth();
  }, []);

  const readGuestData = () => {
    let guestCart = [];
    let guestWishlist = [];
    try {
      const storedCart = localStorage.getItem('nexora_cart');
      if (storedCart) guestCart = JSON.parse(storedCart);

      const storedWishlist = localStorage.getItem('nexora_wishlist');
      if (storedWishlist) guestWishlist = JSON.parse(storedWishlist);
    } catch {
      // corrupt localStorage — ignore, treat as no guest data
    }
    return { guestCart, guestWishlist };
  };

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { guestCart, guestWishlist } = readGuestData();
      const { data } = await authService.login({ ...credentials, guestCart, guestWishlist });
      const { user } = data.data;

      // Successfully merged, clear guest data to prevent ghost reappearance
      localStorage.removeItem('nexora_cart');
      localStorage.removeItem('nexora_wishlist');

      // Identify this user in PostHog for product analytics
      identifyUser(user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { guestCart, guestWishlist } = readGuestData();
      const { data } = await authService.register({ ...userData, guestCart, guestWishlist });
      const { user } = data.data;

      // Clear guest data
      localStorage.removeItem('nexora_cart');
      localStorage.removeItem('nexora_wishlist');

      // Identify this user in PostHog for product analytics
      identifyUser(user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Reset PostHog identity so the next session starts fresh
      resetUser();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Direct auth injection (used after password reset — the server has
  // already set the session cookie, so there's nothing to store here).
  const loginWithData = useCallback((user) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    loginWithData,
    isAdmin: state.user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ──────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
