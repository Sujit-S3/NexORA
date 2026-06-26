// NexORA — Auth Context
// Provides authentication state and actions to the entire app.
// Full implementation in Phase 2 — this is the scaffold.

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '@services/authService';
import { identifyUser, resetUser } from '@services/analyticsService';

// ── Initial state ─────────────────────────────────────────────────────────
const initialState = {
  user: null,
  token: localStorage.getItem('nexora_token') || null,
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
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        token: null,
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

  // Verify token and fetch current user on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('nexora_token');
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
        return;
      }
      try {
        const { data } = await authService.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.data, token },
        });
      } catch {
        localStorage.removeItem('nexora_token');
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };
    verifyAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      // Append guest cart if exists
      let guestCart = [];
      let guestWishlist = [];
      try {
        const storedCart = localStorage.getItem('nexora_cart');
        if (storedCart) guestCart = JSON.parse(storedCart);
        
        const storedWishlist = localStorage.getItem('nexora_wishlist');
        if (storedWishlist) guestWishlist = JSON.parse(storedWishlist);
      } catch (e) {}

      const { data } = await authService.login({ ...credentials, guestCart, guestWishlist });
      const { token, user } = data.data;
      
      localStorage.setItem('nexora_token', token);
      
      // Successfully merged, clear guest data to prevent ghost reappearance
      localStorage.removeItem('nexora_cart');
      localStorage.removeItem('nexora_wishlist');

      // Identify this user in PostHog for product analytics
      identifyUser(user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      // Append guest cart if exists
      let guestCart = [];
      let guestWishlist = [];
      try {
        const storedCart = localStorage.getItem('nexora_cart');
        if (storedCart) guestCart = JSON.parse(storedCart);
        
        const storedWishlist = localStorage.getItem('nexora_wishlist');
        if (storedWishlist) guestWishlist = JSON.parse(storedWishlist);
      } catch (e) {}

      const { data } = await authService.register({ ...userData, guestCart, guestWishlist });
      const { token, user } = data.data;
      
      localStorage.setItem('nexora_token', token);
      
      // Clear guest data
      localStorage.removeItem('nexora_cart');
      localStorage.removeItem('nexora_wishlist');

      // Identify this user in PostHog for product analytics
      identifyUser(user);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
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
      localStorage.removeItem('nexora_token');
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

  // Direct auth injection (used after password reset — no extra API call needed)
  const loginWithData = useCallback((token, user) => {
    localStorage.setItem('nexora_token', token);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
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
