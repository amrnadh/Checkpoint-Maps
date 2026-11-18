import { useEffect, useMemo, useRef, useState } from 'react';
import { CHECKIN_RANGE_M, cellFor, distanceM, getPosition } from '../lib/geo';
import { fetchNearby } from '../lib/osm';
import { resizePhoto, blobUrl } from '../lib/image';
import { uid } from '../lib/db';
import { RATING_LABEL } from '../lib/game';
import { Icon } from './Icon';
import type { CheckIn as CheckInT, LatLng, Rating, Spot, SpotKind } from '../lib/types';

const KINDS: [SpotKind, string][] = [
  ['street', 'Street stall'],
  ['restaurant', 'Restaurant'],
  ['cafe', 'Café'],
  ['fast_food', 'Quick bites'],
  ['bakery', 'Bakery'],
  ['sweets', 'Sweets'],
];
const QUICK_TAGS = ['street', 'breakfast', 'late-night', 'cheap eats', 'must return'];

interface Props {
  knownSpots: Spot[];
  visited: Set<string>;
  mapCenter(): LatLng;
  onLocated(p: LatLng): void;
  onSave(spot: Spot, c: CheckInT): void;
  onClose(): void;
  presetSpot?: Spot | null;
}

type Where = { p: LatLng; accuracy: number | null; source: 'gps' | 'map' };

