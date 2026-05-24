# OreIQ MVP App Design

Date: 2026-05-24

## Goal

Build a working local MVP app for OreIQ that lets a user enter a junior mining company, add source material, generate a source-cited due-diligence report, save it to a watchlist, and export the report without needing a backend.

## Current Context

The repository already contains:

- Product requirements in `docs/prd.md`.
- MVP sequencing in `docs/mvp-plan.md`.
- Landing-page design direction in `docs/landing-page-design.md`.
- A polished static landing variant in `landing-v4/`.

Those files define the first product as a junior-mining due-diligence assistant, not a generic AI stock picker. The first usable build should therefore be a thin local app that proves the workflow: company intake, source capture, report generation, scorecard, evidence, watchlist, and export.

## Chosen Approach

Create a standalone static app in `app/` and leave `landing-v4/` intact as the marketing surface. The app will work from `file:///` or any static server and use browser localStorage for saved reports. The report generation will be deterministic and clearly local for this MVP; real OpenAI/Supabase/Stripe integrations remain a backend phase.

## Core User Flow

1. User opens `app/index.html`.
2. User enters company/ticker, exchange, commodity, stage, jurisdiction, and market cap.
3. User adds source URLs, source text, or file references.
4. User clicks Generate report.
5. App creates a mining-specific due-diligence report with:
   - Final due-diligence rating.
   - Confidence level.
   - Mining scorecard.
   - Executive summary.
   - Red flags.
   - Hype/sentiment assessment.
   - Catalyst timeline.
   - Missing information.
   - Evidence table with fact/inference/missing-data labels.
6. User can save the report, reload it from the watchlist, export Markdown, or print.

## Boundaries

In scope:

- Static browser app.
- Testable report engine.
- Local source parsing from user-entered URLs/text and selected file names.
- Local watchlist persistence.
- Markdown export.
- README instructions.
- Link from the latest landing page to the app.

Out of scope for this first local build:

- User accounts.
- Server-side PDF parsing.
- Real OpenAI API calls from the browser.
- Stripe checkout.
- Live market data.
- Automated filing/social ingestion.

## Error Handling

- Empty company/ticker input shows a visible form error.
- Missing source material lowers report confidence and shows missing-data warnings.
- File upload records unsupported PDF/file metadata but does not pretend to parse PDFs.
- localStorage failures degrade to the current in-memory report and show a visible status message.

## Testing

Use Node's built-in test runner for the core report engine:

- Report contains no direct buy/sell language.
- Promotional source text raises hype risk.
- Missing source material lowers confidence and creates missing-information evidence.
- Source URLs and file names appear in evidence citations.
- Strong catalyst/source cues improve catalyst and project scores.

Manual browser verification:

- Open `app/index.html`.
- Generate a report from the default sample.
- Save to watchlist.
- Reload a watchlist item.
- Export Markdown.
- Check desktop and mobile layout with screenshots.

## Implementation Approval

The repo's existing PRD, MVP plan, and landing design already define the product enough for a first build. This spec narrows the implementation to a local static MVP app so the user can try the product immediately while preserving the larger SaaS path.
