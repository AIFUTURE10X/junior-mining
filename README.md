# OreIQ

OreIQ is a junior mining due-diligence assistant. The current build is a local static MVP app that turns company details and user-supplied sources into a mining-specific research report with scorecard, red flags, hype assessment, missing data, evidence citations, watchlist storage, and Markdown export.

## Open The App

Use either path:

- App: `app/index.html`
- Latest landing page: `landing-v4/index.html`

The app works from a direct browser file open. No dev server is required.

Optional static server:

```powershell
npx serve .
```

Then open the shown local URL and go to `/app/`.

## What Works Now

- Company/ticker intake.
- Commodity, stage, jurisdiction, exchange, and market-cap fields.
- Source URL and source text capture.
- TXT/MD/CSV file text parsing in the browser.
- PDF/file metadata capture for source queueing.
- Deterministic local due-diligence report generation.
- Mining scorecard with confidence and rationales.
- Red flags, catalysts, missing-information list, hype/sentiment assessment, and evidence table.
- Public expert signal capture for sources such as interviews, public articles, or posts.
- Expert signal report section with non-affiliation and non-advice guardrails.
- Local report-job queue with queued, processing, ready, and failed states.
- Local watchlist saved in browser localStorage.
- Markdown export and print.

## Important Boundary

This local MVP does not call OpenAI, Neon, Stripe, or live market-data APIs. It is a working product workflow and demo surface, not the final hosted SaaS backend. The next backend phase should add:

- Neon Postgres for users, companies, report jobs, sources, saved reports, watchlists, and alerts.
- Auth via Neon Auth, Clerk, or Auth.js.
- Storage and server-side PDF extraction.
- OpenAI report generation with citations.
- Firecrawl/Apify source collection.
- Stripe paid report checkout or subscription.
- Email/in-app alert jobs.

## Verification

Core report-generation behavior is covered by Node's built-in test runner:

```powershell
node --test app\reportEngine.test.cjs
```