export function CheckIn({ knownSpots, visited, mapCenter, onLocated, onSave, onClose, presetSpot }: Props) {
  const [where, setWhere] = useState<Where | null>(null);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [osm, setOsm] = useState<Spot[] | null>(null);
  const [osmErr, setOsmErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [spot, setSpot] = useState<Spot | null>(presetSpot ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<SpotKind>('street');

  const [dishText, setDishText] = useState('');
  const [rating, setRating] = useState<Rating>(1);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<Blob | undefined>();
  const [busy, setBusy] = useState(false);
  const dishRef = useRef<HTMLInputElement>(null);

  const locate = (useMap = false) => {
    setLocErr(null);
    if (useMap) {
      const p = mapCenter();
      setWhere({ p, accuracy: null, source: 'map' });
      onLocated(p);
      return;
    }
    getPosition()
      .then((g) => {
        setWhere({ p: g, accuracy: g.accuracy, source: 'gps' });
        onLocated(g);
      })
      .catch((e: Error) => setLocErr(e.message));
  };

  useEffect(() => {
    if (!presetSpot) locate();
  }, []);

  useEffect(() => {
    if (!where) return;
    setOsm(null);
    setOsmErr(null);
    const ac = new AbortController();
    fetchNearby(where.p, 250, ac.signal)
      .then(setOsm)
      .catch((e) => {
        if (ac.signal.aborted) return;
        setOsm([]);
        setOsmErr(navigator.onLine ? (e as Error).message : 'Offline — add the spot yourself.');
      });
    return () => ac.abort();
  }, [where]);

  useEffect(() => {
    if (spot) setTimeout(() => dishRef.current?.focus(), 250);
  }, [spot]);

  const candidates = useMemo(() => {
    if (!where) return [];
    const known = knownSpots.filter((s) => distanceM(where.p, s) <= 250);
    const knownOsm = new Set(known.map((s) => s.osmId).filter(Boolean));
    const all = [...known, ...(osm ?? []).filter((s) => !knownOsm.has(s.osmId))];
    const q = query.trim().toLowerCase();
    return all
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({ s, d: distanceM(where.p, s), mine: visited.has(s.id), saved: !visited.has(s.id) && knownSpots.includes(s) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 25);
  }, [where, osm, knownSpots, visited, query]);

  const createSpot = () => {
    if (!where || !newName.trim()) return;
    const s: Spot = {
      id: `user:${uid()}`,
      name: newName.trim(),
      lat: where.p.lat,
      lng: where.p.lng,
      cell: cellFor(where.p),
      source: 'user',
      kind: newKind,
      cuisines: [],
      createdAt: Date.now(),
    };
    setSpot(s);
    if (newKind === 'street') setTags((t) => (t.includes('street') ? t : [...t, 'street']));
    setCreating(false);
  };

  const pickSpot = (s: Spot) => {
    setSpot(s);
    if (s.kind === 'street') setTags((t) => (t.includes('street') ? t : [...t, 'street']));
  };

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPhoto(await resizePhoto(f));
    } catch {
      setPhoto(f);
    }
  };

  const save = () => {
    if (!spot) return;
    setBusy(true);
    const dishes = dishText.split(',').map((d) => d.trim()).filter(Boolean);
    onSave(spot, {
      id: uid(),
      spotId: spot.id,
      dishes,
      photo,
      note: note.trim(),
      tags,
      rating,
      visibility: 'private',
      createdAt: Date.now(),
    });
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Check in">
      <button className="scrim" aria-label="Close" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <h2>{spot ? spot.name : 'I ate here'}</h2>
          <button className="icon-round" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>

        {!spot && (
          <>
            <div className="locline">
              {where ? (
                <span>
                  {where.source === 'gps' ? `Located to within ${Math.round(where.accuracy ?? 0)} m` : 'Using the centre of the map'}
                </span>
              ) : locErr ? (
                <span className="err">{locErr}</span>
              ) : (
                <span className="muted">Finding you…</span>
              )}
              <span className="row">
                {where?.source !== 'gps' && <button className="link" onClick={() => locate()}>Use GPS</button>}
                                <button className="link" onClick={() => locate(true)}>Use map centre</button>
              </span>
            </div>

            {where && !creating && (
              <>
                <input className="field" placeholder="Search nearby spots" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className="cands">
                  <button className="cand add" onClick={() => { setCreating(true); setNewName(query); }}>
                    <b><Icon name="plus" size={16} /> Add a spot that isn’t listed</b>
                    <small>Stalls and carts are often missing from maps. Add it here.</small>
                  </button>
                  {osm === null && <div className="muted pad">Looking up nearby food spots…</div>}
                  {osmErr && <div className="muted pad">{osmErr}</div>}
                  {candidates.map(({ s, d, mine, saved }) => (
                    <button key={s.id} className="cand" onClick={() => pickSpot(s)} disabled={d > CHECKIN_RANGE_M + 100}>
                      <b>{s.name}</b>
                      <small>
                        {Math.round(d)} m · {KINDS.find((k) => k[0] === s.kind)?.[1] ?? 'Food'}
                        {s.cuisines.length ? ` · ${s.cuisines.slice(0, 2).join(', ')}` : ''}
                        {mine ? ' · been here' : ''}
                        {saved ? ' · on your to-try list' : ''}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {creating && (
              <div className="form">
                <label>
                  Spot name
                  <input className="field" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Anna’s chai cart" />
                </label>
                <div className="chips">
                  {KINDS.map(([k, l]) => (
                    <button key={k} className="chip" aria-pressed={newKind === k} onClick={() => setNewKind(k)}>{l}</button>
                  ))}
                </div>
                <p className="muted small">Pinned where you’re standing. Only you can see it.</p>
                <div className="row">
                  <button className="btn secondary" onClick={() => setCreating(false)}>Back</button>
                  <button className="btn primary grow" disabled={!newName.trim()} onClick={createSpot}>Add spot</button>
                </div>
              </div>
            )}
          </>
        )}

        {spot && (
          <div className="form">
            <label className="photo">
              {photo ? <img src={blobUrl(photo)} alt="Your photo" /> : <span><Icon name="camera" /> Add photo</span>}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            <label>
              What did you eat?
              <input ref={dishRef} className="field" value={dishText} onChange={(e) => setDishText(e.target.value)} placeholder="Masala dosa, filter coffee" />
            </label>
            <div className="rating" role="radiogroup" aria-label="Rating">
              {RATING_LABEL.map((l, i) => (
                <button key={l} role="radio" aria-checked={rating === i} onClick={() => setRating(i as Rating)}>{l}</button>
              ))}
            </div>
            <div className="chips">
              {QUICK_TAGS.map((t) => (
                <button key={t} className="chip" aria-pressed={tags.includes(t)} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>
                  {t}
                </button>
              ))}
            </div>
            <textarea className="field" rows={2} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="row">
              {!presetSpot && <button className="btn secondary" onClick={() => setSpot(null)}>Change spot</button>}
              <button className="btn primary grow" onClick={save} disabled={busy}>Check in</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
