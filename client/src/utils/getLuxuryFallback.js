export function getLuxuryFallback(category) {
  switch(category?.toLowerCase()) {
    case 'watches':
      return '/assets/luxury/fallbacks/watch-fallback.webp'
    case 'bags':
      return '/assets/luxury/fallbacks/bag-fallback.webp'
    case 'electronics':
      return '/assets/luxury/fallbacks/electronics-fallback.webp'
    case 'fashion':
      return '/assets/luxury/fallbacks/fashion-fallback.webp'
    case 'lifestyle':
      return '/assets/luxury/fallbacks/lifestyle-fallback.webp'
    default:
      return '/assets/luxury/fallbacks/default-luxury.webp'
  }
}
