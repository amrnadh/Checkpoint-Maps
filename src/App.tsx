import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { MapView, type MapHandle, type MapSpot } from './components/MapView';
import { CheckIn } from './components/CheckIn';
import {
  Carousel, Chips, CollectionPage, DiaryPage, EmptyCard, MapControls, Nav, SpotPage, TopBar,
  type Filter, type SpotVM, type Tab,
} from './components/Screens';
import { AddVideo, Menu, Onboarding, Reward, SharePreview, VideoSheet, type VideoDraft } from './components/Modals';
import { deleteVideos, loadAll, resetAll, saveCheckIn, saveHome, saveVideos, uid } from './lib/db';
import { cellFor, distanceM, getPosition } from './lib/geo';
import { computeState, diffState, normDish, type RewardDiff } from './lib/game';
import { blobUrl } from './lib/image';
import { drawShareCard, shareOrDownload, type ShareInput } from './lib/share';
import { stickerFor } from './lib/stickers';
import { thumbUrl } from './lib/video';
import { transition } from './lib/vt';
import type { MapTheme } from './lib/mapTheme';
import type { CheckIn as CheckInT, Home, LatLng, Spot, SpotKind, Video } from './lib/types';

const BOTTOM_UI = 300; // carousel + nav, so the camera centres spots above them

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

