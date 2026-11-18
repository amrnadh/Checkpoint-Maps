import type { Spot } from './types';

/**
 * Hand-built food sticker illustrations (64×64). Flat colour, one ink outline weight,
 * drawn to read at 36px on a map. See DESIGN.md › Stickers.
 */
const INK = '#16222C';
const o = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;

export type StickerKey =
  | 'dosa' | 'biryani' | 'chai' | 'coffee' | 'momo' | 'icecream'
  | 'bakery' | 'burger' | 'thali' | 'cart' | 'cafe' | 'noodles';

const ART: Record<StickerKey, { tint: string; label: string; svg: string }> = {
  dosa: {
    tint: '#FFE7B8',
    label: 'Dosa',
    svg: `<ellipse cx="32" cy="36" rx="25" ry="19" fill="#fff" ${o}/>
      <path d="M12 42 L49 21 Q55 24 53 30 L17 48 Q11 47 12 42Z" fill="#E9A23B" ${o}/>
      <path d="M19 43 L48 27 M24 45 L50 31" stroke="#C9781E" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="22" cy="27" r="5.5" fill="#F6F2E4" ${o}/>
      <circle cx="44" cy="45" r="5" fill="#E0452B" ${o}/>`,
  },
  biryani: {
    tint: '#FBD9C2',
    label: 'Biryani',
    svg: `<path d="M17 28 Q32 8 47 28Z" fill="#FFF3D6" ${o}/>
      <circle cx="26" cy="22" r="1.6" fill="#F2B01E"/><circle cx="33" cy="18" r="1.6" fill="#F2B01E"/><circle cx="38" cy="24" r="1.6" fill="#F2B01E"/><circle cx="30" cy="25" r="1.6" fill="#E9A23B"/>
      <path d="M40 15 Q47 8 51 14 Q46 19 40 15Z" fill="#3E9A5C" ${o}/>
      <path d="M14 31 h36 v4 q0 17 -18 17 q-18 0 -18 -17z" fill="#B8673A" ${o}/>
      <rect x="11" y="27" width="42" height="6" rx="3" fill="#D98A4E" ${o}/>
      <path d="M20 39 q12 5 24 0" stroke="#8F4A24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  },
  chai: {
    tint: '#F6E3CF',
    label: 'Chai',
    svg: `<path d="M27 14 q-3 -3 0 -6 M35 14 q-3 -3 0 -6" stroke="#64717D" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M19 18 h26 l-3.4 32 q-.6 3.5 -4 3.5 h-11.2 q-3.4 0 -4 -3.5z" fill="#E8F4F8" ${o}/>
      <path d="M21.3 27 h21.4 l-2.4 22.4 q-.4 2 -2.6 2 h-11.4 q-2.2 0 -2.6 -2z" fill="#C27A3E"/>
      <path d="M21.5 27.5 h21" stroke="#EBCB9C" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 21 l1.6 26" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
  },
  coffee: {
    tint: '#E3EAEF',
    label: 'Filter coffee',
    svg: `<path d="M10 43 h44 l-5 9 h-34z" fill="#C3CDD5" ${o}/>
      <path d="M21 14 h22 l-2.5 30 h-17z" fill="#DCE4EA" ${o}/>
      <ellipse cx="32" cy="14" rx="11" ry="3" fill="#C8935F" ${o}/>
      <path d="M25 20 l1.4 20" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M22 9 q-2 -3 1 -5" stroke="#64717D" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  momo: {
    tint: '#F3E7CC',
    label: 'Momos',
    svg: `<path d="M11 36 q5 -16 12 -16 q7 0 12 16z" fill="#FBF6EC" ${o}/>
      <path d="M29 36 q5 -16 12 -16 q7 0 12 16z" fill="#FBF6EC" ${o}/>
      <path d="M19 36 q6 -19 13 -19 q7 0 13 19z" fill="#FFFDF7" ${o}/>
      <path d="M32 18 v6 M28 20 l2 5 M36 20 l-2 5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="8" y="36" width="48" height="14" rx="5" fill="#D9A65A" ${o}/>
      <path d="M12 43 h40" stroke="#A7752F" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  icecream: {
    tint: '#FCDCE6',
    label: 'Sweets',
    svg: `<path d="M22 31 l10 25 l10 -25z" fill="#E7B36A" ${o}/>
      <path d="M25 37 l11 6 M27 44 l7 4 M39 37 l-11 6" stroke="#B9813A" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="32" cy="25" r="12" fill="#F6A9C0" ${o}/>
      <path d="M22 28 q3 4 6 0 q3 4 6 0 q3 4 6 0" stroke="#E57C9E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="12" r="4" fill="#E0452B" ${o}/>`,
  },
  bakery: {
    tint: '#F8E1C2',
    label: 'Bakery',
    svg: `<path d="M9 43 q0 -24 23 -24 q23 0 23 24 q0 6 -6 6 h-34 q-6 0 -6 -6z" fill="#D9893A" ${o}/>
      <path d="M21 27 q-3 7 -2 14 M32 25 v16 M43 27 q3 7 2 14" stroke="#F6C77E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M15 33 q2 -6 7 -9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
  },
  burger: {
    tint: '#FDE4C4',
    label: 'Quick bites',
    svg: `<path d="M12 29 q0 -15 20 -15 q20 0 20 15z" fill="#E9A23B" ${o}/>
      <circle cx="24" cy="21" r="1.2" fill="#fff"/><circle cx="31" cy="18" r="1.2" fill="#fff"/><circle cx="39" cy="21" r="1.2" fill="#fff"/>
      <path d="M10 33 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 v-4 h-40z" fill="#5DB36B" ${o}/>
      <rect x="11" y="33" width="42" height="7" rx="3.5" fill="#7A3F22" ${o}/>
      <path d="M12 42 h40 v3 q0 6 -6 6 h-28 q-6 0 -6 -6z" fill="#E9A23B" ${o}/>`,
  },
  thali: {
    tint: '#DCEFD3',
    label: 'Meals',
    svg: `<path d="M5 42 Q19 12 59 21 Q47 52 5 42Z" fill="#3E9A5C" ${o}/>
      <path d="M8 41 Q31 31 56 22" stroke="#2B7A45" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="31" cy="34" r="7" fill="#fff" ${o}/>
      <circle cx="19" cy="37" r="4" fill="#F2B01E" ${o}/>
      <circle cx="42" cy="28" r="4" fill="#E0452B" ${o}/>
      <circle cx="45" cy="37" r="3.4" fill="#8A5A2B" ${o}/>`,
  },
  cart: {
    tint: '#FFE2D9',
    label: 'Street stall',
    svg: `<path d="M9 25 q23 -18 46 0z" fill="#E0452B" ${o}/>
      <path d="M23 16 l-4 9 M41 16 l4 9 M32 12 v13" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M32 25 v10" ${o}/>
      <rect x="11" y="35" width="42" height="12" rx="3" fill="#F2B01E" ${o}/>
      <path d="M17 41 h30" stroke="#C8860A" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="20" cy="51" r="4.5" fill="#fff" ${o}/><circle cx="44" cy="51" r="4.5" fill="#fff" ${o}/>`,
  },
  cafe: {
    tint: '#EADFD5',
    label: 'Café',
    svg: `<ellipse cx="31" cy="48" rx="22" ry="5" fill="#fff" ${o}/>
      <path d="M14 24 h34 v8 q0 14 -17 14 q-17 0 -17 -14z" fill="#fff" ${o}/>
      <path d="M48 28 q8 0 8 6 q0 6 -9 6" fill="none" ${o}/>
      <ellipse cx="31" cy="24" rx="17" ry="4.5" fill="#B9794A" ${o}/>
      <path d="M31 26.5 q-4 -4 -1.5 -5.5 q1.5 -.8 1.5 1 q0 -1.8 1.5 -1 q2.5 1.5 -1.5 5.5z" fill="#F5E6D3"/>`,
  },
  noodles: {
    tint: '#FFE9C9',
    label: 'Noodles',
    svg: `<path d="M40 8 L28 34 M48 10 L33 35" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>
      <path d="M17 28 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0" stroke="#F2C14E" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M9 30 h46 q0 22 -23 22 q-23 0 -23 -22z" fill="#E0452B" ${o}/>
      <path d="M16 38 h32" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
  },
};

export const stickerMeta = (k: StickerKey) => ART[k];

export function stickerSvg(k: StickerKey) {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ART[k].svg}</svg>`;
}

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

/** Pick the sticker from what you actually ate, then the spot's name and cuisines, then its type. */
export function stickerFor(spot: Spot, dishes: string[] = []): StickerKey {
  const sources = [dishes.join(' '), spot.name, spot.cuisines.join(' ')];
  for (const text of sources) {
    const t = text.toLowerCase();
    if (!t) continue;
    for (const [re, k] of RULES) if (re.test(t)) return k;
  }
  return KIND[spot.kind] ?? 'thali';
}

/** Stable small tilt per spot so a cluster of stickers looks hand-placed, not gridded. */
export function tiltFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 13) - 6) * 1.1;
}

export const ALL_STICKERS = Object.keys(ART) as StickerKey[];
