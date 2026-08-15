import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateItem: vi.fn(),
  cartState: {},
  wishlistState: {},
}));

vi.mock('@context/CartContext', () => ({ useCart: () => mocks.cartState }));
vi.mock('@context/WishlistContext', () => ({ useWishlist: () => mocks.wishlistState }));
vi.mock('@services/api', () => ({
  default: { post: vi.fn(() => new Promise(() => {})) },
}));

import Cart from './Cart';
import Wishlist from './Wishlist';

const product = {
  _id: 'product-1',
  cartItemId: 'cart-item-1',
  name: 'Variant Product',
  slug: 'variant-product',
  brand: 'NexORA',
  price: 1000,
  quantity: 1,
  size: 'M',
  color: 'Black',
  stock: 5,
  isActive: true,
  images: [{ url: '/product.webp' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cartState = {
    items: [product],
    totalPrice: 1000,
    removeItem: mocks.removeFromCart,
    updateItem: mocks.updateItem,
    clearCart: vi.fn(),
    addToCart: mocks.addToCart,
  };
  mocks.wishlistState = {
    wishlistItems: [product],
    addToWishlist: mocks.addToWishlist,
    removeFromWishlist: mocks.removeFromWishlist,
    clearWishlist: vi.fn(),
  };
});

describe('commerce list transfers', () => {
  it('keeps the cart item when saving to the wishlist fails', async () => {
    mocks.addToWishlist.mockResolvedValue({ success: false, message: 'Wishlist unavailable' });

    render(<MemoryRouter><Cart /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /^wishlist$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wishlist unavailable');
    expect(mocks.removeFromCart).not.toHaveBeenCalled();
  });

  it('moves the exact cart variant only after the wishlist write succeeds', async () => {
    mocks.addToWishlist.mockResolvedValue({ success: true });
    mocks.removeFromCart.mockResolvedValue({ success: true });

    render(<MemoryRouter><Cart /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /^wishlist$/i }));

    await waitFor(() => expect(mocks.removeFromCart).toHaveBeenCalledWith(
      'product-1', 'M', 'Black', 'cart-item-1',
    ));
  });

  it('keeps the wishlist item when adding the selected variant to cart fails', async () => {
    mocks.addToCart.mockResolvedValue({ success: false, message: 'Insufficient stock' });

    render(<MemoryRouter><Wishlist /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient stock');
    expect(mocks.addToCart).toHaveBeenCalledWith(product, 1, 'M', 'Black');
    expect(mocks.removeFromWishlist).not.toHaveBeenCalled();
  });
});
