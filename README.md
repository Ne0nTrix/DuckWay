# DuckWay

Find an open, clean toilet near you in two taps. Frontend only — plain HTML, CSS and JavaScript, no build step.

## Run it

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. Use `localhost` (or HTTPS) — browsers only share GPS location and the microphone on secure origins.

## What is inside

| Screen | What it does |
| --- | --- |
| **Explore** | Map with colourful pins, GPS location, place search, filters, sorting, the list of nearby toilets, the toilet card and the one-tap **Find nearest toilet** route (Ducky waddles along it). |
| **Host** | List your own toilet for a small fee and answer guest requests. |
| **Community** | Trust points, ranks, daily quests, badges, leaderboard, preferences for Ducky's pick. |

The search bar also understands plain requests ("free clean toilet nearby") and voice.

### Things that move (handy for a demo video)

- Opening splash and a three-step welcome pop-up (replay it from Ducky's menu, bottom left).
- Pins drop in, cards slide in, counters tick up; the selected pin pulses.
- **Find nearest toilet** → animated route with Ducky walking it → **I'm here!** → confetti and a "rate it" pop-up.
- Every contribution: a coin flies to the points counter, confetti, badge and quest banners, a rank-up pop-up at 40 points.
- Ducky's speech bubble shows tips and sample "happening nearby" updates every ~16 seconds.
- **Reset my data** at the bottom of Community brings the welcome pop-up and empty badges back for another take.

## What is real and what is simulated

- **Real:** toilet, café, mall and gas-station locations (OpenStreetMap via the Overpass API), map tiles, place search and addresses (Nominatim), walking routes (OSRM at routing.openstreetmap.de). No API keys are needed.
- **Sample data:** ratings, reviews, photos, live status, the "happening nearby" updates and the private hosts. Where OpenStreetMap has no tag for price, hours or accessibility, the value is a stable sample too.
- **Simulated:** payments, host approval and incoming guest requests.
- **AI:** runs in the browser with no model behind it — a rule-based request parser, a recency-weighted cleanliness score and a scoring function for recommendations (`js/ai.js`). Swapping in a real LLM needs a small backend to keep the API key private.
- Everything a user adds (reviews, reports, photos, toilets, listings, points) is stored in `localStorage`.

If OpenStreetMap cannot be reached, the app shows sample toilets and a **Retry live data** button.

## Files

```
index.html
css/styles.css
js/core.js      helpers, storage, trust points
js/data.js      OpenStreetMap loading, sample data, toilet status
js/ai.js        cleanliness score, recommendations, request parser
js/fun.js       Ducky the mascot, confetti, pop-ups, badges, daily quests, live updates
js/explore.js   map, search, filters, list, navigation, voice
js/detail.js    toilet card, reviews, reports, booking, add-toilet forms
js/views.js     Host and Community screens
js/main.js      start-up
```
