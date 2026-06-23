// NexORA — Cart Context
// Manages client-side cart state and syncs with backend.
// Full cart logic implemented in Phase 4.

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartService } from '@services/cartService';
import { useAuth } from './AuthContext';

// ── Initial state ─────────────────────────────────────────────────────────
const initialState = {
  items: [],
  totalPrice: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'CART_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        totalPrice: action.payload.totalPrice || 0,
        itemCount: action.payload.itemCount || 0,
        isLoading: false,
        error: null,
      };
    case 'CART_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────────────────
const CartContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Fetch cart from backend when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated]);

  const fetchCart = useCallback(async () => {
    dispatch({ type: 'CART_LOADING' });
    try {
      const { data } = await cartService.getCart();
      dispatch({ type: 'SET_CART', payload: data.data || {} });
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    dispatch({ type: 'CART_LOADING' });
    try {
      const { data } = await cartService.addItem(productId, quantity);
      dispatch({ type: 'SET_CART', payload: data.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    dispatch({ type: 'CART_LOADING' });
    try {
      const { data } = await cartService.updateItem(productId, quantity);
      dispatch({ type: 'SET_CART', payload: data.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    dispatch({ type: 'CART_LOADING' });
    try {
      const { data } = await cartService.removeItem(productId);
      dispatch({ type: 'SET_CART', payload: data.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const clearCart = useCallback(async () => {
    dispatch({ type: 'CART_LOADING' });
    try {
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const value = {
    ...state,
    fetchCart,
    addToCart,
    updateItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// ── Hook ──────────────────────────────────────────────────────────────────
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
