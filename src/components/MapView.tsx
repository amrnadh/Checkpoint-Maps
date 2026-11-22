import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import maplibregl, { type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Check, Play } from '@phosphor-icons/react';
import { Plate } from './FoodIcon';
import type { StickerKey } from '../lib/stickers';
import { addThemeLayers, applyMapTheme, type MapTheme } from '../lib/mapTheme';
import type { Home, LatLng, Spot } from '../lib/types';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]; // Bengaluru, until a home is set
const PITCH_3D = 52;
const LABEL_ZOOM = 14.8;

export type MapSpot = Spot & { visits: number; state: 'collected' | 'totry'; videos: number; sticker: StickerKey; image: string | null };

export interface MapHandle {
  center(): LatLng;
  flyTo(p: LatLng, zoom?: number): void;
  fit(points: LatLng[]): void;
  celebrate(at: LatLng): void;
  set3D(on: boolean): void;
  resetNorth(): void;
}

interface Props {
  home: Home | null;
  spots: MapSpot[];
  selected: string | null;
  me: LatLng | null;
  /** Pixels at the bottom covered by floating UI, so the camera centres spots above it. */
  bottomInset: number;
  onSpot(id: string): void;
  onBackground(): void;
  onCamera(bearing: number, pitch: number): void;
  theme: MapTheme;
}

/** A pin is a round disc: your photo or the creator's frame if we have one, otherwise the spot's plate. */
function Pin({ s, selected }: { s: MapSpot; selected: boolean }) {
  return (
    <>
      <span className="pin-disc">
        {s.image ? <img className="pin-photo" src={s.image} alt="" draggable={false} /> : <Plate k={s.sticker} className="pin-plate" />}
        {s.state === 'collected' ? (
          <span className="pin-badge is-collected"><Check size={10} weight="bold" /></span>
        ) : s.videos > 0 ? (
          <span className="pin-badge is-reel"><Play size={8} weight="fill" /></span>
        ) : null}
      </span>
      <span className="pin-ground" aria-hidden="true" />
      <span className="pin-label" aria-hidden={!selected}>{s.name}</span>
    </>
  );
}

export const MapView = forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const ready = useRef(false);
  const markers = useRef(new Map<string, { m: maplibregl.Marker; el: HTMLButtonElement; root: Root }>());
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef(props);
  latest.current = props;

  const offset = (): [number, number] => [0, -Math.round(latest.current.bottomInset / 2)];

  useImperativeHandle(ref, () => ({
    center() {
      const c = mapRef.current!.getCenter();
      return { lat: c.lat, lng: c.lng };
    },
    flyTo(p, zoom = 15.8) {
      mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom, speed: 1.2, curve: 1.4, essential: true, offset: offset() });
    },
    fit(points) {
      const map = mapRef.current;
      if (!map || !points.length) return;
      if (points.length === 1) return void map.flyTo({ center: [points[0].lng, points[0].lat], zoom: 15, offset: offset(), essential: true });
      const b = new maplibregl.LngLatBounds();
      for (const p of points) b.extend([p.lng, p.lat]);
      map.fitBounds(b, { padding: { top: 170, left: 50, right: 50, bottom: latest.current.bottomInset + 40 }, maxZoom: 15.5, duration: 900, essential: true });
    },
    celebrate(at) {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [at.lng, at.lat], zoom: 16.4, pitch: PITCH_3D + 6, bearing: map.getBearing() + 25, duration: 1600, essential: true, offset: offset() });
    },
    set3D(on) {
      mapRef.current?.easeTo({ pitch: on ? PITCH_3D : 0, bearing: on ? -17 : 0, duration: 900 });
    },
    resetNorth() {
      mapRef.current?.easeTo({ bearing: 0, duration: 600 });
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const h = latest.current.home;
    const map = new maplibregl.Map({
      container: el.current!,
      style: STYLE_URL,
      center: h ? [h.lng, h.lat] : DEFAULT_CENTER,
      zoom: h ? 12.4 : 11.4,
      pitch: h ? 30 : 0,
      maxPitch: 70,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const syncCamera = () => {
      const p = map.getPitch();
      wrap.current?.style.setProperty('--sky', String(Math.max(0, Math.min(1, (p - 25) / 30))));
      wrap.current?.classList.toggle('show-names', map.getZoom() >= LABEL_ZOOM);
      latest.current.onCamera(map.getBearing(), p);
    };

    map.on('load', () => {
      if (cancelled) return;
      map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.3, position: [1.5, 190, 40] });
      addThemeLayers(map);
      applyMapTheme(map, latest.current.theme);
      ready.current = true;
      sync();
      syncCamera();
      if (latest.current.home) map.easeTo({ zoom: 13.6, pitch: PITCH_3D, bearing: -17, duration: 2200, essential: true });
    });
    map.on('move', syncCamera);
    map.on('click', () => latest.current.onBackground());

    return () => {
      cancelled = true;
      for (const { m, root } of markers.current.values()) {
        m.remove();
        setTimeout(() => root.unmount());
      }
      markers.current.clear();
      map.remove();
      mapRef.current = null;
      ready.current = false;
    };
  }, []);

  function sync() {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const { spots, selected } = latest.current;
    const seen = new Set<string>();
    for (const s of spots) {
      seen.add(s.id);
      let mk = markers.current.get(s.id);
      if (!mk) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'pin is-new';
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          latest.current.onSpot(s.id);
        });
        setTimeout(() => node.classList.remove('is-new'), 600);
        const root = createRoot(node);
        const m = new maplibregl.Marker({ element: node, anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(map);
        mk = { m, el: node, root };
        markers.current.set(s.id, mk);
      }
      const isSel = s.id === selected;
      mk.el.dataset.state = s.state;
      mk.el.classList.toggle('is-selected', isSel);
      mk.el.setAttribute('aria-label', s.name);
      mk.el.style.zIndex = isSel ? '5' : s.state === 'collected' ? '2' : '1';
      mk.root.render(<Pin s={s} selected={isSel} />);
    }
    for (const [id, mk] of markers.current) {
      if (!seen.has(id)) {
        mk.m.remove();
        setTimeout(() => mk.root.unmount());
        markers.current.delete(id);
      }
    }
  }

  useEffect(sync, [props.spots, props.selected]);

  useEffect(() => {
    wrap.current?.setAttribute('data-theme', props.theme);
    if (mapRef.current && ready.current) applyMapTheme(mapRef.current, props.theme);
  }, [props.theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!props.me) {
      meMarker.current?.remove();
      meMarker.current = null;
      return;
    }
    if (!meMarker.current) {
      const dot = document.createElement('div');
      dot.className = 'me-dot';
      meMarker.current = new maplibregl.Marker({ element: dot }).setLngLat([props.me.lng, props.me.lat]).addTo(map);
    } else meMarker.current.setLngLat([props.me.lng, props.me.lat]);
  }, [props.me]);

  useEffect(() => {
    if (props.home && mapRef.current && ready.current)
      mapRef.current.flyTo({ center: [props.home.lng, props.home.lat], zoom: 13.6, pitch: PITCH_3D, bearing: -17, duration: 2400 });
  }, [props.home?.setAt]);

  return (
    <div ref={wrap} className="mapwrap" data-theme={props.theme}>
      <div ref={el} className="map" />
      <div className="sky" aria-hidden="true" />
    </div>
  );
});
