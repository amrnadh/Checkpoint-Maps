import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft, ArrowUpRight, CalendarBlank, Check, Compass, Cube, DotsThree, Fire, Heart, Link, MagnifyingGlass,
  MapTrifold, Medal, SealCheck, NavigationArrow, NotePencil, Path, Play, Plus, ShareNetwork, SquaresFour, StackSimple, X,
} from '@phosphor-icons/react';
import { RATING_LABEL, type GameState } from '../lib/game';
import { MAP_THEMES, type MapTheme } from '../lib/mapTheme';
import { blobUrl } from '../lib/image';
import { stickerMeta, type StickerKey } from '../lib/stickers';
import { platformLabel, thumbUrl } from '../lib/video';
import type { CheckIn, Spot, Video } from '../lib/types';
import { FoodTile, Plate, SpotImage } from './FoodIcon';

export const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const fmtKm = (m: number) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
const initial = (h: string) => h.replace(/^@/, '').charAt(0).toUpperCase() || '?';

/** Everything a screen needs to show one spot. */
export interface SpotVM {
  spot: Spot;
  sticker: StickerKey;
  image: string | null;
  state: 'collected' | 'totry';
  videos: Video[];
  visits: CheckIn[];
  number: number | null;
  distance: number | null;
  creators: string[];
}

export type Filter = 'all' | 'totry' | 'collected' | 'reels';
export type Tab = 'map' | 'collection' | 'diary';

/* ───────── Map: top bar, chips ───────── */

export function TopBar({ query, onQuery, onMenu }: { query: string; onQuery(q: string): void; onMenu(): void }) {
  return (
    <div className="topbar">
      <label className="search glass">
        <MagnifyingGlass size={20} />
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search spots, dishes, creators" enterKeyHint="search" />
        {query && <button className="clear" aria-label="Clear search" onClick={() => onQuery('')}><X size={14} weight="bold" /></button>}
      </label>
      <button className="round glass" aria-label="More options" onClick={onMenu}><DotsThree size={22} weight="bold" /></button>
    </div>
  );
}

export function Chips({ filter, counts, onFilter }: { filter: Filter; counts: Record<Filter, number>; onFilter(f: Filter): void }) {
  const items: [Filter, string][] = [['all', 'All'], ['totry', 'To try'], ['collected', 'Collected'], ['reels', 'From reels']];
  return (
    <div className="chips-row" role="tablist" aria-label="Show">
      {items.map(([f, l]) => (
        <button key={f} role="tab" aria-selected={filter === f} className="fchip" onClick={() => onFilter(f)}>
          {l}<span className="fcount">{counts[f]}</span>
        </button>
      ))}
    </div>
  );
}

