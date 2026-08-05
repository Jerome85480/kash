# CLAUDE.md

Guidance for AI assistants (Claude Code etc.) working in this repository.

## What this repo is

This repository hosts **two independent vanilla web apps** deployed together on
**Vercel** as static files plus a couple of serverless functions. There is **no
build step, no framework, no bundler, and no `package.json`** at the root. You
edit HTML/JS directly and deploy.

1. **Kash** (root `/`) — a French-language personal-finance PWA for young adults.
   Single file `index.html` (~2300 lines) containing all HTML, CSS, and JS.
   Backend is **Supabase** (auth + Postgres + Storage), called directly from the
   browser over REST. Two third-party AI services are called client-side
   (statement parsing + a financial advisor).

2. **Piscine Avenue** (`/piscine/`) — a French-language tool for a pool company
   that overlays a photorealistic fiberglass pool onto a customer's yard photo.
   Single file `piscine/index.html` (~930 lines). Uses a Vercel serverless
   function that proxies **Google Gemini 2.5 Flash Image** ("nano-banana").

The two apps share the same Vercel deployment and the `api/` serverless
functions but are otherwise unrelated. The UI language is **French** throughout —
match it (user-facing strings, comments, commit messages are all in French).

## Repository layout

```
/
├── index.html              # Kash app — entire app (HTML+CSS+JS) in one file
├── manifest.json           # Kash PWA manifest
├── sw.js                   # Kash service worker (cache name: kash-vN)
├── icons/                  # Kash PWA icons + icon.svg source
├── generate-icons.js       # node script: regenerate PNG icons from icon.svg (needs `sharp`)
├── sql/setup.sql           # Supabase schema + RLS policies for Kash
├── vercel.json             # Vercel config (serverless fn maxDuration)
│
├── api/                    # Vercel serverless functions (Node, ESM .mjs)
│   ├── render.mjs          # POST: proxy to Gemini image model (Piscine)
│   └── plan.mjs            # GET ?url=: CORS proxy for generationpiscine.com images
│
└── piscine/               # Piscine Avenue app
    ├── index.html          # entire app in one file
    ├── manifest.webmanifest
    ├── sw.js               # piscine service worker (cache: piscine-av-vN)
    ├── data/models.json    # 59 pool models scraped from generationpiscine.com
    ├── assets/             # logo + PWA icons
    └── README.md           # piscine-specific deployment notes
```

## Architecture & key facts

### Kash (`index.html`)
- **Single-file app.** All logic lives in inline `<script>` blocks. Functions
  are global; UI is shown/hidden by toggling a `hidden` class on `#screen-*` /
  `#dashboard` and `.tab-pane` elements (`showScreen()`, `switchTab()`).
- **Supabase** config is at the top of the script (`SUPA_URL`, `SUPA_KEY` =
  the public **anon** key — safe to ship). All data access goes through
  `supaFetch()` which calls the Supabase REST API (`/rest/v1/...`) and
  auto-refreshes the JWT on 401 via `refreshToken()`. Auth tokens live in
  `localStorage` (`kash_token`, `kash_refresh`, `kash_user`).
- **Data model** (see `sql/setup.sql`): `profiles`, `transactions`,
  `savings_goals`, `debts`. Row Level Security is enabled — every table is
  scoped to `auth.uid()`. Any schema change must update `sql/setup.sql` AND be
  applied to the live Supabase project (SQL Editor) — there are no migrations.
- **Four dashboard tabs:** `flux` (transactions), `epargne` (goals), `dettes`
  (debts), `stats`. Plus modals for add-transaction, scan, import, AI advisor.
- **Client-side AI calls.** Statement import (`parseWithAI`, `classifyAndPreview`)
  and the financial advisor (`openAIAdvisor`) call **Z.AI** (`api.z.ai`,
  model `glm-4.5-flash`). NOTE: the Z.AI bearer token is currently hardcoded in
  `index.html` — it is exposed to the client. Do not add more secrets this way;
  if you touch this area, prefer routing through a serverless function.
