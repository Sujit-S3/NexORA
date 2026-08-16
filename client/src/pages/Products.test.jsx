import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getAllCategories: vi.fn(),
}));

vi.mock('@services/productService', () => ({
  productService: { getAll: mocks.getAll },
}));
vi.mock('@services/categoryService', () => ({
  categoryService: { getAll: mocks.getAllCategories },
}));
vi.mock('@context/CartContext', () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock('@context/WishlistContext', () => ({
  useWishlist: () => ({ toggleWishlist: vi.fn(), isInWishlist: () => false }),
}));
vi.mock('../components/common/SEO', () => ({ default: () => null }));

import Products from './Products';

const product = {
  _id: 'p1',
  name: 'Test Watch',
  slug: 'test-watch',
  brand: 'NexORA',
  price: 1000,
  stock: 5,
  isActive: true,
  images: [{ url: '/watch.webp' }],
  ratings: { average: 4.5 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAllCategories.mockResolvedValue({ data: { data: [] } });
});

describe('Products page — data-fetch error handling', () => {
  it('renders products on a successful response', async () => {
    mocks.getAll.mockResolvedValue({
      data: { data: { products: [product], pagination: { page: 1, pages: 1 } } },
    });

    render(<MemoryRouter><Products /></MemoryRouter>);

    expect(await screen.findByText('Test Watch')).toBeInTheDocument();
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn.t load the collection/i)).not.toBeInTheDocument();
  });

  it('shows the empty state only when the API succeeds with zero products', async () => {
    mocks.getAll.mockResolvedValue({
      data: { data: { products: [], pagination: { page: 1, pages: 1 } } },
    });

    render(<MemoryRouter><Products /></MemoryRouter>);

    expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
    expect(screen.queryByText(/couldn.t load the collection/i)).not.toBeInTheDocument();
  });

  it('shows an error state (not "No results found") when the request fails', async () => {
    mocks.getAll.mockRejectedValue(new Error('timeout of 15000ms exceeded'));

    render(<MemoryRouter><Products /></MemoryRouter>);

    expect(await screen.findByText(/couldn.t load the collection/i)).toBeInTheDocument();
    expect(screen.queryByText(/^no results found$/i)).not.toBeInTheDocument();
  });

  it('retries the fetch when Retry is clicked after a failure', async () => {
    mocks.getAll
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({
        data: { data: { products: [product], pagination: { page: 1, pages: 1 } } },
      });

    render(<MemoryRouter><Products /></MemoryRouter>);

    expect(await screen.findByText(/couldn.t load the collection/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Test Watch')).toBeInTheDocument();
  });
});
