// NexORA — Spinner Component

const sizeMap = {
  xs: 'w-4 h-4 border-2',
  sm: 'w-6 h-6 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const colorMap = {
  primary: 'border-primary-500',
  white: 'border-white',
  gray: 'border-gray-400',
  secondary: 'border-secondary-500',
};

/**
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {'primary'|'white'|'gray'|'secondary'} color
 * @param {string} className - Additional class names
 */
const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        inline-block rounded-full border-t-transparent animate-spin
        ${sizeMap[size] || sizeMap.md}
        ${colorMap[color] || colorMap.primary}
        ${className}
      `}
    />
  );
};

export default Spinner;
