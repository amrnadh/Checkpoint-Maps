# CheckPoint-MAPS — Agent Brief v2

> Full context for Claude or any LLM agent working on this project.
> Last updated: 18 Nov 2026 · Supersedes the v1 brief (Sept 2026).
> Status: niche chosen (food spots), platform chosen (PWA), game-first v1 confirmed. Next step: clickable prototype (Game mode vs Diary mode), then the Stage 0 validation sprint.

---

## 0. TL;DR for the agent

- **What:** A gamified food map. Every place you eat becomes a checkpoint, your city's map gradually "unlocks," and you complete food collections.
- **Who (v1):** Food-spot hunters, meaning people who chase street food, local eateries, and hidden cafés in their own city.
- **Hook:** It's fun **with zero friends on the app**. The game layer is solo, and social features come later.
- **Platform:** An installable PWA (React/Vite), with Cloudflare Workers + D1 + R2 behind it.
- **Goal:** Both a strong portfolio piece **and** a real product with room to grow, so polish and real-user validation both matter.
- **Your role:** Be a thinking partner and builder. Ask before assuming, keep scope tight, and push back when a request breaks the principles in §4.

---

## 1. Origin: the v1 idea

CheckPoint-MAPS started as a general location-based app for marking, tagging, and sharing visited spots on an interactive map. It was meant to be a visual diary of travels and interests.

**Problem it addressed:** There's no simple, social way to record and show off places you've been. Note apps have no sense of location, map apps have no personal tagging or sharing, and Instagram has no geographic structure.

**Originally proposed features:** tap-to-add checkpoints (photo, note, tags), social discovery and following, Google Maps and calendar sync, badges for categories and itineraries.

## 2. Evaluation: why it changed

**Strong:** The "tap, tag, share" mechanic is intuitive. The visual diary has emotional pull. Real-world exploration games (Foursquare/Swarm, Pokémon GO) have proven staying power.

**Problems:**
1. **Brutal competition** for a general version: Google Saved Places, Instagram geo-tags, Yelp, TikTok Places, Polarsteps, Wanderlog, Visited.
2. **Too many features at once.** Each feature is its own product, and building six of them to 60% loses to apps that do one thing at 95%.
3. **Cold start.** Social discovery is empty until there's a network.
4. **"Built for everyone" means no one adopts it first.**

**v1 verdict:** Worth building, but not as described. Pick a niche, own it, then expand.

## 3. Decisions made (v2)

| Decision | Choice | Why |
|---|---|---|
| Niche | **Food spots** (street food first, plus local eateries and cafés) | The founder uses it personally. People eat out often, so it gets weekly use. Strong urge to share. Yelp's review model serves street stalls badly. |
| Game layer | **Core of v1, solo-only** *(confirmed 18 Nov 2026)* | Fixes cold start: the app is fun before any network exists. It's also the main thing separating it from Google Saved Places, which is a passive list. A plain **Diary mode** is kept in the prototype as the comparison baseline. |
| Build approach | **Prototype first**, then the real build | A throwaway clickable prototype with a Game/Diary toggle lets the founder and testers feel the difference before any backend work. |
| Platform | **PWA** | Uses the existing React/Vite + Cloudflare stack. Camera, GPS, and installability all work. Fastest to ship. |
| Goal | **Portfolio + real product** | Ship polished and technically interesting work, and measure real retention. |
| Social | **Deferred** to Stage 2 | Only after solo use proves people come back. |
| Creator layer | **In v1** *(added 18 Nov 2026)*: spots from food creators' YouTube / Instagram videos appear as pink "to try" pins, grouped into **creator trails**; eating there gives a "Seen it, ate it" stamp | Go-to-market: partner with local food creators. Their videos already make people want to visit a place; the app is where viewers act on it. It is also seeded content that keeps the app fun with zero friends (principle 1). |
| Look | **Daylight map + sticker book** *(18 Nov 2026, replaces the dark "night market" theme)*: a light, quiet 3D street map (white buildings, sky at the horizon) with illustrated food stickers as the only colour. Apple-style bottom sheet. Full system in `DESIGN.md` | The dark map hid the food and the UI read as generic. |
| Progress model | **Collect places, not territory** *(18 Nov 2026)*: hex fog and "% of city explored" removed. Progress = spots collected (stickers), food trails, creator trails, dishes, badges | Foodies chase famous and iconic spots, not every block. Some areas have one spot worth going to. |

**Change from v1:** The v1 brief said "no gamification in v1." v2 reverses that, because the solo game layer *is* the answer to cold start. Social, leaderboards, and following stay out of v1.

## 4. Product principles

