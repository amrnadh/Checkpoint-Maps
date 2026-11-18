import { cellFor, distanceM } from './geo';
import type { LatLng, Spot, SpotKind } from './types';

/** Nearby food spots from OpenStreetMap (Overpass). Only fetched on demand at check-in time. */
/** Public Overpass servers are flaky; try each with a short timeout. */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const PER_TRY_MS = 7000;

async function queryOverpass(q: string, outer?: AbortSignal): Promise<{ elements: OsmEl[] }> {
  let last: unknown;
  for (const url of ENDPOINTS) {
    if (outer?.aborted) throw new DOMException('Aborted', 'AbortError');
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), PER_TRY_MS);
    const onOuter = () => ac.abort();
    outer?.addEventListener('abort', onOuter);
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: ac.signal });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
    } finally {
      clearTimeout(t);
      outer?.removeEventListener('abort', onOuter);
    }
  }
  console.warn('Overpass lookup failed on all endpoints', last);
  throw new Error('Couldn’t load nearby spots from OpenStreetMap right now. Add the spot yourself.');
}

interface OsmEl {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function kindOf(t: Record<string, string>): SpotKind {
  if (t.shop === 'bakery') return 'bakery';
  if (t.shop === 'confectionery' || t.amenity === 'ice_cream') return 'sweets';
  if (t.amenity === 'cafe') return 'cafe';
  if (t.amenity === 'fast_food' || t.amenity === 'food_court') {
    return t.street_vendor === 'yes' || t.kiosk === 'yes' ? 'street' : 'fast_food';
  }
  if (t.amenity === 'restaurant') return 'restaurant';
  return 'other';
}

export async function fetchNearby(p: LatLng, radiusM = 250, signal?: AbortSignal): Promise<Spot[]> {
  const around = `(around:${radiusM},${p.lat.toFixed(6)},${p.lng.toFixed(6)})`;
  const q = `[out:json][timeout:10];(
    nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]${around};
    nwr["shop"~"^(bakery|confectionery)$"]${around};
  );out center 60;`;
  const json = await queryOverpass(q, signal);
  const out: Spot[] = [];
  for (const el of json.elements) {
    const t = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null || !t.name) continue;
    out.push({
      id: `osm:${el.type}/${el.id}`,
      osmId: `${el.type}/${el.id}`,
      name: t.name,
      lat,
      lng,
      cell: cellFor({ lat, lng }),
      source: 'osm',
      kind: kindOf(t),
      cuisines: (t.cuisine ?? '').split(';').map((s) => s.trim().replace(/_/g, ' ')).filter(Boolean),
      createdAt: Date.now(),
    });
  }
  return out.sort((a, b) => distanceM(p, a) - distanceM(p, b));
}
