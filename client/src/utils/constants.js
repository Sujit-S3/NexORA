// NexORA — App-Wide Constants

// ── API ───────────────────────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'NexORA';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// ── Local storage keys ────────────────────────────────────────────────────
export const TOKEN_KEY = 'nexora_token';
export const THEME_KEY = 'nexora_theme';

// ── Pagination ────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48];

// ── Order statuses ────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  pending: 'warning',
  processing: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error',
};

// ── Payment methods ───────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
];

// ── Sort options for product listing ─────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'ratings.average:desc', label: 'Top Rated' },
  { value: 'sold:desc', label: 'Best Selling' },
];

// ── Rating labels ─────────────────────────────────────────────────────────
export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

// ── Image placeholder ─────────────────────────────────────────────────────
export const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/e2e8f0/64748b?text=NexORA';
export const PLACEHOLDER_AVATAR = 'https://placehold.co/80x80/6366f1/ffffff?text=U';

// ── Shipping ──────────────────────────────────────────────────────────────
export const FREE_SHIPPING_THRESHOLD = 499; // Free shipping above ₹499
export const SHIPPING_COST = 49;
export const TAX_RATE = 0.18; // 18% GST

// ── Route paths ───────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/product/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
  NOT_FOUND: '*',
};
