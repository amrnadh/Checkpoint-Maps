import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapView, type MapHandle, type MapSpot } from './components/MapView';
import { CheckIn } from './components/CheckIn';
import { Icon } from './components/Icon';
import { Sheet, type Detent } from './components/Sheet';
import {
  AddVideo, CollectionView, DiaryView, ExploreView, Onboarding, Reward, SpotDetail, Sticker, VideoSheet, type ToTry, type VideoDraft,
} from './components/Panels';
import { deleteVideos, loadAll, resetAll, saveCheckIn, saveHome, saveVideos, uid } from './lib/db';
import { cellFor, distanceM, getPosition } from './lib/geo';
import { computeState, diffState, type RewardDiff } from './lib/game';
import { drawShareCard, shareOrDownload, type ShareInput } from './lib/share';
import { stickerFor, type StickerKey } from './lib/stickers';
import type { CheckIn as CheckInT, Home, LatLng, Spot, SpotKind, Video } from './lib/types';

type View = 'explore' | 'collection' | 'diary';
const VIEWS: [View, string][] = [['explore', 'Explore'], ['collection', 'Collection'], ['diary', 'Diary']];

/** A clearly labelled sample creator trail around home, so the creator layer can be tried before real links exist. */
function demoTrail(home: Home): { spots: Spot[]; videos: Video[] } {
  const items: [string, SpotKind, number, number, string][] = [
    ['Demo Ghee Roast Corner', 'restaurant', 0.9, 40, 'The crispiest dosa I’ve had this year'],
    ['Demo Midnight Momo Cart', 'street', 1.6, 150, 'Momos at 1 am. Worth it?'],
    ['Demo Old Lane Biryani', 'restaurant', 2.4, 250, 'Biryani hunt, part 3'],
    ['Demo Rose Falooda Stall', 'sweets', 1.2, 300, 'Coolest dessert in the heat'],
    ['Demo Corner Chai', 'street', 0.5, 200, 'Two rupees of happiness'],
  ];
  const spots: Spot[] = [];
  const videos: Video[] = [];
  for (const [name, kind, km, deg, title] of items) {
    const r = (deg * Math.PI) / 180;
    const p = { lat: home.lat + (km / 110.574) * Math.sin(r), lng: home.lng + (km / (111.32 * Math.cos((home.lat * Math.PI) / 180))) * Math.cos(r) };
    const s: Spot = { id: `demo:${uid()}`, name, ...p, cell: cellFor(p), source: 'user', kind, cuisines: [], createdAt: Date.now() };
    spots.push(s);
    videos.push({ id: uid(), url: '', platform: 'demo', embedId: '', vertical: true, title, creator: '@demo_foodie', spotId: s.id, createdAt: Date.now(), demo: true });
  }
  return { spots, videos };
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [home, setHome] = useState<Home | null>(null);
  const [spotList, setSpotList] = useState<Spot[]>([]);
  const [checkins, setCheckins] = useState<CheckInT[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [view, setView] = useState<View>('explore');
  const [detent, setDetent] = useState<Detent>('peek');
  const [me, setMe] = useState<LatLng | null>(null);
  const [checkingIn, setCheckingIn] = useState<{ preset: Spot | null } | null>(null);
  const [reward, setReward] = useState<{ diff: RewardDiff; spot: Spot; checkin: CheckInT } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [share, setShare] = useState<{ url: string; blob: Blob } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [onboardErr, setOnboardErr] = useState<string | null>(null);
  const [addingVideo, setAddingVideo] = useState(false);
  const [picking, setPicking] = useState<{ draft: VideoDraft; name: string; kind: SpotKind } | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [bearing, setBearing] = useState(-17);
  const [menuOpen, setMenuOpen] = useState(false);
  const mapRef = useRef<MapHandle>(null);

  useEffect(() => {
    loadAll().then(({ spots, checkins, home, videos }) => {
      setSpotList(spots);
      setCheckins(checkins);
      setHome(home);
      setVideos(videos);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(t);
  }, [toast]);

  const spots = useMemo(() => new Map(spotList.map((s) => [s.id, s])), [spotList]);
  const state = useMemo(() => computeState(home, spots, checkins, videos), [home, spots, checkins, videos]);
  const dishesBySpot = useMemo(() => new Map(state.collected.map((c) => [c.spotId, c.dishes])), [state]);
  const stickerOf = useCallback(
    (id: string): StickerKey => {
      const s = spots.get(id);
      return s ? stickerFor(s, dishesBySpot.get(id) ?? []) : 'thali';
    },
    [spots, dishesBySpot],
  );
  const numberOf = (id: string) => {
    const i = state.collected.findIndex((c) => c.spotId === id);
    return i < 0 ? null : i + 1;
  };
  const origin: LatLng | null = me ?? home;

  const mapSpots = useMemo<MapSpot[]>(() => {
    const n = new Map<string, number>();
    for (const c of checkins) n.set(c.spotId, (n.get(c.spotId) ?? 0) + 1);
    const vc = new Map<string, number>();
    for (const v of videos) vc.set(v.spotId, (vc.get(v.spotId) ?? 0) + 1);
    return spotList
      .filter((s) => n.has(s.id) || vc.has(s.id))
      .map((s) => ({ ...s, visits: n.get(s.id) ?? 0, videos: vc.get(s.id) ?? 0, state: n.has(s.id) ? 'collected' : 'totry', sticker: stickerOf(s.id) }));
  }, [spotList, checkins, videos, stickerOf]);

  const toTry = useMemo<ToTry[]>(() => {
    return mapSpots
      .filter((s) => s.state === 'totry')
      .map((s) => ({
        spot: spots.get(s.id)!,
        sticker: s.sticker,
        creators: [...new Set(videos.filter((v) => v.spotId === s.id).map((v) => v.creator))],
        distance: origin ? distanceM(origin, s) : null,
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [mapSpots, spots, videos, origin]);

  const setHomeAt = async (p: LatLng) => {
    const h: Home = { lat: p.lat, lng: p.lng, radiusKm: 6, setAt: Date.now() };
    await saveHome(h);
    setHome(h);
  };

  const onboardGps = () => {
    setOnboardBusy(true);
    setOnboardErr(null);
    getPosition()
      .then((p) => {
        setMe(p);
        return setHomeAt(p);
      })
      .catch((e: Error) => setOnboardErr(`${e.message} Move the map to your city, then choose “Use the city on the map”.`))
      .finally(() => setOnboardBusy(false));
  };

  const openSpot = (s: Spot) => {
    setSelected(s.id);
    setDetent('half');
    mapRef.current?.flyTo(s, 16.2);
  };

  const onSave = async (spot: Spot, c: CheckInT) => {
    const before = state;
    const nextSpots = new Map(spots).set(spot.id, spot);
    const nextCheckins = [...checkins, c];
    const after = computeState(home, nextSpots, nextCheckins, videos);
    try {
      await saveCheckIn(spot, c);
    } catch {
      setToast('Couldn’t save the check-in. Free up storage on this phone and try again.');
      return;
    }
    setSpotList([...nextSpots.values()]);
    setCheckins(nextCheckins);
    setCheckingIn(null);
    setSelected(null);
    setDetent('peek');
    const diff = diffState(before, after, spot);
    setTimeout(() => mapRef.current?.celebrate(spot.id, spot), 60);
    setTimeout(() => setReward({ diff, spot, checkin: c }), 2700);
  };

  const addVideo = async (draft: VideoDraft, spot: Spot, isNew: boolean) => {
    const v: Video = {
      id: uid(), url: draft.parsed.url, platform: draft.parsed.platform, embedId: draft.parsed.embedId, vertical: draft.parsed.vertical,
      title: draft.title, creator: draft.creator, spotId: spot.id, createdAt: Date.now(),
    };
    await saveVideos(isNew ? [spot] : [], [v]);
    if (isNew) setSpotList((l) => [...l, spot]);
    setVideos((l) => [...l, v]);
    setAddingVideo(false);
    setPicking(null);
    openSpot(spot);
    setToast(`Added. ${spot.name} is on your map to try.`);
  };

  const placeHere = () => {
    if (!picking) return;
    const p = mapRef.current!.center();
    const s: Spot = { id: `user:${uid()}`, name: picking.name, ...p, cell: cellFor(p), source: 'user', kind: picking.kind, cuisines: [], createdAt: Date.now() };
    addVideo(picking.draft, s, true);
  };

  const loadDemo = async () => {
    setMenuOpen(false);
    if (!home) return;
    if (videos.some((v) => v.demo)) return setToast('The demo spots are already on your map.');
    const d = demoTrail(home);
    await saveVideos(d.spots, d.videos);
    setSpotList((l) => [...l, ...d.spots]);
    setVideos((l) => [...l, ...d.videos]);
    setView('explore');
    setDetent('half');
    setToast('Added 5 demo spots from @demo_foodie.');
  };

  const removeDemo = async () => {
    setMenuOpen(false);
    await deleteVideos(videos.filter((v) => v.demo).map((v) => v.id));
    setVideos((l) => l.filter((v) => !v.demo));
    setSelected(null);
    setToast('Removed the demo spots.');
  };

  const openShare = useCallback(
    async (input: Omit<ShareInput, 'state'>) => {
      try {
        const blob = await drawShareCard({ ...input, state });
        setShare({ blob, url: URL.createObjectURL(blob) });
      } catch {
        setToast('Couldn’t draw the share image. Try again.');
      }
    },
    [state],
  );

  const closeShare = () => {
    if (share) URL.revokeObjectURL(share.url);
    setShare(null);
  };

  const sel = selected ? spots.get(selected) : null;

  if (!loaded) return <div className="boot" />;

  const sheetHeader = sel ? null : (
    <div className="sheet-top">
      <button className="btn primary block big" onClick={() => setCheckingIn({ preset: null })}>
        <Icon name="plus" size={20} /> I ate here
      </button>
      <div className="seg" role="tablist" aria-label="Sections">
        {VIEWS.map(([v, label]) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); if (detent === 'peek') setDetent('half'); }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app">
      <MapView
        ref={mapRef}
        home={home}
        spots={mapSpots}
        selected={selected}
        me={me}
        onSpot={(id) => { const s = spots.get(id); if (s) openSpot(s); }}
        onCamera={(b, p) => { setBearing(b); setIs3D(p > 15); }}
      />

      {picking && (
        <>
          <svg className="crosshair" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.2-7-11.5A7 7 0 0 1 19 10.5C19 15.8 12 22 12 22Z" fill="#E0452B" stroke="#fff" strokeWidth="1.5" /><circle cx="12" cy="10" r="2.6" fill="#fff" /></svg>
          <div className="pickbar">
            <p>Move the map until the pin sits on <b>{picking.name}</b>.</p>
            <div className="actions">
              <button className="btn secondary" onClick={() => { setPicking(null); setAddingVideo(true); }}>Back</button>
              <button className="btn primary grow" onClick={placeHere}>Place it here</button>
            </div>
          </div>
        </>
      )}

      {home && !picking && (
        <>
          <button className="count-chip" onClick={() => { setSelected(null); setView('collection'); setDetent('half'); }}>
            <span className="count-stack" aria-hidden="true">
              {(state.collected.length ? state.collected.slice(-3).map((c) => ({ id: c.spotId, k: stickerOf(c.spotId) })) : [{ id: 'empty', k: 'thali' as StickerKey }]).map(({ id, k }) => (
                <Sticker key={id} k={k} size={26} ghost={!state.collected.length} />
              ))}
            </span>
            <b>{state.spotsVisited}</b> collected
            {toTry.length > 0 && <span className="count-try">{toTry.length} to try</span>}
          </button>

          <div className="controls">
            <div className="ctl-group">
              <button aria-label="Show my location" onClick={() => getPosition().then((p) => { setMe(p); mapRef.current?.flyTo(p, 15.5); }).catch((e: Error) => setToast(e.message))}>
                <Icon name="locate" />
              </button>
              <button aria-label={is3D ? 'Switch to 2D map' : 'Switch to 3D map'} onClick={() => mapRef.current?.set3D(!is3D)} className="ctl-text">
                {is3D ? '2D' : '3D'}
              </button>
              {Math.abs(bearing) > 2 && (
                <button aria-label="Point the map north" onClick={() => mapRef.current?.resetNorth()}>
                  <span style={{ display: 'grid', transform: `rotate(${-bearing}deg)` }}><Icon name="compass" fill /></span>
                </button>
              )}
            </div>
            <div className="ctl-group">
              <button aria-label="More options" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}><Icon name="more" /></button>
            </div>
            {menuOpen && (
              <div className="menu">
                <button onClick={() => { setMenuOpen(false); setAddingVideo(true); }}>Add a creator’s video</button>
                {videos.some((v) => v.demo)
                  ? <button onClick={removeDemo}>Remove demo spots</button>
                  : <button onClick={loadDemo}>Add demo spots</button>}
                <button onClick={() => { setMenuOpen(false); const c = mapRef.current?.center(); if (c) setHomeAt(c).then(() => setToast('Your city is now centred here.')); }}>
                  Set my city to this area
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    setMenuOpen(false);
                    if (confirm('Delete every check-in, spot, video and your city from this phone? This can’t be undone.')) {
                      await resetAll();
                      location.reload();
                    }
                  }}
                >
                  Delete all my data
                </button>
              </div>
            )}
          </div>

          <Sheet detent={detent} onDetent={setDetent} header={sheetHeader}>
            {sel ? (
              <SpotDetail
                spot={sel}
                sticker={stickerOf(sel.id)}
                number={numberOf(sel.id)}
                visits={checkins.filter((c) => c.spotId === sel.id)}
                videos={videos.filter((v) => v.spotId === sel.id)}
                distance={origin ? distanceM(origin, sel) : null}
                onBack={() => { setSelected(null); setDetent('peek'); }}
                onCheckIn={() => setCheckingIn({ preset: sel })}
                onPlay={setPlaying}
              />
            ) : view === 'explore' ? (
              <ExploreView toTry={toTry} creatorTrails={state.trails.filter((t) => t.kind === 'creator')} onOpen={openSpot} onAdd={() => setAddingVideo(true)} />
            ) : view === 'collection' ? (
              <CollectionView state={state} spots={spots} stickerOf={stickerOf} onOpen={openSpot} onShare={() => openShare({ kind: 'progress', stickers: state.collected.map((c) => stickerOf(c.spotId)) })} />
            ) : (
              <DiaryView checkins={checkins} spots={spots} stickerOf={stickerOf} onOpen={openSpot} />
            )}
          </Sheet>
        </>
      )}

      {!home && (
        <Onboarding busy={onboardBusy} error={onboardErr} onGps={onboardGps} onMapCentre={() => { const c = mapRef.current?.center(); if (c) setHomeAt(c); }} />
      )}

      {checkingIn && (
        <CheckIn
          knownSpots={spotList}
          visited={state.visitedSpots}
          presetSpot={checkingIn.preset}
          mapCenter={() => mapRef.current!.center()}
          onLocated={(p) => { setMe(p); mapRef.current?.flyTo(p, 16); }}
          onSave={onSave}
          onClose={() => setCheckingIn(null)}
        />
      )}

      {addingVideo && (
        <AddVideo
          spots={spotList}
          onExisting={(d, s) => addVideo(d, s, false)}
          onPickNew={(draft, name, kind) => { setAddingVideo(false); setSelected(null); setPicking({ draft, name, kind }); }}
          onClose={() => setAddingVideo(false)}
        />
      )}

      {playing && (
        <VideoSheet
          video={playing}
          spot={spots.get(playing.spotId)}
          collected={state.visitedSpots.has(playing.spotId)}
          onClose={() => setPlaying(null)}
          onShowOnMap={() => { const s = spots.get(playing.spotId); setPlaying(null); if (s) openSpot(s); }}
        />
      )}

      {reward && (
        <Reward
          diff={reward.diff}
          spot={reward.spot}
          sticker={stickerOf(reward.spot.id)}
          videos={videos.filter((v) => v.spotId === reward.spot.id)}
          onClose={() => setReward(null)}
          onShare={() => {
            const r = reward;
            setReward(null);
            openShare({ kind: 'checkin', spot: r.spot, checkin: r.checkin, sticker: stickerOf(r.spot.id), number: r.diff.number ?? numberOf(r.spot.id) });
          }}
        />
      )}

      {share && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Share image">
          <button className="scrim" aria-label="Close" onClick={closeShare} />
          <div className="modal">
            <img className="share-img" src={share.url} alt="Your share image" />
            <p className="v-foot">The image has no map, address or location on it.</p>
            <div className="actions">
              <button className="btn secondary" onClick={closeShare}>Close</button>
              <button className="btn primary grow" onClick={() => shareOrDownload(share.blob, 'My CheckPoint').then((r) => r === 'downloaded' && setToast('Saved the image to your downloads.'))}>
                <Icon name="share" size={18} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
