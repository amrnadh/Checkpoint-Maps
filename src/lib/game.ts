import type { CheckIn, Home, Spot, Video } from './types';

/* ───────────────────────── Dishes → cuisines ───────────────────────── */

const CUISINE_RULES: [RegExp, string][] = [
  [/dosa|idli|idly|vada|uttapam|pongal|sambar|appam|puttu|bisi bele|filter coffee/, 'South Indian'],
  [/biryani|kebab|kabab|haleem|nihari|tikka|korma|mandi/, 'Mughlai'],
  [/momo|thukpa|thenthuk/, 'Tibetan'],
  [/chaat|pani ?puri|golgappa|bhel|sev puri|dahi puri|pav bhaji|vada pav|samosa|kachori/, 'Chaat'],
  [/paratha|chole|rajma|butter chicken|dal makhani|naan|kulcha|lassi/, 'North Indian'],
  [/fish curry|appam|porotta|parotta|kerala|neer dosa|ghee roast/, 'Coastal'],
  [/hakka|manchurian|fried rice|noodle|chilli chicken|schezwan|chow/, 'Indo-Chinese'],
  [/pizza|pasta|risotto|lasagna/, 'Italian'],
  [/burger|fries|hot ?dog|sandwich/, 'Burgers & Sandwiches'],
  [/sushi|ramen|gyoza|udon|katsu|bao/, 'Japanese & East Asian'],
  [/shawarma|falafel|hummus|kunafa/, 'Middle Eastern'],
  [/taco|burrito|nacho|quesadilla/, 'Mexican'],
  [/chai|tea|coffee|kahwa|latte|espresso|cappuccino/, 'Chai & Coffee'],
  [/jalebi|gulab|rasgulla|halwa|kulfi|ladoo|laddu|mysore pak|barfi|payasam|kheer|ice ?cream|cake|pastry|brownie|dessert|falooda/, 'Sweets & Desserts'],
];

export const normDish = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
export const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function cuisinesFor(dishes: string[], spot?: Spot): string[] {
  const out = new Set<string>();
  for (const d of dishes) {
    const n = normDish(d);
    for (const [re, c] of CUISINE_RULES) if (re.test(n)) out.add(c);
  }
  for (const c of spot?.cuisines ?? []) out.add(titleCase(c));
  return [...out];
}

/* ───────────────────────── Collections ───────────────────────── */

/**
 * Seed collections. Rule-based for now so they work in any city on day one;
 * founder-curated spot lists ("every chai stall on X Road") plug in later via `spotIds`.
 */
export interface Collection {
  id: string;
  title: string;
  blurb: string;
  goal: number;
  /** What one "stop" is. Returns a key per distinct stop, or null if this check-in doesn't count. */
  match: (c: CheckIn, s: Spot) => string | null;
}

const dishAt = (re: RegExp) => (c: CheckIn, s: Spot) => (c.dishes.some((d) => re.test(normDish(d))) ? s.id : null);

export const COLLECTIONS: Collection[] = [
  { id: 'chai', title: 'Chai Circuit', blurb: 'Chai or coffee at 6 different stalls.', goal: 6, match: dishAt(/chai|tea|coffee|kahwa/) },
  { id: 'biryani', title: 'Biryani Trail', blurb: 'Biryani from 8 different kitchens.', goal: 8, match: dishAt(/biryani|pulao|mandi/) },
  { id: 'tiffin', title: 'Tiffin Run', blurb: 'Dosa, idli or vada at 6 spots.', goal: 6, match: dishAt(/dosa|idli|idly|vada|uttapam|pongal/) },
  { id: 'momo', title: 'Momo Mission', blurb: 'Dumplings at 5 different places.', goal: 5, match: dishAt(/momo|dumpling|gyoza|dim ?sum|bao/) },
  {
    id: 'street',
    title: 'Street Side',
    blurb: '10 stalls, carts or hole-in-the-walls.',
    goal: 10,
    match: (c, s) => (s.kind === 'street' || c.tags.includes('street') ? s.id : null),
  },
  { id: 'sweet', title: 'Sweet Tooth', blurb: 'Something sweet at 6 spots.', goal: 6, match: dishAt(/jalebi|gulab|rasgulla|halwa|kulfi|ladoo|laddu|mysore pak|barfi|payasam|kheer|ice ?cream|cake|pastry|brownie|dessert|falooda|mithai/) },
  { id: 'cafe', title: 'Café Hopper', blurb: '6 different cafés.', goal: 6, match: (_c, s) => (s.kind === 'cafe' ? s.id : null) },
  {
    id: 'night',
    title: 'Night Bites',
    blurb: 'Eat after 9 pm at 5 different spots.',
    goal: 5,
    match: (c, s) => {
      const h = new Date(c.createdAt).getHours();
      return h >= 21 || h < 3 ? s.id : null;
    },
  },
];

