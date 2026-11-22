import type { Spot } from './types';

/**
 * Food categories. Each has a pastel tile colour, a darker glyph colour and a Phosphor icon
 * (rendered by components/FoodIcon). See DESIGN.md › Colour and Icons.
 */
export type StickerKey =
  | 'dosa' | 'biryani' | 'chai' | 'coffee' | 'momo' | 'icecream'
  | 'bakery' | 'burger' | 'thali' | 'cart' | 'cafe' | 'noodles';

export type FoodGlyph =
  | 'BowlFood' | 'CookingPot' | 'TeaBag' | 'Coffee' | 'BowlSteam' | 'IceCream'
  | 'Bread' | 'Hamburger' | 'ForkKnife' | 'Storefront' | 'CoffeeBean' | 'Pepper';

const CAT: Record<StickerKey, { tint: string; ink: string; label: string; glyph: FoodGlyph }> = {
  dosa: { tint: '#FFE9C4', ink: '#A65F00', label: 'Tiffin', glyph: 'BowlFood' },
  biryani: { tint: '#FFDCCB', ink: '#A83F17', label: 'Biryani', glyph: 'CookingPot' },
  chai: { tint: '#F2E2D1', ink: '#7E5230', label: 'Chai', glyph: 'TeaBag' },
  coffee: { tint: '#E8E0D7', ink: '#55402E', label: 'Filter coffee', glyph: 'Coffee' },
  momo: { tint: '#E4F0D6', ink: '#46711A', label: 'Momos', glyph: 'BowlSteam' },
  icecream: { tint: '#FFDDEC', ink: '#B23472', label: 'Sweets', glyph: 'IceCream' },
  bakery: { tint: '#FBE4CB', ink: '#9B5813', label: 'Bakery', glyph: 'Bread' },
  burger: { tint: '#FFE7C7', ink: '#A65A12', label: 'Quick bites', glyph: 'Hamburger' },
  thali: { tint: '#DCF0E2', ink: '#1F7046', label: 'Meals', glyph: 'ForkKnife' },
  cart: { tint: '#DDE9FF', ink: '#2858B5', label: 'Street stall', glyph: 'Storefront' },
  cafe: { tint: '#E9DFF6', ink: '#5E3CA8', label: 'Café', glyph: 'CoffeeBean' },
  noodles: { tint: '#FFDEDE', ink: '#B53434', label: 'Indo-Chinese', glyph: 'Pepper' },
};

export const stickerMeta = (k: StickerKey) => CAT[k];

const RULES: [RegExp, StickerKey][] = [
  [/biryani|pulao|mandi|handi|haleem/, 'biryani'],
  [/dosa|idli|idly|vada|uttapam|pongal|ghee roast|tiffin|darshini/, 'dosa'],
  [/momo|dumpling|dim ?sum|gyoza/, 'momo'],
  [/filter coffee|kaapi|kapi/, 'coffee'],
  [/chai|tea\b|kahwa/, 'chai'],
  [/noodle|hakka|manchurian|chow|ramen|fried rice|schezwan/, 'noodles'],
  [/ice ?cream|kulfi|falooda|gelato|jalebi|halwa|mithai|sweet|dessert|gulab|rabdi/, 'icecream'],
  [/bun|bread|bakery|puff|croissant|cake|pastry|rusk/, 'bakery'],
  [/burger|fries|sandwich|roll|shawarma|wrap|pizza|hot ?dog/, 'burger'],
  [/coffee|cafe|café|latte|espresso|cappuccino/, 'cafe'],
  [/meals|thali|banana leaf|sadya|military|andhra|chettinad/, 'thali'],
];

const KIND: Record<Spot['kind'], StickerKey> = {
  street: 'cart', restaurant: 'thali', cafe: 'cafe', fast_food: 'burger', bakery: 'bakery', sweets: 'icecream', other: 'thali',
};

/** Pick the category from what you actually ate, then the spot's name and cuisines, then its type. */
export function stickerFor(spot: Spot, dishes: string[] = []): StickerKey {
  for (const text of [dishes.join(' '), spot.name, spot.cuisines.join(' ')]) {
    const t = text.toLowerCase();
    if (!t) continue;
    for (const [re, k] of RULES) if (re.test(t)) return k;
  }
  return KIND[spot.kind] ?? 'thali';
}

export const ALL_STICKERS = Object.keys(CAT) as StickerKey[];