export function MapControls({ is3D, bearing, theme, onTheme, onLocate, on3D, onNorth }: {
  is3D: boolean; bearing: number; theme: MapTheme; onTheme(t: MapTheme): void; onLocate(): void; on3D(): void; onNorth(): void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mapctl">
      {open && (
        <div className="styles glass" role="radiogroup" aria-label="Map style">
          {MAP_THEMES.map(({ id, label }) => (
            <button key={id} role="radio" aria-checked={theme === id} className="style-opt" onClick={() => { onTheme(id); setOpen(false); }}>
              <span className={`style-thumb is-${id}`} aria-hidden="true"><i /><i /><i /></span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <button className="round glass" aria-label="Map style" aria-expanded={open} onClick={() => setOpen((o) => !o)}><StackSimple size={21} weight={open ? 'fill' : 'regular'} /></button>
      {Math.abs(bearing) > 3 && (
        <button className="round glass" aria-label="Point the map north" onClick={onNorth}>
          <span style={{ display: 'grid', transform: `rotate(${-bearing - 45}deg)` }}><Compass size={22} /></span>
        </button>
      )}
      <button className="round glass" aria-label={is3D ? 'Flat map' : '3D map'} aria-pressed={is3D} onClick={on3D}><Cube size={21} weight={is3D ? 'fill' : 'regular'} /></button>
      <button className="round glass" aria-label="Show my location" onClick={onLocate}><NavigationArrow size={20} /></button>
    </div>
  );
}

/* ───────── Map: card carousel (synced with pins) ───────── */

function Tag({ vm }: { vm: SpotVM }) {
  if (vm.state === 'collected') return <span className="tag is-lime"><SealCheck size={14} weight="fill" /> Collected{vm.number ? `, no. ${vm.number}` : ''}</span>;
  if (vm.creators.length) return <span className="tag is-creator"><span className="tag-av">{initial(vm.creators[0])}</span>{vm.creators[0]}</span>;
  return <span className="tag">To try</span>;
}

export function SpotCard({ vm, hero, onOpen }: { vm: SpotVM; hero: boolean; onOpen(): void }) {
  const meta = stickerMeta(vm.sticker);
  const vtn = { viewTransitionName: hero ? 'hero' : undefined } as CSSProperties;
  return (
    <article className={`scard ${vm.image ? 'is-photo' : 'is-plate'}`} data-id={vm.spot.id} style={{ '--tint': meta.tint } as CSSProperties}>
      <button className="scard-hit" onClick={onOpen} aria-label={`Open ${vm.spot.name}`} />
      {vm.image ? (
        <span className="scard-media" style={vtn}><SpotImage src={vm.image} k={vm.sticker} className="scard-img" /></span>
      ) : (
        <span className="scard-plate" style={vtn}><Plate k={vm.sticker} size={168} /></span>
      )}
      <span className="scard-shade" />
      <div className="scard-top"><Tag vm={vm} /></div>
      <div className="scard-body">
        <h3>{vm.spot.name}</h3>
        <p>{meta.label}{vm.distance != null ? <><span className="sep" aria-hidden="true" />{fmtKm(vm.distance)} away</> : null}</p>
      </div>
      <span className="scard-go" aria-hidden="true"><ArrowUpRight size={20} weight="bold" /></span>
    </article>
  );
}

export function Carousel({ items, selected, heroId, onFocus, onOpen, empty }: {
  items: SpotVM[]; selected: string | null; heroId: string | null; onFocus(id: string): void; onOpen(vm: SpotVM): void; empty: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const quietUntil = useRef(0);

  // Pin tapped → bring its card in.
  useEffect(() => {
    if (!selected || !ref.current) return;
    const card = ref.current.querySelector<HTMLElement>(`[data-id="${CSS.escape(selected)}"]`);
    if (!card) return;
    const box = ref.current;
    const target = card.offsetLeft - (box.clientWidth - card.clientWidth) / 2;
    if (Math.abs(box.scrollLeft - target) < 4) return;
    quietUntil.current = performance.now() + 700;
    box.scrollTo({ left: target, behavior: 'smooth' });
  }, [selected, items]);

  // Card swiped into the middle → select its pin.
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    let t = 0;
    const onScroll = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        if (performance.now() < quietUntil.current) return;
        const mid = box.scrollLeft + box.clientWidth / 2;
        let best: HTMLElement | null = null;
        let bestD = Infinity;
        box.querySelectorAll<HTMLElement>('.scard').forEach((c) => {
          const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = c; }
        });
        const id = (best as HTMLElement | null)?.dataset.id;
        if (id && id !== selected) onFocus(id);
      }, 120);
    };
    box.addEventListener('scroll', onScroll, { passive: true });
    return () => box.removeEventListener('scroll', onScroll);
  }, [selected, onFocus]);

  return (
    <div className="carousel" ref={ref}>
      {items.length ? items.map((vm) => <SpotCard key={vm.spot.id} vm={vm} hero={heroId === vm.spot.id} onOpen={() => onOpen(vm)} />) : empty}
    </div>
  );
}

export function EmptyCard({ onAddVideo, onDemo }: { onAddVideo(): void; onDemo(): void }) {
  return (
    <article className="scard is-empty">
      <div className="empty-tiles" aria-hidden="true">
        {(['biryani', 'dosa', 'chai'] as StickerKey[]).map((k, i) => <FoodTile key={k} k={k} size={38} className={`t${i}`} />)}
      </div>
      <h3>Your map is empty</h3>
      <p>Add a spot you saw in a reel, or check in where you’re eating now.</p>
      <div className="row">
        <button className="pill dark sm" onClick={onAddVideo}><Link size={16} /> Add a video</button>
        <button className="pill outline sm" onClick={onDemo}>Try demo spots</button>
      </div>
    </article>
  );
}

/* ───────── Floating nav ───────── */

export function Nav({ tab, onTab, onCheckIn }: { tab: Tab; onTab(t: Tab): void; onCheckIn(): void }) {
  const items: [Tab, string, React.ReactNode][] = [
    ['map', 'Map', <MapTrifold size={20} weight={tab === 'map' ? 'fill' : 'regular'} />],
    ['collection', 'Collection', <SquaresFour size={20} weight={tab === 'collection' ? 'fill' : 'regular'} />],
    ['diary', 'Diary', <NotePencil size={20} weight={tab === 'diary' ? 'fill' : 'regular'} />],
  ];
  const i = items.findIndex((x) => x[0] === tab);
  return (
    <nav className="navbar" aria-label="Sections">
      <div className="navpill glass" style={{ '--i': i } as CSSProperties}>
        <span className="nav-ind" aria-hidden="true" />
        {items.map(([t, l, icon]) => (
          <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => onTab(t)}>{icon}<span>{l}</span></button>
        ))}
      </div>
      <button className="checkin-btn" onClick={onCheckIn} aria-label="I ate here"><Plus size={26} weight="bold" /></button>
    </nav>
  );
}

