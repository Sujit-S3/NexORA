import {
  Award,
  Briefcase,
  CreditCard,
  Gem,
  Gift,
  GitCompare,
  Heart,
  Map,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Tag,
  TrendingUp,
  User,
  Watch,
} from 'lucide-react';

export const JOURNEY_STAGES = [
  { id: 'browsing', label: 'Browsing', icon: Map },
  { id: 'discovery', label: 'Discovery', icon: Sparkles },
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'cart', label: 'Cart', icon: ShoppingBag },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'purchase', label: 'Purchase', icon: Tag },
  { id: 'aftercare', label: 'Aftercare', icon: Package },
];

export const LUXURY_COLLECTIONS = [
  {
    title: 'Executive Essentials',
    prompt: 'Show me executive essentials for a modern CEO.',
    icon: Briefcase,
    accent: 'border-amber-300/30',
  },
  {
    title: 'Boardroom Picks',
    prompt: 'Curate boardroom-ready luxury pieces.',
    icon: Award,
    accent: 'border-stone-300/30',
  },
  {
    title: 'Luxury Timepieces',
    prompt: 'Show me premium luxury watches.',
    icon: Watch,
    accent: 'border-emerald-300/30',
  },
  {
    title: 'Collector Choice',
    prompt: 'Find me collector-grade investment pieces.',
    icon: Gem,
    accent: 'border-violet-300/30',
  },
  {
    title: 'Gift Finder',
    action: 'WIZARD',
    icon: Gift,
    accent: 'border-rose-300/30',
  },
  {
    title: 'Curated For You',
    prompt: 'Show me personalised recommendations based on my taste.',
    icon: Sparkles,
    accent: 'border-indigo-300/30',
  },
  {
    title: 'Luxury Weekend',
    prompt: 'Curate pieces for a luxury weekend away.',
    icon: Target,
    accent: 'border-teal-300/30',
  },
  {
    title: 'New Arrivals',
    prompt: 'What are the latest luxury arrivals this season?',
    icon: TrendingUp,
    accent: 'border-sky-300/30',
  },
];

export const WIZARD_STEPS = [
  {
    id: 'recipient',
    title: 'Who is this gift for?',
    options: ['CEO', 'Founder', 'Executive', 'Client', 'Partner', 'Family', 'Friend'],
  },
  {
    id: 'budget',
    title: 'Select your budget.',
    options: ['Rs. 25,000', 'Rs. 50,000', 'Rs. 1,00,000', 'Rs. 2,00,000', 'Rs. 5,00,000+'],
  },
  {
    id: 'category',
    title: 'Which category?',
    options: ['Watches', 'Designer Bags', 'Technology', 'Jewellery', 'Accessories'],
  },
  {
    id: 'personality',
    title: 'Their personal style.',
    options: ['Minimalist', 'Executive', 'Tech-Forward', 'Collector', 'Heritage Lover', 'Traveller'],
  },
];

export const INPUT_PLACEHOLDERS = [
  "Tell me what you're looking for...",
  'Show me luxury watches under Rs. 5 lakh...',
  'Find a gift for a CEO...',
  'Compare Rolex and Omega...',
  'I need something for a board meeting...',
  'Curate a collector watch for me...',
];

export const STREAMING_STAGES = [
  'Understanding your request...',
  'Searching verified inventory...',
  'Applying luxury filters...',
  'Ranking products...',
  'Preparing recommendations...',
  'Writing explanation...',
];

export const PROFILE_FIELDS = [
  { key: 'budget', label: 'Budget', icon: Tag },
  { key: 'preferredBrands', label: 'Brand', icon: Award },
  { key: 'category', label: 'Category', icon: Shield },
  { key: 'recipient', label: 'Recipient', icon: User },
  { key: 'occasion', label: 'Occasion', icon: Gift },
  { key: 'materials', label: 'Materials', icon: Gem },
  { key: 'colors', label: 'Colors', icon: Sparkles },
  { key: 'style', label: 'Style', icon: Star },
];

export const QUICK_SUGGESTIONS = [
  'Build a quiet luxury work wardrobe',
  'Find a gift under Rs. 1 lakh',
  'Compare two investment watches',
  'Show available new arrivals',
];
