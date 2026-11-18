export type SpotKind = 'street' | 'restaurant' | 'cafe' | 'fast_food' | 'bakery' | 'sweets' | 'other';

/** A place you can eat. Kept separate from check-ins so social features stay cheap later. */
export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cell: string; // H3 cell at RES
  source: 'osm' | 'user';
  osmId?: string;
  kind: SpotKind;
  cuisines: string[];
  createdAt: number;
}

/** 0 = meh 😐, 1 = good 🙂, 2 = wow 🤩 */
export type Rating = 0 | 1 | 2;

export interface CheckIn {
  id: string;
  spotId: string;
  dishes: string[];
  photo?: Blob;
  note: string;
  tags: string[];
  rating: Rating;
  visibility: 'private';
  createdAt: number;
}

export interface Home {
  lat: number;
  lng: number;
  radiusKm: number;
  setAt: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** A creator's YouTube / Instagram video that features a spot. Drives "to try" pins and creator trails. */
export interface Video {
  id: string;
  url: string; // '' for demo entries
  platform: 'youtube' | 'instagram' | 'demo';
  embedId: string;
  vertical: boolean; // Shorts / Reels
  title: string;
  creator: string; // normalized "@handle"
  spotId: string;
  createdAt: number;
  demo?: boolean;
}
