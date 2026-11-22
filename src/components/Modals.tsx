import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowUpRight, Check, CheckCircle, Fire, InstagramLogo, Link, MapPin, Medal, NavigationArrow, Play, ShareNetwork,
  Sparkle, Trash, X, YoutubeLogo,
} from '@phosphor-icons/react';
import type { RewardDiff } from '../lib/game';
import { stickerMeta, type StickerKey } from '../lib/stickers';
import { embedUrl, normHandle, parseVideoUrl, platformLabel, type ParsedVideo } from '../lib/video';
import type { Spot, SpotKind, Video } from '../lib/types';
import { FoodTile, SpotImage } from './FoodIcon';

/* ───────── Shell ───────── */

export function Modal({ label, onClose, children, className = '' }: { label: string; onClose(): void; children: ReactNode; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={label}>
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <div className={`modal ${className}`}>
        <span className="grabber" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function ModalHead({ title, onClose }: { title: string; onClose(): void }) {
  return (
    <div className="modal-head">
      <h2 className="display">{title}</h2>
      <button className="round soft" onClick={onClose} aria-label="Close"><X size={18} /></button>
    </div>
  );
}

/* ───────── Reward ───────── */

export function Reward({ diff, spot, sticker, image, videos, onShare, onClose }: {
  diff: RewardDiff; spot: Spot; sticker: StickerKey; image: string | null; videos: Video[]; onShare(): void; onClose(): void;
}) {
  const creators = [...new Set(videos.map((v) => v.creator))];
  return (
    <div className="reward" role="dialog" aria-modal="true" aria-label="Checked in">
      <div className="reward-inner">
        <div className="reward-art">
          <span className="burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg` } as React.CSSProperties} />)}</span>
          <div className="reward-frame"><SpotImage src={image} k={sticker} className="reward-img" /></div>
          <span className="reward-check"><Check size={22} weight="bold" /></span>
        </div>
        <p className="reward-kicker">{diff.number ? 'Added to your collection' : 'Saved to your diary'}</p>
        <h1 className="display">{spot.name}</h1>
        {diff.number && <p className="reward-no">No. <b>{diff.number}</b></p>}

        {creators.length > 0 && diff.newSpot && (
          <p className="callout"><Play size={14} weight="fill" /> You found it. This spot is in a video by {creators.join(' and ')}.</p>
        )}

        {diff.collectionMoves.length > 0 && (
          <div className="cards">
            {diff.collectionMoves.map((m) => (
              <div key={m.title} className={`tcard compact${m.creator ? ' is-creator' : ''}${m.done ? ' is-done' : ''}`}>
                <div className="tcard-head"><b>{m.title}</b><span className="tcard-count">{m.after}<small>/{m.goal}</small></span></div>
                <Meter from={m.before} to={m.after} goal={m.goal} />
              </div>
            ))}
          </div>
        )}

        {(diff.newBadges.length > 0 || diff.newDishes.length > 0 || diff.streakExtended) && (
          <div className="wins">
            {diff.newBadges.map((b) => <span key={b.id} className="win is-gold"><Medal size={15} weight="fill" /> {b.title}</span>)}
            {diff.streakExtended && <span className="win"><Fire size={15} weight="fill" /> {diff.streak}-week streak</span>}
            {diff.newDishes.map((d) => <span key={d} className="win"><Sparkle size={14} weight="fill" /> {d}</span>)}
          </div>
        )}

        <div className="dock static">
          <button className="pill outline" onClick={onClose}>Done</button>
          <button className="pill dark grow" onClick={onShare}><ShareNetwork size={18} /> Share</button>
        </div>
      </div>
    </div>
  );
}

function Meter({ from, to, goal }: { from: number; to: number; goal: number }) {
  const [w, setW] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => setW(to), 450);
    return () => clearTimeout(t);
  }, [to]);
  return <span className="meter"><i style={{ width: `${(w / Math.max(1, goal)) * 100}%` }} /></span>;
}

