import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const getLocalWishlist = () => {
    try {
      const saved = localStorage.getItem('nexora_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalWishlist = (items) => {
    localStorage.setItem('nexora_wishlist', JSON.stringify(items));
    setWishlistItems(items);
  };

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await wishlistService.getWishlist();
      setWishlistItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync wishlist');
      console.error('Failed to fetch wishlist', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncWishlist = useCallback(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistItems(getLocalWishlist());
    }
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    syncWishlist();
  }, [syncWishlist]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nexora_wishlist' && !isAuthenticated) {
        setWishlistItems(getLocalWishlist());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const addToWishlist = async (product) => {
    if (!product || !product._id) return;
    
    // Prevent duplicate entries by checking _id immediately
    if (isInWishlist(product._id)) return;

    if (isAuthenticated) {
      try {
        setLoading(true);
        setError(null);
        await wishlistService.addToWishlist(product._id);
        // Refresh from backend to ensure data integrity
        await fetchWishlist();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to add to wishlist');
        console.error('Failed to add to wishlist', err);
      } finally {
        setLoading(false);
      }
    } else {
      const local = getLocalWishlist();
      if (!local.find((item) => item._id === product._id)) {
        local.push(product);
        saveLocalWishlist(local);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!productId) return;

    if (isAuthenticated) {
      try {
        setLoading(true);
        setError(null);
        await wishlistService.removeFromWishlist(productId);
        // Instant UI update
        setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to remove from wishlist');
        console.error('Failed to remove from wishlist', err);
        // Revert UI on failure
        fetchWishlist();
      } finally {
        setLoading(false);
      }
    } else {
      const local = getLocalWishlist();
      saveLocalWishlist(local.filter((item) => item._id !== productId));
    }
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  const clearWishlist = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        await wishlistService.clearWishlist();
      } catch (err) {
        console.error('Failed to clear wishlist', err);
      } finally {
        setLoading(false);
      }
    }
    localStorage.removeItem('nexora_wishlist');
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: Math.max(0, wishlistItems.length),
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        syncWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
