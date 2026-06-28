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
      const flatItems = (action.payload.items || []).map(item => {
        if (item.product && typeof item.product === 'object' && item.product._id) {
          return {
            ...item,
            _id: item.product._id, // Set the item ID to the product ID for easy update/remove
            cartItemId: item._id, // keep original cart item ID if needed
            name: item.product.name,
            brand: item.product.brand,
            slug: item.product.slug,
            image: item.image || item.product.primaryImage?.url || item.product.images?.[0]?.url || item.product.image || '',
            price: item.product.discountPrice !== null && item.product.discountPrice !== undefined ? item.product.discountPrice : item.product.price,
            originalPrice: item.product.price,
            stock: item.product.stock,
            variants: item.product.variants,
            isActive: item.product.isActive,
            size: item.size || '',
            color: item.color || '',
            sku: item.sku || '',
            fitType: item.fitType || '',
            recommendedSize: item.recommendedSize || '',
            confidence: item.confidence || 0,
            fitWarning: item.fitWarning || '',
          };
        }
        return item; // fallback
      });
      return {
        ...state,
        items: flatItems,
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

  const saveLocalCart = (items) => {
    // Repair missing prices for existing broken local items
    const repairedItems = items.map(i => ({
      ...i,
      price: i.price ?? i.originalPrice ?? 0
    }));

    localStorage.setItem('nexora_cart', JSON.stringify(repairedItems));
    let totalPrice = 0;
    let itemCount = 0;
    repairedItems.forEach(i => {
      totalPrice += i.price * i.quantity;
      itemCount += i.quantity;
    });
    dispatch({ type: 'SET_CART', payload: { items: repairedItems, totalPrice, itemCount } });
  };

  const getLocalCartItems = () => {
    try {
      const stored = localStorage.getItem('nexora_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      const localItems = getLocalCartItems();
      saveLocalCart(localItems);
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

  const addToCart = useCallback(async (productOrId, quantity = 1, size = '', color = '') => {
    dispatch({ type: 'CART_LOADING' });
    
    const productId = typeof productOrId === 'string' ? productOrId : productOrId._id;
    
    if (isAuthenticated) {
      try {
        const { data } = await cartService.addItem(productId, quantity, size, color);
        dispatch({ type: 'SET_CART', payload: data.data });
        return { success: true };
      } catch (error) {
        dispatch({ type: 'CART_ERROR', payload: error.message });
        return { success: false, message: error.message };
      }
    } else {
      // Guest logic
      try {
        let productData = typeof productOrId === 'object' ? productOrId : null;
        if (!productData) {
          // Fallback fetch if only ID provided
          const response = await fetch(`http://localhost:5000/api/products?_id=${productId}`);
          const resData = await response.json();
          productData = resData.data.find(p => p._id === productId);
        }
        
        if (!productData) throw new Error('Product not found');
        if (!productData.isActive) throw new Error(`The ${productData.name} is currently inactive and cannot be added to cart.`);
        
        let availableStock = productData.stock;
        if (productData.variants && productData.variants.length > 0) {
          if (!size) throw new Error(`Please select a size for ${productData.name}.`);
          const variant = productData.variants.find(v => v.size === size);
          if (!variant) throw new Error(`Selected size ${size} is invalid.`);
          availableStock = variant.stock;
        }

        if (availableStock === 0) throw new Error(`The ${productData.name}${size ? ` (Size: ${size})` : ''} is currently out of stock.`);
        if (availableStock < quantity) throw new Error(`Insufficient stock. Only ${availableStock} available.`);
        
        const localItems = getLocalCartItems();
        const existing = localItems.find(i => (i._id === productId || i.product === productId) && (i.size || '') === size && (i.color || '') === color);
        
        if (existing) {
          if (existing.quantity + quantity > availableStock) {
            throw new Error(`Cannot add ${quantity} more. Only ${availableStock - existing.quantity} available.`);
          }
          existing.quantity += quantity;
        } else {
          localItems.push({
            _id: productId,
            product: productId,
            name: productData.name,
            brand: productData.brand,
            slug: productData.slug,
            image: productData.primaryImage?.url || productData.images?.[0]?.url || productData.image || '',
            price: (productData.discountPrice !== null && productData.discountPrice !== undefined) ? productData.discountPrice : productData.price,
            originalPrice: productData.price,
            stock: productData.stock,
            variants: productData.variants,
            isActive: productData.isActive,
            quantity: quantity,
            size: size,
            color: color,
            fitType: productData.fitType || '',
            recommendedSize: productData.fitRecommendation?.recommendedSize || '',
            confidence: productData.fitRecommendation?.confidence || 0,
            fitWarning: productData.fitRecommendation?.fitWarnings?.[0] || '',
          });
        }
        
        saveLocalCart(localItems);
        return { success: true };
      } catch (error) {
        dispatch({ type: 'CART_ERROR', payload: error.message });
        return { success: false, message: error.message };
      }
    }
  }, [isAuthenticated]);

  const updateItem = useCallback(async (productId, quantity, size = '') => {
    dispatch({ type: 'CART_LOADING' });
    if (isAuthenticated) {
      try {
        const { data } = await cartService.updateItem(productId, quantity, size);
        dispatch({ type: 'SET_CART', payload: data.data });
        return { success: true };
      } catch (error) {
        dispatch({ type: 'CART_ERROR', payload: error.message });
        return { success: false, message: error.message };
      }
    } else {
      try {
        const localItems = getLocalCartItems();
        const existing = localItems.find(i => (i._id === productId || i.product === productId) && (i.size || '') === size);
        if (existing) {
          let availableStock = existing.stock;
          if (existing.variants && existing.variants.length > 0) {
            const variant = existing.variants.find(v => v.size === size);
            if (variant) availableStock = variant.stock;
          }
          if (quantity > availableStock) {
            throw new Error(`Cannot update quantity. Only ${availableStock} left in stock.`);
          }
          existing.quantity = quantity;
        }
        saveLocalCart(localItems);
        return { success: true };
      } catch (error) {
        dispatch({ type: 'CART_ERROR', payload: error.message });
        return { success: false, message: error.message };
      }
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (productId) => {
    dispatch({ type: 'CART_LOADING' });
    if (isAuthenticated) {
      try {
        const { data } = await cartService.removeItem(productId);
        dispatch({ type: 'SET_CART', payload: data.data });
        return { success: true };
      } catch (error) {
        dispatch({ type: 'CART_ERROR', payload: error.message });
        return { success: false, message: error.message };
      }
    } else {
      try {
        let localItems = getLocalCartItems();
        localItems = localItems.filter(i => i._id !== productId && i.product !== productId);
        saveLocalCart(localItems);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    dispatch({ type: 'CART_LOADING' });
    try {
      if (isAuthenticated) {
        await cartService.clearCart();
      }
      localStorage.removeItem('nexora_cart');
      dispatch({ type: 'CLEAR_CART' });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CART_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, [isAuthenticated]);

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
