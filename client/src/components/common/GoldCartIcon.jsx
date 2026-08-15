import React from 'react';

/**
 * NexORA Gold Cart Icon
 * Strips the background dynamically via canvas to provide a perfect transparent asset.
 */
const GoldCartIcon = ({ size = 20, className = '' }) => {
  return (
    <img
      src="/cart-gold.png"
      alt="Cart"
      width={size}
      height={size}
      draggable={false}
      className={`max-w-none ${className}`}
      style={{
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
};

export default GoldCartIcon;
