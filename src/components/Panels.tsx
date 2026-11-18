import { useEffect, useState } from 'react';
import { RATING_LABEL, type GameState, type RewardDiff, type TrailProgress } from '../lib/game';
import { blobUrl } from '../lib/image';
import { stickerMeta, stickerSvg, tiltFor, type StickerKey } from '../lib/stickers';
import { embedUrl, normHandle, parseVideoUrl, platformLabel, thumbUrl, type ParsedVideo } from '../lib/video';
import type { CheckIn, Spot, SpotKind, Video } from '../lib/types';
import { Icon } from './Icon';

const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fmtKm = (m: number) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
const initial = (h: string) => h.replace(/^@/, '').charAt(0).toUpperCase() || '?';

/* ───────── Sticker ───────── */

export function Sticker({ k, size = 56, ghost = false, tiltId }: { k: StickerKey; size?: number; ghost?: boolean; tiltId?: string }) {
  return (
    <span
      className={`sticker${ghost ? ' is-ghost' : ''}`}
      style={{ width: size, height: size, background: stickerMeta(k).tint, transform: tiltId ? `rotate(${tiltFor(tiltId)}deg)` : undefined }}
      dangerouslySetInnerHTML={{ __html: stickerSvg(k) }}
    />
  );
}

function Bar({ got, goal, from }: { got: number; goal: number; from?: number }) {
  const [w, setW] = useState(from ?? got);
  useEffect(() => {
    const t = setTimeout(() => setW(got), 200);
    return () => clearTimeout(t);
  }, [got]);
  return <span className="bar"><i style={{ width: `${(w / Math.max(goal, 1)) * 100}%` }} /></span>;
}

/* ───────── Explore ───────── */

export interface ToTry { spot: Spot; sticker: StickerKey; creators: string[]; distance: number | null }

