import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { stickerMeta, stickerSvg, tiltFor, type StickerKey } from '../lib/stickers';
import type { Home, LatLng, Spot } from '../lib/types';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]; // Bengaluru, until a home is set
const PITCH_3D = 55;
const LABEL_ZOOM = 14.6;

export type MapSpot = Spot & { visits: number; state: 'collected' | 'totry'; videos: number; sticker: StickerKey };

export interface MapHandle {
  center(): LatLng;
  flyTo(p: LatLng, zoom?: number): void;
  celebrate(spotId: string, at: LatLng): void;
  set3D(on: boolean): void;
  resetNorth(): void;
}

interface Props {
  home: Home | null;
  spots: MapSpot[];
  selected: string | null;
  me: LatLng | null;
  onSpot(id: string): void;
  onCamera(bearing: number, pitch: number): void;
}

/** Daylight base map (DESIGN.md › Colour): quiet and low-contrast so the stickers carry the colour. */
const MAP = {
  land: '#F3F4EF', water: '#B9DCEB', park: '#D6E9C6', road: '#FFFFFF', minor: '#FBFBF8', casing: '#E2E4DC',
  building: '#FFFFFF', label: '#7D8790', strong: '#3A4651', rail: '#D3D6CE',
};

function restyle(map: MLMap) {
  for (const l of map.getStyle().layers) {
    const id = l.id;
    try {
      if (l.type === 'background') map.setPaintProperty(id, 'background-color', MAP.land);
      else if (l.type === 'fill' && /^water/.test(id)) map.setPaintProperty(id, 'fill-color', MAP.water);
      else if (l.type === 'fill' && /park|wood|landcover/.test(id)) map.setPaintProperty(id, 'fill-color', MAP.park);
      else if (l.type === 'fill' && /landuse|aeroway|road_area/.test(id)) map.setPaintProperty(id, 'fill-color', MAP.land);
      else if (l.type === 'fill' && id === 'building') map.setLayoutProperty(id, 'visibility', 'none');
      else if (l.type === 'line' && /^waterway/.test(id)) map.setPaintProperty(id, 'line-color', MAP.water);
      else if (l.type === 'line' && /casing/.test(id)) map.setPaintProperty(id, 'line-color', MAP.casing);
      else if (l.type === 'line' && /major|motorway/.test(id)) map.setPaintProperty(id, 'line-color', MAP.road);
      else if (l.type === 'line' && /highway|road|aeroway|pier/.test(id)) map.setPaintProperty(id, 'line-color', MAP.minor);
      else if (l.type === 'line' && /rail/.test(id)) map.setPaintProperty(id, 'line-color', MAP.rail);
      else if (l.type === 'line' && /boundary/.test(id)) map.setLayoutProperty(id, 'visibility', 'none');
      else if (l.type === 'symbol') {
        if (/shield|airport/.test(id)) map.setLayoutProperty(id, 'visibility', 'none');
        map.setPaintProperty(id, 'text-color', /label_(city|town|village|other)/.test(id) ? MAP.strong : MAP.label);
        map.setPaintProperty(id, 'text-halo-color', MAP.land);
      }
    } catch {
      /* layer lacks that paint prop */
    }
  }
}

function stickerEl(s: MapSpot) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pin';
  el.setAttribute('aria-label', s.name);
  el.innerHTML = `<span class="pin-disc"><span class="pin-art"></span><span class="pin-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></span><span class="pin-name"></span>`;
  return el;
}

function paint(el: HTMLElement, s: MapSpot, selected: boolean) {
  el.dataset.state = s.state;
  el.dataset.sticker = s.sticker;
  el.classList.toggle('is-selected', selected);
  el.classList.toggle('has-video', s.videos > 0);
  el.style.setProperty('--tilt', `${tiltFor(s.id)}deg`);
  el.style.setProperty('--tint', stickerMeta(s.sticker).tint);
  const art = el.querySelector('.pin-art')!;
  if (art.getAttribute('data-k') !== s.sticker) {
    art.innerHTML = stickerSvg(s.sticker);
    art.setAttribute('data-k', s.sticker);
  }
  el.querySelector('.pin-name')!.textContent = s.name;
}

export const MapView = forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const ready = useRef(false);
  const markers = useRef(new Map<string, { m: maplibregl.Marker; el: HTMLElement }>());
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useImperativeHandle(ref, () => ({
    center() {
      const c = mapRef.current!.getCenter();
      return { lat: c.lat, lng: c.lng };
    },
    flyTo(p, zoom = 16) {
      mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom, speed: 1.2, curve: 1.4, essential: true, offset: [0, -Math.round((el.current?.clientHeight ?? 800) * 0.22)] });
    },
    /** The one choreographed moment: camera arcs in, then the sticker slaps down onto the map. */
    celebrate(spotId, at) {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [at.lng, at.lat], zoom: 16.4, pitch: PITCH_3D + 5, bearing: map.getBearing() + 25, duration: 1800, essential: true, offset: [0, -120] });
      const land = () => {
        const mk = markers.current.get(spotId);
        if (!mk) return;
        mk.el.classList.remove('is-landing');
        void mk.el.offsetWidth;
        mk.el.classList.add('is-landing');
        setTimeout(() => mk.el.classList.remove('is-landing'), 1400);
      };
      setTimeout(land, 1500);
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
      const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
      map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.28, position: [1.5, 190, 40] });

      // Soft white 3D city: buildings rise as you zoom in, shaded only by light.
      map.addLayer(
        {
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': MAP.building,
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, ['coalesce', ['get', 'render_height'], 9]],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.92,
            'fill-extrusion-vertical-gradient': true,
          },
        },
        firstSymbol,
      );

      // A warm pool of light on the ground under every spot you've eaten at.
      map.addSource('glow', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer(
        {
          id: 'glow',
          type: 'circle',
          source: 'glow',
          paint: {
            'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 11, 8, 17, 64],
            'circle-color': '#F2B01E',
            'circle-opacity': 0.35,
            'circle-blur': 0.9,
            'circle-pitch-alignment': 'map',
          },
        },
        'buildings-3d',
      );

      restyle(map);
      ready.current = true;
      sync();
      syncCamera();
      if (latest.current.home) map.easeTo({ zoom: 13.6, pitch: PITCH_3D, bearing: -17, duration: 2200, essential: true });
    });
    map.on('move', syncCamera);

    return () => {
      cancelled = true;
      for (const { m } of markers.current.values()) m.remove();
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
        const node = stickerEl(s);
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          latest.current.onSpot(s.id);
        });
        const m = new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([s.lng, s.lat]).addTo(map);
        mk = { m, el: node };
        markers.current.set(s.id, mk);
      }
      paint(mk.el, s, s.id === selected);
      mk.el.style.zIndex = s.id === selected ? '5' : s.state === 'collected' ? '2' : '1';
    }
    for (const [id, mk] of markers.current) {
      if (!seen.has(id)) {
        mk.m.remove();
        markers.current.delete(id);
      }
    }
    (map.getSource('glow') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: spots
        .filter((s) => s.state === 'collected')
        .map((s) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } })),
    });
  }

  useEffect(sync, [props.spots, props.selected]);

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
    <div ref={wrap} className="mapwrap">
      <div ref={el} className="map" />
      <div className="sky" aria-hidden="true" />
    </div>
  );
});