1. **Fun alone first.** Every v1 feature must work for a single user with no friends on the app.
2. **One core action, done perfectly:** "I ate here" in under 10 seconds (GPS, then pick or create the spot, a photo, the dish, done).
3. **Food-native depth over breadth.** Use dishes, cuisines, and price as categories, not generic place types.
4. **User-created spots are first-class.** Street stalls are often missing from OpenStreetMap or Google, and that gap is a feature.
5. **Private by default.** Location history is sensitive, so check-ins are private unless shared.
6. **Distinctive look.** It should feel like a street-food zine or market stall, not a generic map app.

## 5. The product (v1 / MVP)

### Core loop
**Eat somewhere** → **check in** (GPS + photo + dish + a quick 😐/🙂/🤩 rating) → **reward** (a map hex unlocks, collection progress, a new dish in your passport) → **share card** → **find the next spot** on your map or in a collection.

### Features in v1
- **Food map:** a map of your check-ins, with spot markers styled by cuisine.
- **Quick check-in:** finds the nearest spot or creates a new one. Fields: photo, dish name(s), note, 1–3 tags, rating.
- ~~Food fog~~ *(removed 18 Nov 2026, see §3 Progress model)*. Each collected spot becomes an illustrated sticker on the map instead.
- **Collections:** curated checklists such as "Best biryani trail: 4/12" or "Every chai stall on X Road." The founder seeds them at launch.
- **Dish passport:** dishes tried, cuisines unlocked, and simple milestone badges.
- **Streak:** "a new spot every week." Weekly rather than daily, so it isn't stressful.
- **Share cards:** an auto-generated image or link for a check-in, a collection, or a monthly "Food Wrapped." **This is the growth engine.**
- **Diary view:** a list/map toggle and timeline.

### Explicitly out of v1
Following and social graph · leaderboards · a recommendation engine · Google Maps/calendar sync · searching other users' check-ins · reviews/ratings visible to others · monetization.

### AI touches (optional, only if cheap and delightful)
- Claude vision API: suggest the dish name and cuisine tags from the photo.
- Monthly "Food Wrapped" summary text.

## 6. Tech plan

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite, PWA (vite-plugin-pwa) | Installable, with the camera via `<input capture>` |
| Map | **MapLibre GL JS** + OpenFreeMap or Protomaps tiles | Free. WebGL makes custom fog layers and styling easy. (Leaflet struggles with fog; Mapbox costs money at scale.) |
| Hex grid | **h3-js** (resolution ~8–9) | Fog cells are stored as strings, so no PostGIS is needed |
| API | Cloudflare Workers (Hono) | |
| DB | Cloudflare D1 | Map-area queries on lat/lng indexes, plus H3 cell columns |
| Photos | Cloudflare R2 (presigned uploads), resized on the client first | |
| Auth | Clerk, or magic-link email | Keep it simple |
| Offline | Queue check-ins in IndexedDB and sync when back online | Market streets often have poor signal |
| Spot data | Seed from the OSM Overpass API (amenity=restaurant/fast_food/cafe), and let users create spots | |

### Data model (separating spots from check-ins keeps future social features cheap)
- `users` (id, handle, home_city, created_at)
- `spots` (id, name, lat, lng, h3_cell, source [osm|user], osm_id?, cuisine_tags, created_by)
- `checkins` (id, user_id, spot_id, dishes[], photo_key, note, tags[], rating, visibility, created_at)
- `user_cells` (user_id, h3_cell, first_unlocked_at): powers the fog
- `collections` (id, title, city, description, curated_by) and `collection_spots` (collection_id, spot_id, order)
- `badges` / `user_badges`: these can be computed at first

### Build order
1. MapLibre map with a styled base map that feels food-native
2. Quick check-in flow (GPS → nearby spots → create spot → photo/dish/rating), stored locally first
3. Workers API + D1 persistence, R2 photo upload, offline sync queue
4. Food fog (h3 cells → fog layer on the map) and the "% explored" stat
5. Collections (seeded) with progress tracking
6. Dish passport + badges + weekly streak
7. Share cards (server-rendered OG images on Workers) + public link pages
8. Auth, PWA install, polish, and real-device testing on a phone

## 7. Roadmap

### Stage −1: clickable prototype (≈1 week, throwaway)
- **What it is:** a single-page, front-end-only prototype with a fictional city, seeded spots, and fake data. It has no backend, no auth, and no real maps. It exists to test the *feel* of the loop, not the tech.
- **Two modes behind one toggle:**
  - **Diary mode** (baseline): check in → pin + photo + note saved → diary list. No fog, collections, passport, or streak.
  - **Game mode** (the v1 bet): same check-in, then the reward moment: a hex un-fogs, "% explored" rises, collection progress, a dish-passport stamp, a weekly streak, and a share card that shows progress.