/* ───────────────────────── Weeks & streak ───────────────────────── */

/** Monday-based week index since epoch (local time). */
export function weekIndex(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return Math.round(d.getTime() / (7 * 864e5));
}

/* ───────────────────────── Derived game state ───────────────────────── */

export interface Badge {
  id: string;
  title: string;
  desc: string;
  earned: boolean;
}

export interface TrailProgress {
  id: string;
  kind: 'food' | 'creator';
  title: string;
  blurb: string;
  goal: number;
  got: number;
  done: boolean;
  creator?: string;
  spotIds?: string[]; // creator trails: the featured spots
}

export interface GameState {
  /** Collected spots in the order you first ate there (sticker #1, #2, …). */
  collected: { spotId: string; first: number; dishes: string[] }[];
  spotsVisited: number;
  checkins: number;
  dishes: { name: string; count: number; first: number }[];
  cuisines: { name: string; first: number }[];
  trails: TrailProgress[]; // food trails first, then creator trails
  visitedSpots: Set<string>;
  seenOn: number; // featured spots you've eaten at
  streak: number;
  thisWeekDone: boolean;
  badges: Badge[];
}

export function computeState(home: Home | null, spots: Map<string, Spot>, checkins: CheckIn[], videos: Video[] = []): GameState {
  const sorted = [...checkins].sort((a, b) => a.createdAt - b.createdAt);
  const firstVisit = new Map<string, number>(); // spotId → first time
  const dishMap = new Map<string, { name: string; count: number; first: number }>();
  const cuisineMap = new Map<string, number>();
  const colKeys = new Map<string, Set<string>>(COLLECTIONS.map((c) => [c.id, new Set()]));

  for (const c of sorted) {
    const s = spots.get(c.spotId);
    if (!s) continue;
    if (!firstVisit.has(s.id)) firstVisit.set(s.id, c.createdAt);
    for (const d of c.dishes) {
      const k = normDish(d);
      if (!k) continue;
      const e = dishMap.get(k);
      if (e) e.count++;
      else dishMap.set(k, { name: titleCase(k), count: 1, first: c.createdAt });
    }
    for (const cu of cuisinesFor(c.dishes, s)) if (!cuisineMap.has(cu)) cuisineMap.set(cu, c.createdAt);
    for (const col of COLLECTIONS) {
      const key = col.match(c, s);
      if (key) colKeys.get(col.id)!.add(key);
    }
  }

  void home;

  // Streak: consecutive weeks with at least one *new* spot. This week counts once done; until then the streak is still alive from last week.
  const newSpotWeeks = new Set([...firstVisit.values()].map(weekIndex));
  const nowW = weekIndex(Date.now());
  const thisWeekDone = newSpotWeeks.has(nowW);
  let streak = 0;
  for (let w = thisWeekDone ? nowW : nowW - 1; newSpotWeeks.has(w); w--) streak++;

  const food: TrailProgress[] = COLLECTIONS.map((c) => {
    const got = Math.min(colKeys.get(c.id)!.size, c.goal);
    return { id: c.id, kind: 'food', title: c.title, blurb: c.blurb, goal: c.goal, got, done: got >= c.goal };
  });
  const byCreator = new Map<string, Set<string>>();
  for (const v of videos) {
    if (!spots.has(v.spotId)) continue;
    byCreator.set(v.creator, (byCreator.get(v.creator) ?? new Set()).add(v.spotId));
  }
  const creator: TrailProgress[] = [...byCreator].map(([handle, ids]) => {
    const got = [...ids].filter((id) => firstVisit.has(id)).length;
    return {
      id: `creator:${handle}`,
      kind: 'creator',
      title: `${handle}’s trail`,
      blurb: `${ids.size} spot${ids.size === 1 ? '' : 's'} from their videos.`,
      goal: ids.size,
      got,
      done: got >= ids.size,
      creator: handle,
      spotIds: [...ids],
    };
  });
  const trails = [...food, ...creator];
  const featured = new Set(videos.map((v) => v.spotId));
  const seenOn = [...firstVisit.keys()].filter((id) => featured.has(id)).length;

  const userSpots = new Set(sorted.map((c) => spots.get(c.spotId)).filter((s) => s?.source === 'user').map((s) => s!.id)).size;
  const nSpots = firstVisit.size;
  const badges: Badge[] = [
    { id: 'first', title: 'First Bite', desc: 'Your first check-in', earned: sorted.length >= 1 },
    { id: 'spots5', title: 'Regular Roamer', desc: '5 different spots', earned: nSpots >= 5 },
    { id: 'spots25', title: 'Local Legend', desc: '25 different spots', earned: nSpots >= 25 },
    { id: 'dish10', title: 'Big Appetite', desc: '10 different dishes', earned: dishMap.size >= 10 },
    { id: 'cuisine5', title: 'Five Kitchens', desc: '5 cuisines unlocked', earned: cuisineMap.size >= 5 },
    { id: 'spots10', title: 'Ten Plates', desc: '10 different spots', earned: nSpots >= 10 },
    { id: 'finder', title: 'Stall Finder', desc: 'Add 3 spots missing from the map', earned: userSpots >= 3 },
    { id: 'trail1', title: 'Trail Blazer', desc: 'Finish any trail', earned: trails.some((c) => c.done) },
    { id: 'seen1', title: 'Seen It, Ate It', desc: 'Eat at a spot from a creator video', earned: seenOn >= 1 },
    { id: 'seen5', title: 'Reel to Real', desc: '5 spots from creator videos', earned: seenOn >= 5 },
    { id: 'streak4', title: 'Four-Week Feast', desc: 'A new spot 4 weeks running', earned: streak >= 4 },
  ];

  return {
    collected: [...firstVisit].map(([spotId, first]) => ({
      spotId,
      first,
      dishes: sorted.filter((c) => c.spotId === spotId).flatMap((c) => c.dishes),
    })),
    spotsVisited: nSpots,
    checkins: sorted.length,
    dishes: [...dishMap.values()].sort((a, b) => b.first - a.first),
    cuisines: [...cuisineMap.entries()].map(([name, first]) => ({ name, first })).sort((a, b) => b.first - a.first),
    trails,
    visitedSpots: new Set(firstVisit.keys()),
    seenOn,
    streak,
    thisWeekDone,
    badges,
  };
}

