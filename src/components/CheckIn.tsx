import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle, Crosshair, MagnifyingGlass, NavigationArrow, Plus, SmileyMeh, Smiley, SmileyWink, X } from '@phosphor-icons/react';
import { CHECKIN_RANGE_M, cellFor, distanceM, getPosition } from '../lib/geo';
import { fetchNearby } from '../lib/osm';
import { resizePhoto, blobUrl } from '../lib/image';
import { uid } from '../lib/db';
import { stickerFor, type StickerKey } from '../lib/stickers';
import type { CheckIn as CheckInT, LatLng, Rating, Spot, SpotKind } from '../lib/types';
import { FoodTile } from './FoodIcon';
import { Modal } from './Modals';

const KINDS: [SpotKind, string, StickerKey][] = [
  ['street', 'Street stall', 'cart'], ['restaurant', 'Restaurant', 'thali'], ['cafe', 'Café', 'cafe'],
  ['fast_food', 'Quick bites', 'burger'], ['bakery', 'Bakery', 'bakery'], ['sweets', 'Sweets', 'icecream'],
];
const QUICK_TAGS = ['street', 'breakfast', 'late night', 'cheap eats', 'must return'];
const RATINGS: { r: Rating; label: string; hint: string; icon: typeof Smiley }[] = [
  { r: 0, label: 'Meh', hint: 'Once was enough', icon: SmileyMeh },
  { r: 1, label: 'Good', hint: 'Would eat again', icon: Smiley },
  { r: 2, label: 'Wow', hint: 'Tell everyone', icon: SmileyWink },
];

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
  const step = spot ? 2 : 1;

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
      .catch((e: Error) => setLocErr(`${e.message} Move the map to where you are and use the map centre.`));
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
        setOsmErr(navigator.onLine ? (e as Error).message : 'You’re offline, so add the spot yourself.');
      });
    return () => ac.abort();
  }, [where]);

  useEffect(() => {
    if (spot) setTimeout(() => dishRef.current?.focus({ preventScroll: true }), 350);
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

  const withStreetTag = (k: SpotKind) => k === 'street' && setTags((t) => (t.includes('street') ? t : [...t, 'street']));

  const createSpot = () => {
    if (!where || !newName.trim()) return;
    setSpot({ id: `user:${uid()}`, name: newName.trim(), lat: where.p.lat, lng: where.p.lng, cell: cellFor(where.p), source: 'user', kind: newKind, cuisines: [], createdAt: Date.now() });
    withStreetTag(newKind);
    setCreating(false);
  };

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPhoto(await resizePhoto(f));
    } catch {
      setPhoto(f);
    }
  };

  const dishes = dishText.split(',').map((d) => d.trim()).filter(Boolean);

  const save = () => {
    if (!spot) return;
    setBusy(true);
    onSave(spot, { id: uid(), spotId: spot.id, dishes, photo, note: note.trim(), tags, rating, visibility: 'private', createdAt: Date.now() });
  };

  return (
    <Modal label="Check in" onClose={onClose} className="checkin">
      <div className="modal-head">
        {step === 2 && !presetSpot ? (
          <button className="round soft" onClick={() => setSpot(null)} aria-label="Choose a different spot"><ArrowLeft size={18} /></button>
        ) : <span className="steps" aria-label={`Step ${step} of 2`}><i className="on" /><i className={step === 2 ? 'on' : ''} /></span>}
        <h2 className="display">{step === 1 ? (creating ? 'Add a spot' : 'Where did you eat?') : spot!.name}</h2>
        <button className="round soft" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>

      <div className="steps-viewport">
        <div className="steps-track" style={{ transform: `translateX(${step === 1 ? 0 : -50}%)` }}>
          {/* Step 1: choose or add the spot */}
          <section className="step" aria-hidden={step !== 1} {...(step !== 1 ? { inert: "" } : {})}>
            <div className="locline">
              {where ? (
                <span><NavigationArrow size={14} weight="fill" /> {where.source === 'gps' ? `Located to within ${Math.round(where.accuracy ?? 0)} m` : 'Using the centre of the map'}</span>
              ) : locErr ? <span className="bad">{locErr}</span> : <span className="pulse-text">Finding you…</span>}
              <span className="row">
                {where?.source !== 'gps' && <button className="link" onClick={() => locate()}>Use GPS</button>}
                <button className="link" onClick={() => locate(true)}><Crosshair size={14} /> Map centre</button>
              </span>
            </div>

            {where && !creating && (
              <>
                <label className="search solid">
                  <MagnifyingGlass size={18} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nearby" />
                </label>
                <div className="pick-list">
                  <button className="pick is-add" onClick={() => { setCreating(true); setNewName(query); }}>
                    <span className="pick-ic"><Plus size={18} weight="bold" /></span>
                    <span className="grow"><b>Add a spot that isn’t listed</b><small>Carts and stalls are often missing from maps</small></span>
                  </button>
                  {osm === null && [0, 1, 2].map((i) => <div key={i} className="pick skeleton" />)}
                  {osmErr && <p className="fine left">{osmErr}</p>}
                  {candidates.map(({ s, d, mine, saved }) => (
                    <button key={s.id} className="pick" onClick={() => { setSpot(s); withStreetTag(s.kind); }} disabled={d > CHECKIN_RANGE_M + 100}>
                      <FoodTile k={stickerFor(s)} size={40} radius={12} />
                      <span className="grow">
                        <b>{s.name}</b>
                        <small>{Math.round(d)} m{mine ? ', you’ve been here' : saved ? ', on your list' : s.cuisines.length ? `, ${s.cuisines.slice(0, 2).join(', ')}` : ''}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {creating && (
              <div className="form">
                <label className="field-wrap">
                  <span>Spot name</span>
                  <input className="field" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Anna’s chai cart" />
                </label>
                <div className="kind-grid">
                  {KINDS.map(([k, l, st]) => (
                    <button key={k} className="kind" aria-pressed={newKind === k} onClick={() => setNewKind(k)}>
                      <FoodTile k={st} size={34} radius={10} /><span>{l}</span>
                    </button>
                  ))}
                </div>
                <p className="fine left">It’s pinned where you’re standing, and only you can see it.</p>
                <div className="dock static">
                  <button className="pill outline" onClick={() => setCreating(false)}>Back</button>
                  <button className="pill dark grow" disabled={!newName.trim()} onClick={createSpot}>Add spot</button>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: what you ate */}
          <section className="step" aria-hidden={step !== 2} {...(step !== 2 ? { inert: "" } : {})}>
            <div className="form">
              <label className={`photo-drop${photo ? ' has' : ''}`}>
                {photo ? <img src={blobUrl(photo)} alt="Your photo" /> : <span><Camera size={26} /> Add a photo of your plate</span>}
                <input type="file" accept="image/*" capture="environment" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
              <label className="field-wrap">
                <span>What did you eat?</span>
                <input ref={dishRef} className="field" value={dishText} onChange={(e) => setDishText(e.target.value)} placeholder="Masala dosa, filter coffee" />
                {dishes.length > 0 && <span className="dish-chips">{dishes.map((d) => <span key={d}>{d}</span>)}</span>}
              </label>
              <div className="rate-cards" role="radiogroup" aria-label="How was it?">
                {RATINGS.map(({ r, label, hint, icon: I }) => (
                  <button key={r} role="radio" aria-checked={rating === r} className="rate" onClick={() => setRating(r)}>
                    <I size={26} weight={rating === r ? 'fill' : 'regular'} />
                    <b>{label}</b>
                    <small>{hint}</small>
                  </button>
                ))}
              </div>
              <div className="tag-row">
                {QUICK_TAGS.map((t) => (
                  <button key={t} className="tchip" aria-pressed={tags.includes(t)} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>{t}</button>
                ))}
              </div>
              <textarea className="field" rows={2} placeholder="A note for future you (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="pill dark block lg" onClick={save} disabled={busy}><CheckCircle size={20} weight="fill" /> Check in</button>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
