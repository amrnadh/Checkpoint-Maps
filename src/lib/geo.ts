import { latLngToCell } from 'h3-js';
import type { LatLng } from './types';

/** H3 cell kept on each spot as a cheap spatial index for the D1 backend (not shown in the UI). */
export const RES = 8;
export const CHECKIN_RANGE_M = 150;

export const cellFor = (p: LatLng) => latLngToCell(p.lat, p.lng, RES);

export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR;
  const dLng = (b.lng - a.lng) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getPosition(): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('This browser has no location support.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? 'Location permission was denied.' : 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  });
}
