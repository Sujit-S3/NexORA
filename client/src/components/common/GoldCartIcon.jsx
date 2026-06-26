import React, { useEffect, useState } from 'react';

/**
 * Utility to strip background from an image.
 * Removes both black and white backgrounds dynamically to provide a perfectly transparent asset.
 */
const removeBackground = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
        
        // Strip WHITE backgrounds
        if (brightness > 240 && r > 220 && g > 220 && b > 220) {
          d[i + 3] = 0; // completely transparent
        } else if (brightness > 215 && r > 195 && g > 195 && b > 195) {
          // fade out the bright edges to make them smooth
          d[i + 3] = Math.round(255 * ((brightness - 215) / 25));
        }
        
        // Strip BLACK backgrounds
        else if (brightness < 12 && r < 15 && g < 15 && b < 15) {
          d[i + 3] = 0; // completely transparent
        } else if (brightness < 35 && r < 40 && g < 40 && b < 40) {
          // fade out the dark edges to make them smooth
          d[i + 3] = Math.round(255 * (1 - ((35 - brightness) / 23)));
        }
      }
      ctx.putImageData(new ImageData(d, canvas.width, canvas.height), 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

/**
 * NexORA Gold Cart Icon
 * Strips the background dynamically via canvas to provide a perfect transparent asset.
 */
const GoldCartIcon = ({ size = 20, className = '' }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    // We use the cart-gold.png and strip out the background
    removeBackground('/cart-gold.png').then(setSrc);
  }, []);

  if (!src) {
    // Show an invisible placeholder of the exact size while loading
    return <div style={{ width: size, height: size, display: 'inline-block' }} className={className} />;
  }

  return (
    <img
      src={src}
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