- **Receipt OCR** uses `Tesseract.js` (loaded from CDN) for on-device OCR
  (`handleReceiptFile` → `parseReceiptText`). Bank-statement import also reads
  PDFs via `pdf.js` (CDN) and CSVs.
- **Receipts storage:** uploaded to Supabase Storage (`uploadReceiptToStorage`),
  URL saved on the transaction row (`receipt_url`).
- **Other features:** recurring transactions (`setupRecurring`/`renderRecurring`),
  budget alerts + Web Notifications, SVG charts drawn by hand (`renderChart`,
  `renderSixMonthChart`, donut in `renderStats`), month navigation.

### Piscine (`piscine/index.html`)
- Loads the catalogue from `data/models.json` (cache-busted with `?v=N`).
- The flow: pick a model → load the customer's yard photo → optionally draw a
  zone box → call `/api/render` which proxies Gemini and returns a generated
  image. The real model photo is fetched through `/api/plan` (CORS proxy) and
  sent to Gemini as a second image so the shape/water tint are reproduced
  faithfully.
- Generates a printable client PDF/fiche via a `window.print()` popup.

### Serverless functions (`api/`)
- ESM `.mjs` with a default `export default async function handler(req, res)`
  (Vercel Node runtime).
- `render.mjs`: requires env var **`GEMINI_API_KEY`** (server-side only, never
  in client code). Maps Gemini errors to friendly French messages. `maxDuration`
  60s (set in `vercel.json`).
- `plan.mjs`: GET CORS proxy restricted to `generationpiscine.com` URLs only.

## Conventions

- **Language:** French for all user-facing text, code comments, and commit
  messages. Existing commits follow Conventional Commits scoped style, e.g.
  `feat(piscine): ...`, `fix(piscine): ...`.
- **No framework / no build.** Don't introduce npm dependencies, bundlers, or a
  build pipeline unless explicitly asked. Keep apps as single self-contained
  HTML files with inline CSS/JS. Match the existing terse, vanilla style.
- **Secrets:** real secrets (e.g. `GEMINI_API_KEY`) go in Vercel env vars and
  are read only inside `api/*.mjs`. The Supabase anon key is public by design.
  Be aware the Z.AI key is currently inlined (pre-existing); don't replicate that
  pattern for new secrets.
- **Service workers & caching:** when you change cached assets, bump the cache
  name (`kash-vN` in `sw.js`, `piscine-av-vN` in `piscine/sw.js`). Both SWs
  deliberately **never cache** `/api/`, Supabase, or the piscine app responses.
  Likewise the `?v=N` query on `models.json` and CDN script tags is a manual
  cache-bust — bump it when the underlying file changes.
- **Icons:** Kash icons are generated from `icons/icon.svg` via
  `node generate-icons.js` (requires `npm install sharp` locally).

## Workflows

- **Run locally:** serve the repo root with any static server, e.g.
  `python3 -m http.server 8000`, then open `/` (Kash) or `/piscine/`
  (Piscine). The `/api/*` functions only run under Vercel — use
  `vercel dev` if you need them locally.
- **Deploy:** push to the repo; Vercel builds/serves the static files and the
  `api/` functions. `GEMINI_API_KEY` must be set in the Vercel project.
- **Schema changes:** edit `sql/setup.sql` and run the SQL in the Supabase SQL
  Editor (project ref `mwpkwmsxolatcuzfxnzt`). No automated migrations exist.
- **There are no tests, linters, or CI** in this repo. Verify changes by
  loading the app in a browser.

## Gotchas

- Both apps are large single files — use search to locate functions rather than
  reading top to bottom. Functions are global and called from inline `onclick`
  handlers, so renaming a function means updating its HTML call sites too.
- Editing Kash means editing both the markup near the top of `index.html` and
  the script block lower down — keep element IDs in sync.
- After changing assets that a service worker caches, bump the SW cache version
  or users will keep the stale copy.