- **How to judge it:**
  - The founder uses each mode for a few days (or plays 10 check-ins in each).
  - Show it to 5–10 food people and let them try both modes. Ask: *Which would you open again next week? Which made you want to go somewhere new? What would you share?*
  - Watch for: delight at the reward moment, whether people open Collections without prompting, and whether they ask "where's the next one?"
- **Decision rule:** if most testers prefer Diary mode or ignore the game screens, drop the game to a light layer and rethink the hook. Otherwise build game-first as planned.
- **Deliverable:** a short note on which mode won, with quotes, plus the 3 things to change before the real build.
- The real build (Stage 1) starts fresh with the stack in §6. Reuse only the UI ideas, not the prototype code.

### Stage 0: validation sprint (≈1 week, minimal code)
- The founder logs ~15 food check-ins manually (a spreadsheet or a rough prototype) to feel out the loop.
- Talk to 5–10 food-obsessed people: How do you track spots now? What do you share? Would "unlocking your city" make you go somewhere new?
- Find where the communities are: city food subreddits, Instagram food pages, local food-walk groups, Discord servers.
- Map how they cope today (Google lists, Instagram saves, Notes app, Zomato/Swiggy/Yelp bookmarks).
- **Go signal:** at least 5 people say they'd use it weekly, **and** at least 2 ask "when can I try it?"
- **Deliverable:** a one-page memo covering the launch city, top 3 unmet needs, 5 seed collections, and the go/no-go decision.

### Stage 1: MVP (≈4–6 weeks of side-project time)
- Build §5 in the order in §6.
- Beta with 10–20 food people in one city.
- **Success metrics:** check-ins per user per week (target ≥2), 4-week retention (target ≥30%), collections started and completed, share cards generated.

### Creator partnerships (runs alongside Stage 1)
- **Pitch to creators:** "Put your reels on a map. Viewers get a trail of your spots, and you see how many people actually went." Visits are counted from check-ins, never live location.
- **v1 (built):** anyone can add a YouTube/Instagram link + creator handle + place, and it becomes a "to try" pin and a creator trail. Stored on-device for now.
- **Next:** creator-curated trails published from the founder's account (D1), a public trail page per creator (`/c/@handle`) to link from video descriptions or bios, and aggregate "people who went" counts that creators can quote.
- **Rules:** link to and embed the creator's video, never re-host it. No paid placement for restaurants (see Stage 3). Creator content must be clearly attributed.
- **Open question:** do viewers add videos themselves, or only the founder/creators? (Recommendation: founder + invited creators first, for quality.)

### Stage 2: social (only after 20–50 actives and real retention)
- Friends and following, plus a friends' food map overlay
- **Shared collections / "where should we eat" lists built together:** the collaborative map from the v1 evaluation
- Public profiles, community-curated collections
- Friend leaderboards per collection

### Stage 3: grow and monetize
- Discovery and recommendations ("people who liked these 5 stalls also loved…")
- Expanding to more cities, and travel mode (unlock other cities)
- Revenue options: premium (themes, Wrapped extras, unlimited collections), paid creator collections or food walks, partnerships with local food tours. **No paid placement for restaurants**, because it would destroy trust.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Cold start / empty app | A solo game layer plus seeded collections for the launch city |
| Missing or incorrect spot data for stalls | User-created spots, merge duplicates by proximity + name |
| Battery drain | Check in on demand only, no background tracking |
| Privacy (revealing home or routine) | Private by default, fuzzy location on share cards, never show live location |
| Gamification feels hollow | Rewards tied to *real discovery* (new hex, new dish), not just tapping |
| Scope creep | §4 principles + the out-of-scope list in §5. The agent should flag any violation. |

## 9. Open questions (agent: raise these early)

1. **Prototype verdict:** did Game mode beat Diary mode with real testers? (See Stage −1.)
2. **Launch city and neighbourhood:** which one, and how dense is its street food?
3. **Scope of "food spots":** street food only, or also cafés, bakeries, and restaurants? (Recommendation: everything edible, but street food sets the tone and the collections.)
4. **Name and brand:** keep "CheckPoint-MAPS," or move to something food-native? What's the visual reference (zine, market signage, retro game map)?
5. **Ratings:** private-only in v1, or visible on share cards?
6. **H3 resolution:** neighbourhood-sized hexes or street-block-sized?

## 10. How the agent should work

- Start each session by asking which **stage** we're in and what was decided since the last update to this brief.
- For product questions, give **one recommendation with reasoning**, not a list of options.
- For build work, follow the build order in §6. Keep each step shippable and testable on a real phone.
- Check every feature against §4. If it fails "fun alone first" or "one core action," say so.
- Keep this brief up to date: move resolved items from §9 into §3.

## Founder context
Solo full-stack dev (React/Vite, vanilla HTML/CSS/JS, Cloudflare Workers, Claude API). Bootstrapped, no deadline, quality over speed. High design bar: distinctive, not generic.
