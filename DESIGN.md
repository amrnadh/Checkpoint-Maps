# CheckPoint design system

## What we're designing

A map of the food spots worth the trip in your city, mostly ones you saw in a creator's reel. You eat there and the spot turns into a sticker on your map. The audience is food people who chase famous and iconic places, not people who want to visit every stall. The app's main job is to make your next plate feel close and your past plates feel collected.

## The idea in one line

**A daylight street map with a sticker book on top.** The map is calm, light and quiet, like Apple Maps. The food stickers are the only loud thing on it.

## Principles

1. **The map defers, the food speaks.** The base map has low contrast and few colours, so the illustrated stickers are the only saturated objects on screen. Apple calls this *deference*: chrome never competes with content.
2. **Collect places, not territory.** Progress is the spots you've eaten at and the trails you're finishing. We never show percentages of an area or ask people to cover ground. One iconic biryani counts for more than ten random stalls.
3. **One loud moment.** The only choreographed motion is the sticker landing on the map after a check-in. Everything else moves only when you touch it: sheets follow your finger, buttons respond.
4. **Depth means hierarchy.** We follow Apple's layering: map, then floating controls, then the bottom sheet, then modal sheets. Shadows and blur show which layer you're on, not decoration.
5. **Say it plainly.** We use sentence case and plain verbs ("Check in", "Add a video", "Go"). No all-caps labels or labels above every heading, and no jargon like "hex" or "trail progress widget".
6. **Thumb-first.** Primary actions sit in the bottom third. Touch targets are at least 44 pt. The sheet has three heights: peek, half and full.

## Colour

The palette borrows from a South Indian meal: a banana leaf, a turmeric stain, a chilli, a steel tumbler.

| Token | Hex | Role |
|---|---|---|
| Leaf | `#1E7A4C` | Brand and primary action ("I ate here", "Check in") |
| Turmeric | `#F2B01E` | Collected: sticker rims, earned badges, trail fill |
| Chilli | `#E0452B` | To try: creator-video spots, play buttons |
| Ink | `#16222C` | Primary text, sticker outlines |
| Steel | `#64717D` | Secondary text |
| Tumbler | `#EEF1F3` | Grouped backgrounds, inset lists |

Surfaces are white. The map uses its own muted set so the stickers stay saturated: land `#F3F4EF`, water `#B9DCEB`, parks `#D6E9C6`, roads white with `#E2E4DC` edges, and white 3D buildings shaded by light.

Light only for now. The map is the product, and a dark map hides the stickers (an earlier version was rejected as too dark).

## Type

- **Caprasimo** (display): spot names, sheet titles, sticker captions. Its chunky, rounded letters echo hand-painted shop signboards. Never smaller than 17 px.
- **System UI** (`-apple-system`, SF Pro): everything else. It's native on iPhone, and it reads clearly at small sizes.

Type scale (px): 34 / 24 / 20 / 17 / 15 / 13. Body text is 15 or 17 with line-height 1.4. Weights are 400, 600 and 700 only.

## Layout

```
┌───────────────────────────┐
│ (12 collected)    [◎][3D] │  floating glass controls
│                           │
│     3D street map         │
│   🍛 sticker   ◌ to try   │
│                           │
├───────── ▬▬ ──────────────┤  bottom sheet (peek / half / full)
│ [ I ate here           ]  │
│ Explore │ Collection │ Diary
│ …                         │
└───────────────────────────┘
```

- **Sheet content is left-aligned.** Lists are Apple-style inset groups (one rounded group, hairlines between rows), not a stack of separate cards.
- **Tapping a spot replaces the sheet content** with that spot's detail, with a back button, the way Apple Maps does. It doesn't open another floating card.
- **Stickers are the only rotated or shadowed objects on the map.**

## Stickers

These are hand-built SVG illustrations (`src/lib/stickers.ts`), each on a tinted disc with an ink outline:

dosa · biryani handi · cutting chai · filter coffee · momos · ice cream · bakery bun · burger · banana-leaf meal · street cart · café cup · noodles

| State | Look |
|---|---|
| Collected | Full colour, a thick white rim and a turmeric ring, tilted a few degrees, with a soft drop shadow |
| To try | Faded illustration, a dashed chilli ring, and a small play badge when a video features it |
| Pick | Chosen from what you ate (latest dishes), falling back to the spot type |