/* ───────── Video player ───────── */

export function VideoSheet({ video, spot, collected, onClose, onShowOnMap }: { video: Video; spot?: Spot; collected: boolean; onClose(): void; onShowOnMap(): void }) {
  const src = embedUrl(video);
  return (
    <Modal label="Video" onClose={onClose}>
      <div className={`player ${video.vertical ? 'tall' : 'wide'}`}>
        {src ? (
          <iframe src={src} title={video.title || 'Creator video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <div className="player-demo"><Play size={36} weight="fill" /><b>Demo video</b><span>Real YouTube and Instagram links play here.</span></div>
        )}
      </div>
      <div className="creator-row">
        <span className="avatar">{video.creator.replace(/^@/, '').charAt(0).toUpperCase()}</span>
        <div className="grow">
          <b>{video.creator}</b>
          <small>{platformLabel(video)}{collected ? '. You’ve eaten here' : ''}</small>
        </div>
        {video.url && <a className="round soft" href={video.url} target="_blank" rel="noreferrer" aria-label={`Open in ${video.platform === 'youtube' ? 'YouTube' : 'Instagram'}`}><ArrowUpRight size={18} /></a>}
      </div>
      {(spot || video.title) && (
        <div className="quote">
          {video.title && <p>“{video.title}”</p>}
          {spot && <small><MapPin size={13} weight="fill" /> {spot.name}</small>}
        </div>
      )}
      <button className="pill dark block" onClick={onShowOnMap}><MapPin size={18} /> Show on map</button>
    </Modal>
  );
}

/* ───────── Add a creator video ───────── */

export interface VideoDraft { parsed: ParsedVideo; creator: string; title: string }

const KINDS: [SpotKind, string, StickerKey][] = [
  ['restaurant', 'Restaurant', 'thali'], ['street', 'Street stall', 'cart'], ['cafe', 'Café', 'cafe'],
  ['fast_food', 'Quick bites', 'burger'], ['bakery', 'Bakery', 'bakery'], ['sweets', 'Sweets', 'icecream'],
];

export function AddVideo({ spots, onExisting, onPickNew, onClose }: {
  spots: Spot[]; onExisting(d: VideoDraft, s: Spot): void; onPickNew(d: VideoDraft, name: string, kind: SpotKind): void; onClose(): void;
}) {
  const [url, setUrl] = useState('');
  const [creator, setCreator] = useState('');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState<SpotKind>('restaurant');
  const parsed = parseVideoUrl(url);
  const handle = normHandle(creator);
  const q = place.trim().toLowerCase();
  const matches = q.length > 1 ? spots.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const ready = !!parsed && !!handle;
  const draft = (): VideoDraft => ({ parsed: parsed!, creator: handle, title: title.trim() });

  return (
    <Modal label="Add a creator’s video" onClose={onClose}>
      <ModalHead title="Add a creator’s video" onClose={onClose} />
      <div className="form">
        <label className="field-wrap">
          <span>Video link</span>
          <span className={`field-icon${parsed ? ' ok' : ''}`}>
            {parsed?.platform === 'youtube' ? <YoutubeLogo size={20} weight="fill" /> : parsed?.platform === 'instagram' ? <InstagramLogo size={20} weight="fill" /> : <Link size={20} />}
            <input className="field" inputMode="url" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube or Instagram link" />
          </span>
          {url && !parsed && <small className="bad">This isn’t a YouTube or Instagram video link.</small>}
        </label>
        <label className="field-wrap">
          <span>Creator</span>
          <input className="field" value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="@handle" autoCapitalize="none" />
        </label>
        <label className="field-wrap">
          <span>What they said about it <em>(optional)</em></span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best ghee roast in town" />
        </label>
        <label className="field-wrap">
          <span>Which place is in the video?</span>
          <span className="field-icon"><MapPin size={20} /><input className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Spot name" /></span>
        </label>
        {matches.length > 0 && (
          <div className="pick-list">
            {matches.map((s) => (
              <button key={s.id} className="pick" disabled={!ready} onClick={() => onExisting(draft(), s)}>
                <MapPin size={18} weight="duotone" /><span className="grow"><b>{s.name}</b><small>Already on your map</small></span><ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        )}
        {place.trim() && (
          <>
            <div className="kind-grid">
              {KINDS.map(([k, l, st]) => (
                <button key={k} className="kind" aria-pressed={kind === k} onClick={() => setKind(k)}>
                  <FoodTile k={st} size={34} radius={10} /><span>{l}</span>
                </button>
              ))}
            </div>
            <button className="pill dark block" disabled={!ready} onClick={() => onPickNew(draft(), place.trim(), kind)}>
              <MapPin size={18} /> Place it on the map
            </button>
          </>
        )}
        {!ready && <p className="fine">Add the video link and the creator’s handle to continue.</p>}
      </div>
    </Modal>
  );
}

/* ───────── Menu ───────── */

export function Menu({ hasDemo, onAddVideo, onDemo, onRemoveDemo, onSetCity, onReset, onClose }: {
  hasDemo: boolean; onAddVideo(): void; onDemo(): void; onRemoveDemo(): void; onSetCity(): void; onReset(): void; onClose(): void;
}) {
  return (
    <Modal label="Options" onClose={onClose}>
      <ModalHead title="Options" onClose={onClose} />
      <div className="menu-list">
        <button onClick={onAddVideo}><Link size={20} /> Add a creator’s video</button>
        {hasDemo ? <button onClick={onRemoveDemo}><X size={20} /> Remove demo spots</button> : <button onClick={onDemo}><Play size={20} /> Add demo spots</button>}
        <button onClick={onSetCity}><NavigationArrow size={20} /> Set my city to this area</button>
        <button className="danger" onClick={onReset}><Trash size={20} /> Delete all my data</button>
      </div>
    </Modal>
  );
}

/* ───────── Share preview ───────── */

export function SharePreview({ url, onShare, onClose }: { url: string; onShare(): void; onClose(): void }) {
  return (
    <Modal label="Share image" onClose={onClose}>
      <ModalHead title="Share" onClose={onClose} />
      <img className="share-img" src={url} alt="Your share image" />
      <p className="fine">The image has no map, address or location on it.</p>
      <button className="pill dark block" onClick={onShare}><ShareNetwork size={18} /> Share image</button>
    </Modal>
  );
}

/* ───────── First run ───────── */

export function Onboarding({ busy, error, onGps, onMapCentre }: { busy: boolean; error: string | null; onGps(): void; onMapCentre(): void }) {
  const tiles: StickerKey[] = ['biryani', 'chai', 'dosa', 'icecream', 'momo', 'cart', 'coffee', 'bakery'];
  return (
    <div className="onboard mist">
      <div className="onboard-art" aria-hidden="true">
        {tiles.map((k, i) => (
          <span key={k} className={`ob-tile o${i}`}><FoodTile k={k} size={i % 3 === 0 ? 84 : 64} /></span>
        ))}
        <span className="ob-pin"><MapPin size={30} weight="fill" /></span>
      </div>
      <div className="onboard-copy">
        <h1 className="display xl">Eat at the spots everyone’s talking about</h1>
        <p>Pin the places you see in food reels, go eat there, and build your own collection of the city’s best plates.</p>
        {error && <p className="bad">{error}</p>}
      </div>
      <div className="onboard-actions">
        <button className="pill dark block lg" onClick={onGps} disabled={busy}><NavigationArrow size={18} weight="fill" /> {busy ? 'Finding you…' : 'Start near me'}</button>
        <button className="pill outline block lg" onClick={onMapCentre} disabled={busy}>Choose a city on the map</button>
        <p className="fine"><CheckCircle size={14} weight="fill" /> Your location stays on this phone.</p>
      </div>
    </div>
  );
}

export const kindLabel = (k: StickerKey) => stickerMeta(k).label;
