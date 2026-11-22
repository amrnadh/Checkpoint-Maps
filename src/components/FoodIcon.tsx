import {
  BowlFood, BowlSteam, Bread, Coffee, CoffeeBean, CookingPot, ForkKnife, Hamburger, IceCream, Pepper, Storefront, TeaBag,
  type Icon as PhIcon,
} from '@phosphor-icons/react';
import { stickerMeta, type FoodGlyph, type StickerKey } from '../lib/stickers';

const GLYPHS: Record<FoodGlyph, PhIcon> = {
  BowlFood, BowlSteam, Bread, Coffee, CoffeeBean, CookingPot, ForkKnife, Hamburger, IceCream, Pepper, Storefront, TeaBag,
};

export function FoodGlyph({ k, size = 24 }: { k: StickerKey; size?: number }) {
  const m = stickerMeta(k);
  const G = GLYPHS[m.glyph];
  return <G size={size} weight="duotone" color={m.ink} />;
}

/** A category tile: pastel square with the duotone glyph. Used when a spot has no photo. */
export function FoodTile({ k, size = 48, radius, className = '' }: { k: StickerKey; size?: number; radius?: number; className?: string }) {
  const m = stickerMeta(k);
  return (
    <span
      className={`food-tile ${className}`}
      style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.28), background: m.tint }}
    >
      <FoodGlyph k={k} size={Math.round(size * 0.5)} />
    </span>
  );
}

/** The best picture we have for a spot: your photo, then a creator's video frame, then the category tile. */
export function SpotImage({ src, k, className = '', alt = '' }: { src: string | null; k: StickerKey; className?: string; alt?: string }) {
  const m = stickerMeta(k);
  if (src) return <img className={`spot-img ${className}`} src={src} alt={alt} loading="lazy" draggable={false} />;
  return (
    <span className={`spot-img is-glyph ${className}`} style={{ background: `radial-gradient(120% 90% at 70% 30%, #fff8 0%, transparent 60%), ${m.tint}` }} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      <FoodGlyph k={k} size={64} />
    </span>
  );
}