/** What changed because of the latest check-in — drives the reward screen. */
export interface RewardDiff {
  /** Sticker number in your collection, or null for a repeat visit. */
  number: number | null;
  newSpot: boolean;
  newDishes: string[];
  newCuisines: string[];
  collectionMoves: { title: string; before: number; after: number; goal: number; done: boolean; creator: boolean }[];
  newBadges: Badge[];
  streak: number;
  streakExtended: boolean;
}

export function diffState(before: GameState, after: GameState, spot: Spot): RewardDiff {
  const dishesBefore = new Set(before.dishes.map((d) => d.name));
  const cuisBefore = new Set(before.cuisines.map((c) => c.name));
  const badgesBefore = new Set(before.badges.filter((b) => b.earned).map((b) => b.id));
  return {
    number: after.spotsVisited > before.spotsVisited ? after.spotsVisited : null,
    newSpot: after.spotsVisited > before.spotsVisited,
    newDishes: after.dishes.filter((d) => !dishesBefore.has(d.name)).map((d) => d.name),
    newCuisines: after.cuisines.filter((c) => !cuisBefore.has(c.name)).map((c) => c.name),
    collectionMoves: after.trails
      .map((a) => ({ a, b: before.trails.find((t) => t.id === a.id) }))
      .filter(({ a, b }) => a.got > (b?.got ?? 0))
      .map(({ a, b }) => ({ title: a.title, before: b?.got ?? 0, after: a.got, goal: a.goal, done: a.done, creator: a.kind === 'creator' })),
    newBadges: after.badges.filter((b) => b.earned && !badgesBefore.has(b.id)),
    streak: after.streak,
    streakExtended: after.thisWeekDone && !before.thisWeekDone,
  };
}

export const RATING_LABEL = ['😐 Meh', '🙂 Good', '🤩 Wow'] as const;