/* ───────── Spot page ───────── */

export function SpotPage({ vm, onBack, onCheckIn, onPlay }: { vm: SpotVM; onBack(): void; onCheckIn(): void; onPlay(v: Video): void }) {
  const { spot } = vm;
  const meta = stickerMeta(vm.sticker);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat.toFixed(6)},${spot.lng.toFixed(6)}`;
  const last = vm.visits[vm.visits.length - 1];
  return (
    <div className="page spot-page">
      <div className="hero" style={{ viewTransitionName: 'hero' } as CSSProperties}>
        <SpotImage src={vm.image} k={vm.sticker} className="hero-img" alt={spot.name} />
        <span className="hero-shade" />
      </div>
      <div className="page-nav">
        <button className="round glass" onClick={onBack} aria-label="Back to map"><ArrowLeft size={20} /></button>
        <a className="round glass" href={directions} target="_blank" rel="noreferrer" aria-label="Directions"><Path size={20} /></a>
      </div>
      <div className="sheet-card">
        <Tag vm={vm} />
        <h1 className="display">{spot.name}</h1>
        <p className="meta-line">
          <span className="cat-dot" style={{ background: meta.tint, color: meta.ink }}><FoodTile k={vm.sticker} size={22} radius={7} /></span>
          {meta.label}{vm.distance != null ? `, ${fmtKm(vm.distance)} away` : ''}
        </p>

        <div className="stats">
          <div><b>{vm.visits.length}</b><span>{vm.visits.length === 1 ? 'visit' : 'visits'}</span></div>
          <div><b>{last ? RATING_LABEL[last.rating] : '–'}</b><span>last time</span></div>
          <div><b>{vm.videos.length}</b><span>{vm.videos.length === 1 ? 'video' : 'videos'}</span></div>
        </div>

        {vm.videos.length > 0 && (
          <section>
            <h2 className="section-title">Seen in</h2>
            <div className="vlist">
              {vm.videos.map((v) => {
                const th = thumbUrl(v);
                return (
                  <button key={v.id} className="vitem" onClick={() => onPlay(v)}>
                    <span className="vthumb" style={{ background: stickerMeta(vm.sticker).tint }}>{th ? <img src={th} alt="" /> : <Plate k={vm.sticker} size={50} />}<span className="vplay"><Play size={12} weight="fill" /></span></span>
                    <span className="vtext"><b>{v.title || 'Watch the video'}</b><small>{v.creator}, {platformLabel(v)}</small></span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {vm.visits.length > 0 && (
          <section>
            <h2 className="section-title">Your visits</h2>
            <ol className="timeline">
              {[...vm.visits].reverse().map((c) => (
                <li key={c.id}>
                  <span className="tl-dot"><Check size={11} weight="bold" /></span>
                  <div className="tl-body">
                    <div className="tl-head"><b>{c.dishes.length ? c.dishes.join(', ') : 'Visit'}</b><time>{fmtDate(c.createdAt)}</time></div>
                    <small>{RATING_LABEL[c.rating]}{c.note ? `. “${c.note}”` : ''}</small>
                    {c.photo && <img className="tl-photo" src={blobUrl(c.photo)} alt="" />}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        {spot.id.startsWith('demo:') && <p className="fine">This is a demo spot. You can remove demo spots from the menu.</p>}
      </div>
      <div className="dock">
        <a className="pill outline" href={directions} target="_blank" rel="noreferrer"><Path size={18} /> Directions</a>
        <button className="pill dark grow" onClick={onCheckIn}><Plus size={18} weight="bold" /> {vm.visits.length ? 'Check in again' : 'I ate here'}</button>
      </div>
    </div>
  );
}

/* ───────── Collection ───────── */

export function CollectionPage({ state, items, onOpen, onShare }: { state: GameState; items: SpotVM[]; onOpen(vm: SpotVM): void; onShare(): void }) {
  const [view, setView] = useState<'spots' | 'trails' | 'badges'>('spots');
  const collected = items.filter((v) => v.state === 'collected').sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const nextBadge = state.badges.find((b) => !b.earned);
  const earned = state.badges.filter((b) => b.earned).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="page mist">
      <header className="page-head">
        <div>
          <p className="greet">{greet}</p>
          <h1 className="display xl">Your collection</h1>
        </div>
        {collected.length > 0 && <button className="round glass" onClick={onShare} aria-label="Share my collection"><ShareNetwork size={20} /></button>}
      </header>

      <div className="bigstats">
        <div className="bigstat main"><b>{state.spotsVisited}</b><span>{state.spotsVisited === 1 ? 'spot collected' : 'spots collected'}</span></div>
        <div className="bigstat"><b>{state.dishes.length}</b><span>dishes</span></div>
        <div className="bigstat"><b>{state.seenOn}</b><span>from reels</span></div>
        <div className="bigstat"><Fire size={18} weight="fill" className="flame" /><b>{state.streak}</b><span>week streak</span></div>
      </div>

      <div className="seg glass" role="tablist">
        {(['spots', 'trails', 'badges'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{v === 'spots' ? 'Spots' : v === 'trails' ? 'Trails' : `Badges ${earned}/${state.badges.length}`}</button>
        ))}
      </div>

      {view === 'spots' && (collected.length ? (
        <div className="grid">
          {collected.map((vm) => (
            <button key={vm.spot.id} className="gtile" onClick={() => onOpen(vm)}>
              <SpotImage src={vm.image} k={vm.sticker} className="gtile-img" />
              <span className="gtile-no">No. {vm.number}</span>
              <span className="gtile-text"><b>{vm.spot.name}</b><small>{stickerMeta(vm.sticker).label}</small></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-block">
          <div className="empty-tiles" aria-hidden="true">
            {(['icecream', 'momo', 'coffee'] as StickerKey[]).map((k, i) => <FoodTile key={k} k={k} size={56} className={`t${i}`} />)}
          </div>
          <p>Every place you eat shows up here. Tap the plus button after your next meal.</p>
        </div>
      ))}

      {view === 'trails' && (
        <div className="cards">
          {[...state.trails].sort((a, b) => Number(a.done) - Number(b.done) || b.got / b.goal - a.got / a.goal).map((t) => (
            <div key={t.id} className={`tcard${t.kind === 'creator' ? ' is-creator' : ''}${t.done ? ' is-done' : ''}`}>
              <div className="tcard-head">
                <span className="tcard-icon">{t.kind === 'creator' ? <Play size={16} weight="fill" /> : <Path size={18} />}</span>
                <b>{t.title}</b>
                <span className="tcard-count">{t.got}<small>/{t.goal}</small></span>
              </div>
              <p>{t.blurb}</p>
              <span className="meter"><i style={{ width: `${(t.got / Math.max(1, t.goal)) * 100}%` }} /></span>
            </div>
          ))}
        </div>
      )}

      {view === 'badges' && (
        <>
          {nextBadge && <p className="next-badge"><Medal size={18} /> Next up: <b>{nextBadge.title}</b>, {nextBadge.desc.toLowerCase()}.</p>}
          <div className="badges">
            {state.badges.map((b) => (
              <div key={b.id} className={`badge${b.earned ? ' on' : ''}`}>
                <span className="badge-medal"><Medal size={22} weight={b.earned ? 'fill' : 'regular'} /></span>
                <b>{b.title}</b>
                <small>{b.desc}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────── Diary (timeline) ───────── */

export function DiaryPage({ checkins, vmOf, onOpen }: { checkins: CheckIn[]; vmOf(id: string): SpotVM | undefined; onOpen(vm: SpotVM): void }) {
  const list = [...checkins].sort((a, b) => b.createdAt - a.createdAt);
  const groups = new Map<string, CheckIn[]>();
  for (const c of list) {
    const k = new Date(c.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  return (
    <div className="page mist">
      <header className="page-head">
        <div>
          <p className="greet">{list.length} {list.length === 1 ? 'meal' : 'meals'} logged</p>
          <h1 className="display xl">Diary</h1>
        </div>
      </header>
      {!list.length && (
        <div className="empty-block">
          <div className="empty-tiles" aria-hidden="true"><FoodTile k="thali" size={56} className="t1" /></div>
          <p>Nothing logged yet. Only you can see your diary.</p>
        </div>
      )}
      {[...groups].map(([month, items]) => (
        <section key={month} className="month">
          <h2 className="section-title"><CalendarBlank size={18} /> {month}</h2>
          <ol className="timeline big">
            {items.map((c) => {
              const vm = vmOf(c.spotId);
              if (!vm) return null;
              return (
                <li key={c.id}>
                  <span className="tl-dot"><Heart size={11} weight="fill" /></span>
                  <button className="tl-card" onClick={() => onOpen(vm)}>
                    {c.photo ? <img className="tl-thumb" src={blobUrl(c.photo)} alt="" /> : <FoodTile k={vm.sticker} size={52} />}
                    <span className="tl-body">
                      <span className="tl-head"><b>{vm.spot.name}</b><time>{fmtDate(c.createdAt)}</time></span>
                      {c.dishes.length > 0 && <small>{c.dishes.join(', ')}</small>}
                      <small className="soft">{RATING_LABEL[c.rating]}{c.note ? `. “${c.note}”` : ''}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

