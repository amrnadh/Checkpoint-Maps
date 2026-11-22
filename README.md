# CheckPoint Maps

A gamified food map. Spots you've eaten at and spots from creators' videos show as picture pins on a 3D daylight map, with a swipeable card for each. Every meal adds to your collection, trails, dishes and diary. Spots from food creators' YouTube and Instagram videos show up as pink "to try" pins and creator trails. See [BRIEF.md](BRIEF.md) for the product brief.

## Run

```bash
npm install
npm run dev
```

Open the printed URL on your phone (same Wi-Fi; the server listens on your LAN). GPS needs HTTPS or `localhost`, so on a phone use "Use map centre" or tunnel the dev server.

## What's in v1 (initial build)

| Brief build step | Status |
|---|---|
| 1. MapLibre map, food-native styling | ✅ OpenFreeMap Positron tiles, re-inked with the zine palette, light + dark |
| 2. Quick check-in (GPS → nearby spots → create spot → photo/dish/rating) | ✅ stored locally (IndexedDB) |
| 3. Workers API + D1, R2 photos, offline sync | ⏳ not started; everything is local-first for now |
| 4. ~~Food fog (H3) + % explored~~ | Removed. Replaced by the sticker collection (see DESIGN.md) |
| 5. Collections with progress | ✅ 9 rule-based trails in `src/lib/game.ts` |
| 6. Dish passport, badges, weekly streak | ✅ |
| 7. Share cards | ✅ drawn on-device (no map, address or coordinates) — server OG images later |
| 8. Auth, PWA install, polish | 🟡 PWA manifest + service worker done; no auth yet |
| Creator layer | ✅ add a YouTube/Instagram link → "to try" pin, Discover tab, creator trails, embedded player, demo trail in the ⋯ menu |
| 3D map | ✅ light daylight style, white 3D buildings, sky at the horizon, food-sticker markers, sticker "landing" on check-in |

## Code map

- `src/lib/game.ts` — all game rules: dish→cuisine map, collections, badges, streak, reward diff. Edit seed trails here.
- `src/lib/geo.ts` — distance, GPS, H3 cell id per spot.
- `src/lib/stickers.ts` — food categories (tile colour, glyph) and how a spot picks one.
- `src/lib/vt.ts` — View Transitions wrapper for page and card-to-spot morphs.
- `src/lib/osm.ts` — nearby food spots from OpenStreetMap Overpass (with fallback servers).
- `src/lib/db.ts` — IndexedDB stores mirroring the brief's data model (`spots`, `checkins`, `meta`).
- `src/lib/share.ts` — share-card canvas renderer.
- `src/lib/video.ts` — YouTube / Instagram link parsing and embeds.
- `src/styles.css` — design tokens at the top. Rules and palette are in [DESIGN.md](DESIGN.md).
- `src/components/` — map and pins, screens (map chrome, card carousel, nav, spot, collection, diary), modals (check-in, reward, video, add video, menu, onboarding).

## Credits

- Icons: [Phosphor Icons](https://phosphoricons.com) (MIT).
- Fonts: Instrument Serif and Onest from Google Fonts (OFL).
- Map: OpenFreeMap tiles, OpenStreetMap data.