export function ExploreView({ toTry, creatorTrails, onOpen, onAdd }: {
  toTry: ToTry[]; creatorTrails: TrailProgress[]; onOpen(s: Spot): void; onAdd(): void;
}) {
  return (
    <div className="view">
      <h2 className="v-title">Worth the trip</h2>
      <p className="v-sub">Spots from creators’ videos you haven’t eaten at yet.</p>
      {toTry.length ? (
        <ul className="group">
          {toTry.map(({ spot, sticker, creators, distance }) => (
            <li key={spot.id}>
              <button className="row-btn" onClick={() => onOpen(spot)}>
                <Sticker k={sticker} size={44} ghost />
                <span className="row-main">
                  <b>{spot.name}</b>
                  <small>{[creators.join(', '), distance != null ? fmtKm(distance) : ''].filter(Boolean).join(', ')}</small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <p>Seen a place in a reel? Add the video and the spot appears on your map.</p>
        </div>
      )}
      <button className="btn secondary block" onClick={onAdd}><Icon name="link" size={18} /> Add a creator’s video</button>

      {creatorTrails.length > 0 && (
        <>
          <h3 className="g-title">Creator trails</h3>
          <ul className="group">
            {creatorTrails.map((t) => (
              <li key={t.id} className="row-static">
                <span className="avatar">{initial(t.creator ?? '')}</span>
                <span className="row-main">
                  <b>{t.creator}</b>
                  <small>{t.done ? 'Every spot eaten' : `${t.got} of ${t.goal} spots eaten`}</small>
                  <Bar got={t.got} goal={t.goal} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ───────── Collection (sticker book) ───────── */

export function CollectionView({ state, spots, stickerOf, onOpen, onShare }: {
  state: GameState; spots: Map<string, Spot>; stickerOf(id: string): StickerKey; onOpen(s: Spot): void; onShare(): void;
}) {
  const food = state.trails.filter((t) => t.kind === 'food').sort((a, b) => b.got / b.goal - a.got / a.goal);
  const earned = state.badges.filter((b) => b.earned);
  return (
    <div className="view">
      <div className="v-head">
        <div>
          <h2 className="v-title">{state.spotsVisited ? `${state.spotsVisited} ${state.spotsVisited === 1 ? 'spot' : 'spots'} collected` : 'Your collection'}</h2>
          <p className="v-sub">{state.spotsVisited ? `${state.dishes.length} dishes tried, ${state.seenOn} from creators’ videos.` : 'Every place you eat becomes a sticker here.'}</p>
        </div>
        {state.spotsVisited > 0 && <button className="icon-round" onClick={onShare} aria-label="Share my collection"><Icon name="share" size={18} /></button>}
      </div>

      {state.collected.length ? (
        <div className="book">
          {state.collected.map((c, i) => {
            const s = spots.get(c.spotId);
            if (!s) return null;
            return (
              <button key={c.spotId} className="book-item" onClick={() => onOpen(s)}>
                <Sticker k={stickerOf(s.id)} size={72} tiltId={s.id} />
                <b>{s.name}</b>
                <small>No. {i + 1}, {fmtDate(c.first)}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="book is-empty" aria-hidden="true">
          {(['dosa', 'biryani', 'chai'] as StickerKey[]).map((k) => <div key={k} className="book-item"><Sticker k={k} size={72} ghost /></div>)}
        </div>
      )}

      <h3 className="g-title">Food trails</h3>
      <ul className="group">
        {food.map((t) => (
          <li key={t.id} className="row-static">
            <span className="row-main">
              <span className="row-line"><b>{t.title}</b><small>{t.got} of {t.goal}</small></span>
              <small>{t.blurb}</small>
              <Bar got={t.got} goal={t.goal} />
            </span>
          </li>
        ))}
      </ul>

      {state.dishes.length > 0 && (
        <>
          <h3 className="g-title">Dishes tried</h3>
          <div className="pills">{state.dishes.map((d) => <span key={d.name} className="pill">{d.name}{d.count > 1 ? ` ×${d.count}` : ''}</span>)}</div>
        </>
      )}

      <h3 className="g-title">Badges</h3>
      <ul className="group">
        {state.badges.map((b) => (
          <li key={b.id} className={`row-static${b.earned ? '' : ' is-locked'}`}>
            <span className={`medal${b.earned ? ' on' : ''}`}><Icon name="star" fill size={16} /></span>
            <span className="row-main"><b>{b.title}</b><small>{b.desc}</small></span>
          </li>
        ))}
      </ul>
      <p className="v-foot">{earned.length} of {state.badges.length} badges earned.</p>
    </div>
  );
}

/* ───────── Diary ───────── */

export function DiaryView({ checkins, spots, stickerOf, onOpen }: { checkins: CheckIn[]; spots: Map<string, Spot>; stickerOf(id: string): StickerKey; onOpen(s: Spot): void }) {
  const list = [...checkins].sort((a, b) => b.createdAt - a.createdAt);
  const groups = new Map<string, CheckIn[]>();
  for (const c of list) {
    const k = new Date(c.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  return (
    <div className="view">
      <h2 className="v-title">Diary</h2>
      <p className="v-sub">Every meal you’ve logged. Only you can see this.</p>
      {!list.length && <div className="empty"><p>Nothing yet. Tap <b>I ate here</b> after your next meal.</p></div>}
      {[...groups].map(([month, items]) => (
        <section key={month}>
          <h3 className="g-title">{month}</h3>
          <ul className="group">
            {items.map((c) => {
              const s = spots.get(c.spotId);
              if (!s) return null;
              return (
                <li key={c.id}>
                  <button className="row-btn" onClick={() => onOpen(s)}>
                    {c.photo ? <img className="row-photo" src={blobUrl(c.photo)} alt="" /> : <Sticker k={stickerOf(s.id)} size={44} />}
                    <span className="row-main">
                      <b>{s.name}</b>
                      <small>{[c.dishes.join(', '), `${fmtDate(c.createdAt)}, ${RATING_LABEL[c.rating]}`].filter(Boolean).join('\n')}</small>
                      {c.note && <small className="note">“{c.note}”</small>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ───────── Spot detail (replaces sheet content, like Apple Maps) ───────── */

export function SpotDetail({ spot, sticker, number, visits, videos, distance, onBack, onCheckIn, onPlay }: {
  spot: Spot; sticker: StickerKey; number: number | null; visits: CheckIn[]; videos: Video[]; distance: number | null;
  onBack(): void; onCheckIn(): void; onPlay(v: Video): void;
}) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat.toFixed(6)},${spot.lng.toFixed(6)}`;
  const collected = visits.length > 0;
  return (
    <div className="view">
      <div className="detail-head">
        <Sticker k={sticker} size={68} ghost={!collected} tiltId={spot.id} />
        <div className="grow">
          <h2 className="v-title">{spot.name}</h2>
          <p className="v-sub">
            {collected ? `No. ${number} in your collection` : videos.length ? 'On your list to try' : 'Not eaten here yet'}
            {distance != null ? `, ${fmtKm(distance)} away` : ''}
          </p>
        </div>
        <button className="icon-round" onClick={onBack} aria-label="Close"><Icon name="close" size={16} /></button>
      </div>
      <div className="actions">
        <button className="btn primary grow" onClick={onCheckIn}>{collected ? 'Check in again' : 'I ate here'}</button>
        <a className="btn secondary" href={directions} target="_blank" rel="noreferrer"><Icon name="route" size={18} /> Directions</a>
      </div>

      {videos.length > 0 && (
        <>
          <h3 className="g-title">Seen in</h3>
          <ul className="group">
            {videos.map((v) => {
              const th = thumbUrl(v);
              return (
                <li key={v.id}>
                  <button className="row-btn" onClick={() => onPlay(v)}>
                    <span className="vthumb">{th ? <img src={th} alt="" /> : <span className="avatar">{initial(v.creator)}</span>}<span className="vplay"><Icon name="play" fill size={12} /></span></span>
                    <span className="row-main"><b>{v.title || 'Watch the video'}</b><small>{v.creator}, {platformLabel(v)}</small></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {collected && (
        <>
          <h3 className="g-title">Your visits</h3>
          <ul className="group">
            {[...visits].reverse().map((c) => (
              <li key={c.id} className="row-static">
                {c.photo ? <img className="row-photo" src={blobUrl(c.photo)} alt="" /> : null}
                <span className="row-main">
                  <b>{c.dishes.length ? c.dishes.join(', ') : 'Visit'}</b>
                  <small>{fmtDate(c.createdAt)}, {RATING_LABEL[c.rating]}</small>
                  {c.note && <small className="note">“{c.note}”</small>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {spot.id.startsWith('demo:') && <p className="v-foot">This is a demo spot. Remove it from the menu.</p>}
    </div>
  );
}

/* ───────── Reward moment ───────── */

export function Reward({ diff, spot, sticker, videos, onShare, onClose }: {
  diff: RewardDiff; spot: Spot; sticker: StickerKey; videos: Video[]; onShare(): void; onClose(): void;
}) {
  const creators = [...new Set(videos.map((v) => v.creator))];
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Checked in">
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <div className="modal reward">
        <div className="reward-hero">
          <span className="reward-sticker"><Sticker k={sticker} size={128} tiltId={spot.id} /></span>
          <h2>{spot.name}</h2>
          <p>{diff.number ? `No. ${diff.number} in your collection` : 'Another visit, saved to your diary'}</p>
        </div>

        {creators.length > 0 && diff.newSpot && (
          <p className="callout">You found it. This spot is in {videos.length === 1 ? 'a video' : `${videos.length} videos`} by {creators.join(' and ')}.</p>
        )}

        {diff.collectionMoves.length > 0 && (
          <ul className="group">
            {diff.collectionMoves.map((m) => (
              <li key={m.title} className="row-static">
                <span className="row-main">
                  <span className="row-line"><b>{m.title}</b><small>{m.done ? 'Complete' : `${m.after} of ${m.goal}`}</small></span>
                  <Bar got={m.after} goal={m.goal} from={m.before} />
                </span>
              </li>
            ))}
          </ul>
        )}

        {(diff.newDishes.length > 0 || diff.newBadges.length > 0) && (
          <div className="pills">
            {diff.newBadges.map((b) => <span key={b.id} className="pill is-gold"><Icon name="star" fill size={13} /> {b.title}</span>)}
            {diff.newDishes.map((d) => <span key={d} className="pill">New: {d}</span>)}
          </div>
        )}

        <p className="v-foot">
          {diff.streakExtended ? `A new spot this week. ${diff.streak}-week streak.` : diff.streak ? `${diff.streak}-week streak.` : ''}
        </p>

        <div className="actions">
          <button className="btn secondary" onClick={onClose}>Done</button>
          <button className="btn primary grow" onClick={onShare}><Icon name="share" size={18} /> Share sticker</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Video player ───────── */

export function VideoSheet({ video, spot, collected, onClose, onShowOnMap }: { video: Video; spot?: Spot; collected: boolean; onClose(): void; onShowOnMap(): void }) {
  const src = embedUrl(video);
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Video">
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <div className="modal">
        <div className={`player ${video.vertical ? 'tall' : 'wide'}`}>
          {src ? (
            <iframe src={src} title={video.title || 'Creator video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <div className="player-demo"><div><b>Demo video</b><span>Real YouTube and Instagram links play here.</span></div></div>
          )}
        </div>
        <div className="detail-head">
          <span className="avatar">{initial(video.creator)}</span>
          <div className="grow">
            <b className="d-name">{spot?.name}</b>
            <p className="v-sub">{video.creator}, {platformLabel(video)}{collected ? '. You’ve eaten here.' : ''}</p>
          </div>
        </div>
        {video.title && <p className="body-copy">{video.title}</p>}
        <div className="actions">
          {video.url && <a className="btn secondary" href={video.url} target="_blank" rel="noreferrer">Open in {video.platform === 'youtube' ? 'YouTube' : 'Instagram'}</a>}
          <button className="btn primary grow" onClick={onShowOnMap}><Icon name="pin" size={18} /> Show on map</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Add a creator video ───────── */

export interface VideoDraft { parsed: ParsedVideo; creator: string; title: string }

const KINDS: [SpotKind, string][] = [['street', 'Street stall'], ['restaurant', 'Restaurant'], ['cafe', 'Café'], ['fast_food', 'Quick bites'], ['bakery', 'Bakery'], ['sweets', 'Sweets']];

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
  const matches = q.length > 1 ? spots.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const ready = !!parsed && !!handle;
  const draft = (): VideoDraft => ({ parsed: parsed!, creator: handle, title: title.trim() });

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Add a creator’s video">
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <h2>Add a creator’s video</h2>
          <button className="icon-round" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        <div className="form">
          <label>
            Video link
            <input className="field" inputMode="url" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube or Instagram link" />
            {url && <span className={`hint${parsed ? ' ok' : ' bad'}`}>{parsed ? `${parsed.platform === 'youtube' ? (parsed.vertical ? 'YouTube Short' : 'YouTube video') : 'Instagram post'} found` : 'This isn’t a YouTube or Instagram video link.'}</span>}
          </label>
          <label>
            Creator
            <input className="field" value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="@handle" autoCapitalize="none" />
          </label>
          <label>
            What they said about it <span className="optional">(optional)</span>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best ghee roast in town" />
          </label>
          <label>
            Which place is in the video?
            <input className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Spot name" />
          </label>
          {matches.length > 0 && (
            <ul className="group">
              {matches.map((s) => (
                <li key={s.id}>
                  <button className="row-btn" disabled={!ready} onClick={() => onExisting(draft(), s)}>
                    <span className="row-main"><b>{s.name}</b><small>Already on your map</small></span>
                    <Icon name="chevron" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {place.trim() && (
            <>
              <div className="chips">
                {KINDS.map(([k, l]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
              </div>
              <button className="btn primary block" disabled={!ready} onClick={() => onPickNew(draft(), place.trim(), kind)}>
                <Icon name="pin" size={18} /> Place it on the map
              </button>
            </>
          )}
          {!ready && <p className="v-foot">Add the video link and the creator’s handle to continue.</p>}
        </div>
      </div>
    </div>
  );
}

/* ───────── First run ───────── */

export function Onboarding({ busy, error, onGps, onMapCentre }: { busy: boolean; error: string | null; onGps(): void; onMapCentre(): void }) {
  return (
    <div className="onboard">
      <div className="onboard-stickers" aria-hidden="true">
        {(['dosa', 'chai', 'biryani', 'momo', 'icecream'] as StickerKey[]).map((k, i) => (
          <span key={k} style={{ transform: `rotate(${[-8, 5, -3, 7, -6][i]}deg)` }}><Sticker k={k} size={64} /></span>
        ))}
      </div>
      <h1>Eat at the spots everyone talks about.</h1>
      <p>Pin the places you see in food creators’ videos, go eat there, and collect a sticker for every one.</p>
      {error && <p className="error">{error}</p>}
      <button className="btn primary block" onClick={onGps} disabled={busy}><Icon name="locate" size={18} /> {busy ? 'Finding you…' : 'Start near me'}</button>
      <button className="btn secondary block" onClick={onMapCentre} disabled={busy}>Use the city on the map</button>
      <p className="v-foot">Your location stays on this phone.</p>
    </div>
  );
}
