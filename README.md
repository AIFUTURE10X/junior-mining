# OreIQ

OreIQ is a junior mining due-diligence assistant. The current build turns company details and user-supplied sources into a mining-specific research report with scorecard, red flags, hype assessment, missing data, evidence citations, watchlist storage, and Markdown export. It still works as a direct local static app, and Stage 1 now adds a hosted report-job API that can persist jobs and finished reports to Neon Postgres.

## Open The App

Use either path:

- App: `app/index.html`
- Latest landing page: `landing-v4/index.html`

The app works from a direct browser file open. No dev server is required for local demo mode.

Optional static server:

```powershell
npx serve .
```

Then open the shown local URL and go to `/app/`.

Hosted report-job mode uses `/api/report-jobs`, so use a Vercel-compatible dev server or deployment when testing Neon persistence.

## Stage 1 Backend

Stage 1 adds the first backend slice without replacing the static app:

- Neon schema migration: `db/migrations/001_stage1_report_jobs.sql`.
- Vercel-style API route: `api/report-jobs.js`.
- API helper modules and tests under `api/_lib/`.
- Browser API client: `app/jobApi.js`.
- Hosted mode persists queued, processing, ready, and failed report jobs, plus finished reports, evidence items, and scorecard items.
- Hosted mode uses on-demand Neon sync to avoid waking the database on every page load.
- Direct `file:///` mode keeps using localStorage so the app remains easy to open locally.

Required hosted environment variable:

```powershell
DATABASE_URL=postgresql://[user]:[password]@[neon_hostname]/[dbname]
```

`NEON_DATABASE_URL` is also accepted as a fallback name.

Cost-control notes and helper scripts are documented in `docs/neon-cost-control.md`.

## What Works Now

- Company/ticker intake.
- Commodity, stage, jurisdiction, exchange, and market-cap fields.
- Source URL and source text capture.
- TXT/MD/CSV file text parsing in the browser.
- PDF/file metadata capture for source queueing.
- Deterministic local due-diligence report generation.
- Mining scorecard with confidence and rationales.
- Red flags, catalysts, missing-information list, hype/sentiment assessment, and evidence table.
- Valuation metrics and peer comparison table for P/NAV, EV/oz, AISC, EV/EBITDA, P/CF, and reserve life.
- Public expert signal capture for sources such as interviews, public articles, or posts.
- Expert signal report section with non-affiliation and non-advice guardrails.
- Report-job queue with queued, processing, ready, and failed states.
- Optional Neon-backed report-job persistence when hosted with `DATABASE_URL`.
- Local watchlist saved in browser localStorage.
- Markdown export and print.

## Important Boundary

Direct local mode does not call OpenAI, Stripe, or live market-data APIs. Hosted Stage 1 can call Neon for report-job persistence, but it is not the full SaaS backend yet. The next backend phase should add:

- Auth via Neon Auth, Clerk, or Auth.js.
- Storage and server-side PDF extraction.
- OpenAI report generation with citations.
- Firecrawl/Apify source collection.
- Stripe paid report checkout or subscription.
- Email/in-app alert jobs.

## Verification

Core report-generation behavior is covered by Node's built-in test runner:

```powershell
npm test
```