type Picking = { mode: 'video'; draft: VideoDraft; name: string; kind: SpotKind } | { mode: 'home' };

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [home, setHome] = useState<Home | null>(null);
  const [spotList, setSpotList] = useState<Spot[]>([]);
  const [checkins, setCheckins] = useState<CheckInT[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const [tab, setTab] = useState<Tab>('map');
  const [page, setPage] = useState<string | null>(null); // open spot page
  const [heroId, setHeroId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const [me, setMe] = useState<LatLng | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [bearing, setBearing] = useState(-17);
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    try {
      const t = localStorage.getItem('cp-map-theme');
      return t === 'satellite' || t === 'light' || t === 'colour' || t === 'diorama' ? t : 'colour';
    } catch {
      return 'colour';
    }
  });
  const chooseTheme = (t: MapTheme) => {
    setMapTheme(t);
    try {
      localStorage.setItem('cp-map-theme', t);
    } catch {
      /* private mode: keep it for this session only */
    }
  };

  const [checkingIn, setCheckingIn] = useState<{ preset: Spot | null } | null>(null);
  const [reward, setReward] = useState<{ diff: RewardDiff; spot: Spot; checkin: CheckInT } | null>(null);
  const [share, setShare] = useState<{ url: string; blob: Blob } | null>(null);
  const [addingVideo, setAddingVideo] = useState(false);
  const [picking, setPicking] = useState<Picking | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [onboardErr, setOnboardErr] = useState<string | null>(null);
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

  /* ───────── Derived ───────── */

  const spots = useMemo(() => new Map(spotList.map((s) => [s.id, s])), [spotList]);
  const state = useMemo(() => computeState(home, spots, checkins, videos), [home, spots, checkins, videos]);
  const origin: LatLng | null = me ?? home;

  const vms = useMemo<SpotVM[]>(() => {
    const visits = new Map<string, CheckInT[]>();
    for (const c of [...checkins].sort((a, b) => a.createdAt - b.createdAt)) visits.set(c.spotId, [...(visits.get(c.spotId) ?? []), c]);
    const vids = new Map<string, Video[]>();
    for (const v of videos) vids.set(v.spotId, [...(vids.get(v.spotId) ?? []), v]);
    const numbers = new Map(state.collected.map((c, i) => [c.spotId, i + 1]));
    return spotList
      .filter((s) => visits.has(s.id) || vids.has(s.id))
      .map((s) => {
        const vs = visits.get(s.id) ?? [];
        const vv = vids.get(s.id) ?? [];
        const photo = [...vs].reverse().find((c) => c.photo)?.photo;
        const thumb = vv.map(thumbUrl).find(Boolean) ?? null;
        return {
          spot: s,
          sticker: stickerFor(s, vs.flatMap((c) => c.dishes)),
          image: photo ? blobUrl(photo) : thumb,
          state: vs.length ? 'collected' : 'totry',
          videos: vv,
          visits: vs,
          number: numbers.get(s.id) ?? null,
          distance: origin ? distanceM(origin, s) : null,
          creators: [...new Set(vv.map((v) => v.creator))],
        } satisfies SpotVM;
      });
  }, [spotList, checkins, videos, state, origin]);
  const vmById = useMemo(() => new Map(vms.map((v) => [v.spot.id, v])), [vms]);

  const counts = useMemo<Record<Filter, number>>(() => ({
    all: vms.length,
    totry: vms.filter((v) => v.state === 'totry').length,
    collected: vms.filter((v) => v.state === 'collected').length,
    reels: vms.filter((v) => v.videos.length).length,
  }), [vms]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vms
      .filter((v) => filter === 'all' || (filter === 'reels' ? v.videos.length > 0 : v.state === filter))
      .filter((v) => !q || v.spot.name.toLowerCase().includes(q) || v.creators.some((c) => c.includes(q)) || v.visits.some((c) => c.dishes.some((d) => normDish(d).includes(q))))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [vms, filter, query]);

  const mapSpots = useMemo<MapSpot[]>(
    () => shown.map((v) => ({ ...v.spot, visits: v.visits.length, videos: v.videos.length, state: v.state, sticker: v.sticker, image: v.image })),
    [shown],
  );

  /* ───────── Actions ───────── */

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
      .catch((e: Error) => setOnboardErr(`${e.message} Choose your city on the map instead.`))
      .finally(() => setOnboardBusy(false));
  };

  const focusSpot = useCallback((id: string) => {
    setSelected(id);
    const s = spots.get(id);
    if (s) mapRef.current?.flyTo(s);
  }, [spots]);

  const openSpot = (vm: SpotVM) => {
    setSelected(vm.spot.id);
    setHeroId(vm.spot.id);
    requestAnimationFrame(() => transition(() => setPage(vm.spot.id), 'push'));
    mapRef.current?.flyTo(vm.spot);
  };

  const closeSpot = () => transition(() => setPage(null), 'pop');

  const changeTab = (t: Tab) => {
    if (t === tab && !page) return;
    transition(() => { setPage(null); setTab(t); }, 'tab');
  };

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setSelected(null);
    const pts = vms.filter((v) => f === 'all' || (f === 'reels' ? v.videos.length > 0 : v.state === f)).map((v) => v.spot);
    mapRef.current?.fit(pts);
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
    setPage(null);
    setTab('map');
    setFilter('all');
    setQuery('');
    setSelected(spot.id);
    const diff = diffState(before, after, spot);
    setTimeout(() => mapRef.current?.celebrate(spot), 80);
    setTimeout(() => setReward({ diff, spot, checkin: c }), 1700);
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
    setTab('map');
    setPage(null);
    setFilter('all');
    focusSpot(spot.id);
    setToast(`Added. ${spot.name} is on your map to try.`);
  };

  const confirmPick = () => {
    if (!picking) return;
    const p = mapRef.current!.center();
    if (picking.mode === 'home') {
      setPicking(null);
      setHomeAt(p).then(() => setToast('Your city is set. Add a creator’s video or check in to start.'));
      return;
    }
    const s: Spot = { id: `user:${uid()}`, name: picking.name, ...p, cell: cellFor(p), source: 'user', kind: picking.kind, cuisines: [], createdAt: Date.now() };
    addVideo(picking.draft, s, true);
  };

  const loadDemo = async () => {
    setMenu(false);
    if (!home) return;
    if (videos.some((v) => v.demo)) return setToast('The demo spots are already on your map.');
    const d = demoTrail(home);
    await saveVideos(d.spots, d.videos);
    setSpotList((l) => [...l, ...d.spots]);
    setVideos((l) => [...l, ...d.videos]);
    setTab('map');
    setFilter('all');
    setTimeout(() => mapRef.current?.fit(d.spots), 50);
    setToast('Added 5 demo spots from @demo_foodie.');
  };

  const removeDemo = async () => {
    setMenu(false);
    await deleteVideos(videos.filter((v) => v.demo).map((v) => v.id));
    setVideos((l) => l.filter((v) => !v.demo));
    setSelected(null);
    setPage(null);
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

  const locateMe = () => getPosition().then((p) => { setMe(p); mapRef.current?.flyTo(p, 15.5); }).catch((e: Error) => setToast(e.message));

  /* ───────── Render ───────── */

  if (!loaded) return <div className="boot" />;

  const pageVm = page ? vmById.get(page) : undefined;
  const onMap = !!home && !picking && tab === 'map' && !pageVm;

  return (
    <div className="app" data-mode={onMap ? 'map' : picking ? 'pick' : 'page'}>
      <MapView
        ref={mapRef}
        home={home}
        spots={mapSpots}
        selected={selected}
        me={me}
        bottomInset={BOTTOM_UI}
        theme={mapTheme}
        onSpot={focusSpot}
        onBackground={() => setSelected(null)}
        onCamera={(b, p) => { setBearing(b); setIs3D(p > 15); }}
      />

      {onMap && (
        <>
          <div className="map-top">
            <TopBar query={query} onQuery={(q) => { setQuery(q); setSelected(null); }} onMenu={() => setMenu(true)} />
            {vms.length > 0 && <Chips filter={filter} counts={counts} onFilter={changeFilter} />}
          </div>
          <MapControls is3D={is3D} bearing={bearing} theme={mapTheme} onTheme={chooseTheme} onLocate={locateMe} on3D={() => mapRef.current?.set3D(!is3D)} onNorth={() => mapRef.current?.resetNorth()} />
          <Carousel
            items={shown}
            selected={selected}
            heroId={heroId}
            onFocus={focusSpot}
            onOpen={openSpot}
            empty={vms.length ? (
              <article className="scard is-empty"><h3>No matches</h3><p>Nothing on your map fits “{query || filter}”. Clear the search or pick another filter.</p></article>
            ) : (
              <EmptyCard onAddVideo={() => setAddingVideo(true)} onDemo={loadDemo} />
            )}
          />
        </>
      )}

      {home && !picking && tab === 'collection' && !pageVm && (
        <CollectionPage state={state} items={vms} onOpen={openSpot} onShare={() => openShare({ kind: 'progress', stickers: state.collected.map((c) => vmById.get(c.spotId)?.sticker ?? 'thali') })} />
      )}
      {home && !picking && tab === 'diary' && !pageVm && <DiaryPage checkins={checkins} vmOf={(id) => vmById.get(id)} onOpen={openSpot} />}
      {pageVm && <SpotPage vm={pageVm} onBack={closeSpot} onCheckIn={() => setCheckingIn({ preset: pageVm.spot })} onPlay={setPlaying} />}

      {home && !picking && !pageVm && <Nav tab={tab} onTab={changeTab} onCheckIn={() => setCheckingIn({ preset: null })} />}

      {picking && (
        <>
          <span className="crosshair" aria-hidden="true"><MapPin size={44} weight="fill" /></span>
          <div className="pickbar">
            <p>{picking.mode === 'home' ? <>Move the map to your city.</> : <>Move the map until the pin sits on <b>{picking.name}</b>.</>}</p>
            <div className="dock static">
              <button className="pill outline" onClick={() => { const m = picking.mode; setPicking(null); if (m === 'video') setAddingVideo(true); }}>Back</button>
              <button className="pill dark grow" onClick={confirmPick}>{picking.mode === 'home' ? 'Set as my city' : 'Place it here'}</button>
            </div>
          </div>
        </>
      )}

      {!home && !picking && <Onboarding busy={onboardBusy} error={onboardErr} onGps={onboardGps} onMapCentre={() => setPicking({ mode: 'home' })} />}

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
          onPickNew={(draft, name, kind) => { setAddingVideo(false); setPage(null); setTab('map'); setPicking({ mode: 'video', draft, name, kind }); }}
          onClose={() => setAddingVideo(false)}
        />
      )}
      {playing && (
        <VideoSheet
          video={playing}
          spot={spots.get(playing.spotId)}
          collected={state.visitedSpots.has(playing.spotId)}
          onClose={() => setPlaying(null)}
          onShowOnMap={() => { const id = playing.spotId; setPlaying(null); transition(() => { setPage(null); setTab('map'); }, 'pop'); setTimeout(() => focusSpot(id), 50); }}
        />
      )}
      {menu && (
        <Menu
          hasDemo={videos.some((v) => v.demo)}
          onAddVideo={() => { setMenu(false); setAddingVideo(true); }}
          onDemo={loadDemo}
          onRemoveDemo={removeDemo}
          onSetCity={() => { setMenu(false); setPicking({ mode: 'home' }); }}
          onReset={async () => {
            setMenu(false);
            if (confirm('Delete every check-in, spot, video and your city from this phone? This can’t be undone.')) {
              await resetAll();
              location.reload();
            }
          }}
          onClose={() => setMenu(false)}
        />
      )}
      {reward && (
        <Reward
          diff={reward.diff}
          spot={reward.spot}
          sticker={vmById.get(reward.spot.id)?.sticker ?? stickerFor(reward.spot, reward.checkin.dishes)}
          image={vmById.get(reward.spot.id)?.image ?? null}
          videos={videos.filter((v) => v.spotId === reward.spot.id)}
          onClose={() => setReward(null)}
          onShare={() => {
            const r = reward;
            setReward(null);
            openShare({ kind: 'checkin', spot: r.spot, checkin: r.checkin, sticker: vmById.get(r.spot.id)?.sticker ?? 'thali', number: r.diff.number ?? vmById.get(r.spot.id)?.number ?? null });
          }}
        />
      )}
      {share && (
        <SharePreview
          url={share.url}
          onClose={closeShare}
          onShare={() => shareOrDownload(share.blob, 'My CheckPoint').then((r) => r === 'downloaded' && setToast('Saved the image to your downloads.'))}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
