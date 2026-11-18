import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CheckIn, Home, Spot, Video } from './types';

/**
 * Local-first storage. Everything lives in IndexedDB on the device for now;
 * the Workers + D1 sync layer (build-order step 3) will read from these stores.
 */
interface CPSchema extends DBSchema {
  spots: { key: string; value: Spot; indexes: { byOsm: string } };
  checkins: { key: string; value: CheckIn; indexes: { bySpot: string; byTime: number } };
  meta: { key: string; value: unknown };
  videos: { key: string; value: Video; indexes: { bySpot: string } };
}

let dbp: Promise<IDBPDatabase<CPSchema>> | null = null;

function db() {
  if (!dbp) {
    dbp = openDB<CPSchema>('checkpoint-maps', 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 2) {
          const v = d.createObjectStore('videos', { keyPath: 'id' });
          v.createIndex('bySpot', 'spotId');
        }
        if (oldVersion >= 1) return;
        const spots = d.createObjectStore('spots', { keyPath: 'id' });
        spots.createIndex('byOsm', 'osmId');
        const c = d.createObjectStore('checkins', { keyPath: 'id' });
        c.createIndex('bySpot', 'spotId');
        c.createIndex('byTime', 'createdAt');
        d.createObjectStore('meta');
      },
    });
  }
  return dbp;
}

export const uid = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export async function loadAll() {
  const d = await db();
  const [spots, checkins, home, videos] = await Promise.all([
    d.getAll('spots'),
    d.getAllFromIndex('checkins', 'byTime'),
    d.get('meta', 'home') as Promise<Home | undefined>,
    d.getAll('videos'),
  ]);
  return { spots, checkins, home: home ?? null, videos };
}

export async function saveHome(home: Home) {
  await (await db()).put('meta', home, 'home');
}

export async function saveCheckIn(spot: Spot, checkin: CheckIn) {
  const d = await db();
  const tx = d.transaction(['spots', 'checkins'], 'readwrite');
  await tx.objectStore('spots').put(spot);
  await tx.objectStore('checkins').put(checkin);
  await tx.done;
}

export async function saveVideos(spots: Spot[], videos: Video[]) {
  const d = await db();
  const tx = d.transaction(['spots', 'videos'], 'readwrite');
  for (const s of spots) await tx.objectStore('spots').put(s);
  for (const v of videos) await tx.objectStore('videos').put(v);
  await tx.done;
}

export async function deleteVideos(ids: string[]) {
  const d = await db();
  const tx = d.transaction('videos', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}

export async function deleteCheckIn(id: string) {
  await (await db()).delete('checkins', id);
}

export async function resetAll() {
  const d = await db();
  const tx = d.transaction(['spots', 'checkins', 'meta', 'videos'], 'readwrite');
  await Promise.all(['spots', 'checkins', 'meta', 'videos'].map((n) => tx.objectStore(n as 'spots').clear()));
  await tx.done;
}
