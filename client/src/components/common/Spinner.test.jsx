import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders with an accessible loading status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('applies the requested size class', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-12', 'h-12');
  });

  it('falls back to the default size for an unknown value', () => {
    render(<Spinner size="not-a-real-size" />);
    expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
  });
});
