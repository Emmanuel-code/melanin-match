# Peach Match

Foundation shades matched to YOUR skin — built for the deep tones the beauty
industry ignores. Entry for the **YouCam API Skin AI & eCommerce VTO Hackathon**
(deadline Mon Nov 2, 2026, 4:45pm Accra).

Snap a selfie → YouCam AI reads your exact skin tone (plus a Fitzpatrick type and
skin scores for radiance, moisture, clarity, oil balance) → we detect your
undertone (warm / neutral / cool) → match you to the closest foundation shades
from a 78-shade catalog weighted toward deep/dark tones → you see the shade on
your own face with virtual try-on → the app shows its working in a "Why this
match" card.

## Setup

```bash
npm install
```

### YouCam API key (optional for demo)

The app works out of the box in **demo mode** — every API call returns realistic
fake data after a short delay, and the try-on preview shows your original photo.
Screens are labeled "Demo mode" so it's always honest.

To go live:

1. Register on the
   [hackathon Devpost page](https://youcam-api-skin-ai-ecommerce.devpost.com/) —
   they email you a redeem code.
2. Sign up at the [YouCam API portal](https://yce.perfectcorp.com) and verify
   your email.
3. Redeem the code (Account → Redeem Code) for 1,000 free API units.
4. Create a `.env` file:

```
EXPO_PUBLIC_YOUCAM_API_KEY=your_key_here
```

5. Run:

```bash
npx expo start
```

Then open it in Expo Go (dev build needed for camera in production builds —
`npx expo run:android` / `npx expo run:ios`).

## Architecture

```
app/
  _layout.tsx      # expo-router Stack, dark theme
  index.tsx        # Home — pitch, 3 steps, CTA
  onboarding.tsx   # 3-slide intro: the problem, the undertone secret, the proof
  capture.tsx      # Photo capture (camera + gallery) with guidance checklist
  analyzing.tsx    # Pipeline runner with visible step list
  results.tsx      # Match hero, Fitzpatrick + undertone badges, "Why this match"
                   # explainability card, face-quality retake warning,
                   # before/after try-on toggle, alternate shades,
                   # store finder (demo data), share
  audit.tsx        # Two-Way Beauty Intelligence: "Vanity / Makeup Bag Audit"
                   # Test your existing foundation against your skin tone,
                   # Delta-E color science analysis, flash/ash risk detection,
                   # live try-on comparison slider & formula rescue mixing recipes
  store.tsx        # Peach Cosmetics Boutique & WhatsApp concierge pre-order
components/
  ScoreBar.tsx     # Labeled 0–100 bar
  ShadeCard.tsx    # Foundation shade card (swatch + brand + match %)
  StepRow.tsx      # Pipeline step row (pending/active/done)
lib/
  youcam.ts        # YouCam S2S client: upload → task/poll → analyses → VTO.
                   # Handles both makeup-vto result shapes (results.url and
                   # results[].download_url). Mock mode when no API key.
  shades.ts        # Curated foundation catalog: Fenty, MAC, Maybelline,
                   # Black Opal, NARS, Lancôme, L'Oréal, Estée Lauder,
                   # Rare Beauty — 78 shades, weighted toward deep tones
  match.ts         # CIELAB (hexToLab) delta E distance, hue-angle undertone
                   # analysis, undertone-weighted ranking, concealer finder,
                   # match explanations
  pairings.ts      # Lip shades that flatter each undertone
  session.ts       # Session-scoped state (onboarding seen flag)
  theme.ts         # Design tokens (espresso + gold)
```

### How the matching works

1. `uploadPhoto` — selfie goes to YouCam via a presigned PUT
   (`POST /s2s/v2.0/file/<feature>` → PUT binary with `Content-Type` +
   `Content-Length`; skipping those headers breaks the upload).
2. `analyzeSkinTone` — `results.color.skin_color` hex + face quality.
3. `analyzeFitzpatrick` — Fitzpatrick scale I–VI.
4. `analyzeSkin` — `ui_score` (1–100) for acne, oiliness, moisture, radiance.
   SD actions only, never mixed with HD.
5. `findNearestShades` — CIELAB ΔE ranks the catalog, then undertone agreement
   earns a ranking bonus: a shade that flatters your undertone outranks a
   marginally closer depth that would look ashy. Top 3. Undertone itself comes
   from the CIELAB hue angle (≥45° warm, ≤32° cool), and `findConcealerShade`
   applies the makeup-artist rule (same family, L* +5 to +16 lighter).
6. `tryOnFoundation` — `makeup-vto` with `skin_smooth` at **zero strength** so
   the render shows the actual shade, not a beautified blur. The skin_smooth
   entry with 0 strength is required for honest shade rendering.
7. Honesty gates — if `face_quality` < 60 the results screen warns you to
   retake in better light instead of selling a bad match; if the best match
   scores < 75% it says so instead of pretending.

## Hackathon submission checklist

- [ ] Public repo (or private shared with the judging address) with this code
- [ ] Text description: features + consumer value (see pitch in app/index.tsx)
- [ ] Screenshots: home, capture, analyzing, results (before/after)
- [ ] 1–3 min demo video on YouTube showing the flow end-to-end on a real
      phone, naming the YouCam APIs used
- [ ] Exit interview if selected as a winner
- [ ] Agree to be featured in their blog article

## Notes

- Shade hexes in `lib/shades.ts` are approximate — good enough for the demo,
  verify against real swatches before any production use.
- Store list in `app/results.tsx` is clearly-labeled demo data.
- Skin scores are AI estimates, not medical advice.
