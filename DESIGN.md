# CheckPoint design system (v3)

## What we're designing

A map of the food spots worth the trip in your city, mostly ones you saw in a creator's reel. You eat there and the spot joins your collection. The audience is food people who chase famous and iconic places. The app's main job is to make the next plate feel close and the past plates feel collected.

## What the moodboard says (Nov 2026)

| Pattern from the references | What we take |
|---|---|
| Soft pastel colour behind content instead of flat white (ride app, real estate, laundry) | A "mist" background (peach, lilac, mint) on every page except the map |
| Full-bleed map with glass controls floating on top (haven, 3D city) | The map is the home screen. Search, filters, cards and nav float over it on frosted glass |
| Map pins made from images, with a dark label pill under the selected one and a lime ring (haven) | Pins are small framed tiles showing your photo, the creator's video frame or a food glyph. The selected pin gets a lime ring and a dark name pill |
| Filter chips with counts (3D city) | All, To try, Collected and From reels, each with a count |
| A hero card at the bottom with a photo, tag, heart and arrow (haven) | A swipeable card carousel synced with the pins: swipe a card and the map follows, tap a pin and the card scrolls in |
| A floating pill nav bar with the selected tab as a solid pill, plus a separate round action (haven, real estate) | Map, Collection, Diary in a glass pill, plus a round black "I ate here" button |
| Black pill as the primary action, outline pill as the secondary (welcome, ride, laundry) | One black primary per screen and an outline secondary, nothing else competing |
| Big confident numbers for stats (real estate, laundry) | Collection stats are big numbers with small labels |
| Selectable option cards with a highlighted border and gradient tags (ride) | The check-in rating is three option cards, and the selected one gets the gradient border |
| A timeline for history (laundry tracking) | The diary is a timeline |
| A serif display headline (haven) | Instrument Serif for page titles and spot names |

We are **not** copying the 3D emoji pins or photoreal city. Icons are clean line and duotone glyphs from one family.

## Principles

1. **The map is home.** Everything starts on the map, and every page slides over it and back.
2. **Pictures over dots.** A spot shows the best picture we have: your photo, then the creator's video frame, then a food glyph on its category colour.
3. **Glass for controls, paper for content.** Floating controls are frosted glass. Reading surfaces (pages, sheets) are solid and calm.
4. **One black button.** Each screen has a single primary action as a black pill. Everything else is quieter.
5. **Motion shows where things went.** A card grows into the spot page, the nav pill slides to the chosen tab, and check-in steps slide sideways. The only celebration is the reward screen. Reduced-motion settings are respected.
6. **Collect places, not territory.** We never show "% explored". Progress means spots, trails, dishes and badges.
7. **Plain words.** Sentence case, no all-caps labels, and buttons that say what happens.

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#17131F` | Text, primary buttons, selected nav pill, dark label pill |
| Smoke | `#6E6879` | Secondary text |
| Lime | `#D4F36A` | Selected and collected: pin ring, collected tag, check badge |
| Masala gradient | `#FF9F43` → `#FF5A5F` | To try and from reels: tags, play badges, the rating card border |
| Mist | `#FFF2E9` / `#F3EDFB` / `#E8F3F1` | Page backgrounds (a soft three-stop gradient) |
| Paper | `#FFFFFF` | Cards and sheets |

Glass is white at 70% opacity with a 24 px blur and saturation 1.6.

### Map styles (Nov 2026)

The plain white map read as too empty, so the map now comes in three styles, picked from the layers button. The choice is remembered on the device.

| Style | Look |
|---|---|
| **Colour** (default) | Neutral land `#F2F0EB`, parks `#B9E0A0`, water `#8EC9EE`, white main roads, pale gold motorways `#FFE7A3`. Land use is softly tinted. 3D buildings cool from ivory to lavender-blue as they rise (retuned Nov 2026: the first version read too orange) |
| **Midnight** (premium) | Navy land `#131A2B`, deep teal water, champagne-gold motorways `#E6C27A` and dim-gold main roads, buildings glowing indigo `#3B4890` to violet `#B9A9F4` under a cool lilac light, a violet dusk sky. Pins get a soft halo |
| **Satellite** | Esri World Imagery under see-through roads and white labels with dark halos. 3D buildings are hidden because the photo already shows them |
| **Light** | The original quiet daylight map: land `#F1F1EE`, water `#CDE2EC`, white buildings |

The sky gradient at the horizon follows the style. All theme values live in `src/lib/mapTheme.ts`.

Each food category has its own pastel tile colour and a darker glyph colour (see `src/lib/stickers.ts`).

## Type

- **Instrument Serif** for page titles, spot names, big numbers and the greeting. It's editorial and warm, the way a food guide reads. Never below 22 px.
- **Onest** for all UI text. It's geometric, clear and slightly friendly. Weights 400, 500, 600 and 700.

Scale (px): 44 / 34 / 26 / 20 / 17 / 15 / 13.

## Food art

Each food category has a bespoke **top-down plate illustration** (`src/lib/plates.ts`): a biryani handi, a dosa with chutneys, cutting chai with a rusk, filter coffee in a dabara, a momo steamer, a falooda bowl, a bakery bun, a burger with fries, a steel thali, pani puri on a leaf plate, latte art, and noodles. They're drawn in soft gradients with light from the top-left, like overhead food photography, with no outlines. They're used for map pins (round), card product shots (the plate bleeds off the card edge), tiles and the spot hero. Your own photo, or a creator's video frame, always replaces the plate when one exists.

## Icons

**Phosphor**, one family throughout:
- **Regular** weight for UI controls.
- **Fill** weight only for small status badges (play, check).

## Layout

```
┌───────────────────────────────┐
│ ( search spots, dishes…  ) (⋯)│  glass
│ [All 12] [To try 5] [Collected]│  chips with counts
│                               │
│     map · tile pins           │
│        ▣ selected             │
│     ┌Name pill┐               │
│ ┌──────────────────┐ ┌───     │  card carousel (snap)
│ │ image   tag      │ │        │
│ │ Name        (→)  │ │        │
│ └──────────────────┘ └───     │
│ ( ●Map  Collection  Diary ) (+)│  floating nav + check-in
└───────────────────────────────┘
```

Pages (spot, collection, diary) are full-screen over the map, with a mist background and a back button. Content is left-aligned.
