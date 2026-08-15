export function getLuxuryFallback(category) {
  switch(category?.toLowerCase()) {
    case 'watches':
    case 'watch':
      return '/assets/luxury/fallbacks/watch-fallback.webp'
    case 'bags':
    case 'bag':
    case 'accessories':
      return '/assets/luxury/fallbacks/bag-fallback.webp'
    case 'electronics':
    case 'tech':
      return '/assets/luxury/fallbacks/electronics-fallback.webp'
    case 'fashion':
    case 'dresses':
    case 'dress':
    case 'apparel':
    case 'clothing':
      return '/assets/luxury/fallbacks/fashion-fallback.webp'
    case 'lifestyle':
      return '/assets/luxury/fallbacks/lifestyle-fallback.webp'
    default:
      return '/assets/luxury/fallbacks/default-luxury.webp'
  }
}
