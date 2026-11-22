import { plateSvg } from '../lib/plates';
import { stickerMeta, type StickerKey } from '../lib/stickers';

/** A top-down plate illustration (lib/plates.ts). */
export function Plate({ k, size = 48, className = '' }: { k: StickerKey; size?: number; className?: string }) {
  return <span className={`plate ${className}`} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: plateSvg(k) }} />;
}

/** A category tile: soft pastel square with the plate sitting on it. Used in lists and pickers. */
export function FoodTile({ k, size = 48, radius, className = '' }: { k: StickerKey; size?: number; radius?: number; className?: string }) {
  const m = stickerMeta(k);
  return (
    <span className={`food-tile ${className}`} style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.3), background: m.tint }}>
      <Plate k={k} size={Math.round(size * 0.84)} />
    </span>
  );
}

/** The best picture we have for a spot: your photo, then a creator's video frame, then its plate on the category colour. */
export function SpotImage({ src, k, className = '', alt = '' }: { src: string | null; k: StickerKey; className?: string; alt?: string }) {
  const m = stickerMeta(k);
  if (src) return <img className={`spot-img ${className}`} src={src} alt={alt} loading="lazy" draggable={false} />;
  return (
    <span
      className={`spot-img is-plate ${className}`}
      style={{ background: `radial-gradient(110% 90% at 75% 30%, #ffffffcc 0%, transparent 60%), ${m.tint}` }}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      <Plate k={k} className="spot-plate" />
    </span>
  );
}
