# OreIQ App Build-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build OreIQ from the current Stage 1 demo into a paid, source-cited junior mining due-diligence MVP aligned with `docs/prd.md`.

**Architecture:** Keep the current static landing and app surfaces while adding backend slices through Vercel serverless API routes, Neon Postgres, and focused browser modules. Do not rewrite into Next.js until the existing static app and API shape block a required workflow; the current repo already has working report generation, report-job persistence, design tokens, and Vercel deployment.

**Tech Stack:** Static HTML/CSS/JavaScript, Vercel serverless functions, Neon Postgres, OpenAI API, Firecrawl/Apify for optional source collection, Stripe Checkout, Node built-in test runner, `DESIGN.md` tokens.

---

## Scope Check

The PRD covers multiple independent systems: account access, source ingestion, AI report generation, watchlists, alerts, and payments. Treat this file as the master build-out plan. Execute one phase at a time, and create a smaller task plan before coding any phase that touches more than one subsystem.

This plan starts from the current repo state:

- `landing-v4/` is the latest marketing surface and should remain the public entry point.
- `app/` is the product surface and already supports company intake, manual sources, deterministic reports, valuation signals, expert signals, watchlist storage, Markdown export, and a PRD page.
- `api/report-jobs.js` and `api/_lib/` already provide Stage 1 report-job persistence for hosted mode.
- `db/migrations/001_stage1_report_jobs.sql` already defines users, companies, report jobs, sources, reports, evidence, scorecards, watchlist items, and alerts.
- `DESIGN.md` is the design-system source of truth.

## Product Guardrails

- OreIQ is research software, not a broker, adviser, or trading system.
- Avoid direct buy/sell language in UI, reports, emails, and payment copy.
- Every high-impact conclusion must be either source-cited, labeled as inference, or marked as missing evidence.
- Hosted mode must stay on-demand where possible. Do not wake Neon on every page load.
- Keep app controls operational and dense. Do not turn the app into a marketing page.

## Design System Requirements

- Keep `DESIGN.md` as the normative design language.
- App surfaces should use graphite panels, copper/gold actions, green verification, red risk, and blue only for chart/market signals.
- Cards and controls should keep 8px radii.
- Preserve the cockpit layout: intake/source controls, generated report, scorecard/evidence, watchlist, and alerts.
- Run design lint when practical:

```powershell
npx @google/design.md lint DESIGN.md
```

If the lint package is unavailable or changes upstream, record the exact failure and continue with manual token review.

## File Structure

Current files to preserve and extend:

- `app/index.html`: Product app shell and navigation.
- `app/app.js`: Browser UI orchestration, local mode, hosted mode, export, watchlist, report rendering.
- `app/reportEngine.js`: Deterministic local report engine and shared report shape.
- `app/reportEngine.test.cjs`: Report engine tests.
- `app/jobStore.js`: Report-job state transitions.
- `app/jobStore.test.cjs`: Job state tests.
- `app/jobApi.js`: Browser client for hosted report-job API.
- `app/styles.css`: App UI styles mapped to `DESIGN.md`.
- `api/report-jobs.js`: Hosted report-job API route.
- `api/_lib/reportRepository.cjs`: Neon persistence.
- `api/_lib/reportValidation.cjs`: API input validation.
- `api/_lib/*.test.cjs`: API helper tests.
- `db/migrations/001_stage1_report_jobs.sql`: Stage 1 schema.
- `docs/prd.md`: Product requirements reference.
- `docs/oreiq-build-roadmap.html`: Visual roadmap that should be updated when phases complete.

Likely new files by phase:

- `api/companies.js`: Company profile lookup/create/update API.
- `api/sources.js`: Source metadata and extraction API.
- `api/generate-report.js`: AI report generation endpoint or job worker entry.
- `api/watchlist.js`: Hosted watchlist API.
- `api/alerts.js`: In-app alert API.
- `api/checkout.js`: Stripe Checkout session API.
- `api/_lib/openaiReport.cjs`: OpenAI report prompt, schema, and validation.
- `api/_lib/sourceExtraction.cjs`: PDF/text/URL extraction helpers.
- `api/_lib/accessControl.cjs`: User/session/access checks.
- `db/migrations/002_auth_access_sources.sql`: Auth/access/source schema updates.
- `db/migrations/003_ai_reports_watchlist_alerts.sql`: AI reports, alert jobs, and watchlist hardening.
- `docs/verification/*.png`: Desktop and mobile verification captures for major UI changes.

## Phase 0: Baseline And Safety Gate

**Goal:** Freeze the current known-good baseline before feature work.

**Files:**
- Read: `docs/prd.md`
- Read: `DESIGN.md`
- Read: `README.md`
- Read: `docs/oreiq-build-roadmap.html`
- Modify: none unless verification notes need updating

- [ ] **Step 1: Confirm branch and dirty state**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected: branch is an intentional feature branch, and only user-approved files are dirty. Untracked PDFs such as research material should not be staged unless the user explicitly asks.

- [ ] **Step 2: Run the current automated checks**

Run:

```powershell
npm test
node --check app/app.js
node --check app/jobApi.js
node --check api/report-jobs.js
```

Expected: all Node tests pass and syntax checks complete without errors.

- [ ] **Step 3: Verify deployed routing**

Check the deployed app paths:

```powershell
$urls=@(
  "https://landing-v4-beta.vercel.app/index.html",
  "https://landing-v4-beta.vercel.app/app/index.html",
  "https://landing-v4-beta.vercel.app/app/prd.html"
)
foreach($u in $urls){
  $r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 30 -SkipHttpErrorCheck
  "$u => $($r.StatusCode)"
}
```

Expected: all three paths return `200`.

- [ ] **Step 4: Commit only baseline bookkeeping if needed**

If this phase changes docs or verification records:

```powershell
git add docs README.md DESIGN.md
git commit -m "Document OreIQ build baseline"
```

## Phase 1: Company Intake And Profile API

**PRD coverage:** FR-001 Company Intake.

**Goal:** Move company profiles from form-only/local state into durable hosted records while preserving direct file mode.

**Files:**
- Create: `api/companies.js`
- Create: `api/_lib/companyRepository.cjs`
- Create: `api/_lib/companyRepository.test.cjs`
- Modify: `app/app.js`
- Modify: `app/index.html`
- Modify: `db/migrations/002_auth_access_sources.sql`

- [ ] **Step 1: Write company repository tests**

Create tests for:

- Upsert by `(exchange, ticker)`.
- Manual profile creation when ticker is missing.
- Metadata fields from the PRD: company name, ticker, exchange, commodity focus, country/jurisdiction, project stage, website, and source URLs.

Run:

```powershell
node --test api/_lib/companyRepository.test.cjs
```

Expected before implementation: fails because `companyRepository.cjs` does not exist.

- [ ] **Step 2: Add schema fields for PRD metadata**

Add a migration with additive changes only:

```sql
alter table companies add column if not exists website text;
alter table companies add column if not exists description text;
alter table companies add column if not exists profile_source_urls jsonb not null default '[]'::jsonb;
alter table companies add column if not exists profile_status text not null default 'manual'
  check (profile_status in ('manual', 'enriched', 'needs_review'));
```

- [ ] **Step 3: Implement `companyRepository.cjs`**

Implement pure repository functions:

- `upsertCompanyProfile(sql, input)`
- `getCompanyProfile(sql, id)`
- `searchCompanyProfiles(sql, query, limit)`

Use parameterized SQL only.

- [ ] **Step 4: Add `api/companies.js`**

Support:

- `GET /api/companies?query=NEM`
- `GET /api/companies?id=<uuid>`
- `POST /api/companies`

Return JSON with `{ company }` or `{ companies }`.

- [ ] **Step 5: Wire hosted app mode**

In `app/app.js`, keep local mode unchanged. In hosted mode:

- When a user enters company/ticker, call `POST /api/companies`.
- Store returned `company.id` in the report input.
- Display a small "Profile saved" or "Manual profile" status.

- [ ] **Step 6: Verify**

Run:

```powershell
npm test
node --check api/companies.js
node --check app/app.js
```

Expected: tests pass, syntax checks pass, local file mode still generates a report without API access.

## Phase 2: Source Collection And Extraction

**PRD coverage:** FR-002 Source Collection, Data Sources MVP.

**Goal:** Support source uploads/URLs as durable source records, with clear extraction status and unsupported-file handling.

**Files:**
- Create: `api/sources.js`
- Create: `api/_lib/sourceExtraction.cjs`
- Create: `api/_lib/sourceExtraction.test.cjs`
- Modify: `api/_lib/reportRepository.cjs`
- Modify: `app/app.js`
- Modify: `app/index.html`
- Modify: `app/styles.css`
- Modify: `db/migrations/002_auth_access_sources.sql`

- [ ] **Step 1: Write extraction tests**

Test cases:

- Plain text returns extracted text.
- Markdown returns extracted text.
- CSV returns extracted text.
- PDF without server parser returns `unsupported` with a useful message.
- URL source creates metadata even before scraping.

Run:

```powershell
node --test api/_lib/sourceExtraction.test.cjs
```

Expected before implementation: fails because the module does not exist.

- [ ] **Step 2: Add source status fields**

Add migration fields:

```sql
alter table sources add column if not exists status text not null default 'submitted'
  check (status in ('submitted', 'extracting', 'ready', 'unsupported', 'failed'));
alter table sources add column if not exists error text;
alter table sources add column if not exists published_at timestamptz;
alter table sources add column if not exists content_hash text;
```

- [ ] **Step 3: Add `api/sources.js`**

Support:

- `POST /api/sources` to create URL or pasted-text sources.
- `GET /api/sources?reportJobId=<id>` to list sources for a job.

Do not add large binary uploads until storage is selected. For MVP, keep PDF upload handling in browser metadata mode and support text extraction from pasted text and supported text files.

- [ ] **Step 4: Add source status UI**

In the intake panel, show a source queue with:

- Source title or URL.
- Source type.
- Extraction status.
- Error for unsupported files.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test
node --check api/sources.js
node --check app/app.js
```

Expected: source tests pass and app still supports local source text.

## Phase 3: AI Due-Diligence Report Generation

**PRD coverage:** FR-003 AI Due-Diligence Report, FR-004 Mining Scorecard, Report Rating Language, Legal Requirements.

**Goal:** Add OpenAI-backed report generation while keeping deterministic local report generation as fallback and test oracle.

**Files:**
- Create: `api/generate-report.js`
- Create: `api/_lib/openaiReport.cjs`
- Create: `api/_lib/openaiReport.test.cjs`
- Modify: `api/report-jobs.js`
- Modify: `api/_lib/reportValidation.cjs`
- Modify: `app/jobApi.js`
- Modify: `app/app.js`
- Modify: `README.md`

- [ ] **Step 1: Define report JSON schema**

Create an expected AI report object that includes every PRD section:

- executive summary
- company/project overview
- commodity exposure
- project stage and derisking
- geology/deposit quality
- drill results
- resource estimate
- metallurgy/recovery risk
- jurisdiction/permitting/infrastructure
- management/capital structure
- dilution/financing risk
- catalyst timeline
- social/promotional-hype assessment
- red flags
- evidence table
- final rating
- confidence
- missing information

- [ ] **Step 2: Write schema validation tests**

Test that generated report validation rejects:

- Direct buy/sell phrases.
- Missing evidence table.
- High-impact claims without citation, inference label, or missing-data label.
- Confidence values outside `0-100`.

Run:

```powershell
node --test api/_lib/openaiReport.test.cjs
```

Expected before implementation: fails because `openaiReport.cjs` does not exist.

- [ ] **Step 3: Implement OpenAI prompt builder**

Use a strict system prompt:

```text
You are OreIQ, a source-cited junior mining due-diligence analyst.
You produce research support, not financial advice.
Never use buy, sell, strong buy, guaranteed upside, or personal recommendation language.
Separate source facts, inference, missing information, and confidence.
Return only valid JSON matching the provided schema.
```

Include source excerpts and metadata. Limit source text length to control cost.

- [ ] **Step 4: Add hosted generate endpoint**

`POST /api/generate-report` should:

1. Create or load a report job.
2. Mark job `processing`.
3. Generate report with OpenAI when `OPENAI_API_KEY` is present.
4. Fall back to deterministic report engine only when explicitly configured for demo mode.
5. Mark job `ready` or `failed`.

- [ ] **Step 5: Wire app button behavior**

In hosted mode, "Generate Report" should call the hosted generation flow and then show:

- queued
- processing
- ready
- failed with safe error

Keep manual refresh. Do not poll continuously.

- [ ] **Step 6: Verify**

Run:

```powershell
npm test
node --check api/generate-report.js
node --check api/_lib/openaiReport.cjs
node --check app/app.js
```

Expected: tests pass. If no `OPENAI_API_KEY` is configured, hosted generation should show a clear configuration error rather than a broken page.

## Phase 4: Watchlist, Saved Reports, Filters, And Alerts

**PRD coverage:** FR-006 Watchlist, FR-007 Alerts.

**Goal:** Move watchlist and alerts from local/demo state toward hosted user-visible product features.

**Files:**
- Create: `api/watchlist.js`
- Create: `api/alerts.js`
- Create: `api/_lib/watchlistRepository.cjs`
- Create: `api/_lib/alertRules.cjs`
- Create: `api/_lib/alertRules.test.cjs`
- Modify: `app/app.js`
- Modify: `app/styles.css`
- Modify: `db/migrations/003_ai_reports_watchlist_alerts.sql`

- [ ] **Step 1: Write alert rule tests**

Test alert creation for:

- New drill result.
- Financing/share issuance.
- Permitting/regulatory update.
- Sentiment spike.
- Report rating change.

Run:

```powershell
node --test api/_lib/alertRules.test.cjs
```

Expected before implementation: fails because the module does not exist.

- [ ] **Step 2: Add watchlist API**

Support:

- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist?id=<id>`

Until auth is implemented, use a demo user only in local preview mode. Do not ship public multi-user behavior without access control.

- [ ] **Step 3: Add alert API**

Support:

- `GET /api/alerts?status=open`
- `PATCH /api/alerts` for `reviewed` and `dismissed`

- [ ] **Step 4: Add filters**

Add UI filters for:

- Commodity.
- Project stage.
- Risk level.
- Hype status.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test
node --check api/watchlist.js
node --check api/alerts.js
node --check app/app.js
```

Expected: watchlist remains usable in local mode and hosted mode can read/write through APIs when configured.

## Phase 5: Auth And Access Control

**PRD coverage:** User flow, privacy, paid access prerequisites.

**Goal:** Add account boundaries before storing private user uploads, saved reports, or paid access.

**Files:**
- Create: `api/_lib/accessControl.cjs`
- Create: `api/_lib/accessControl.test.cjs`
- Modify: `api/report-jobs.js`
- Modify: `api/companies.js`
- Modify: `api/sources.js`
- Modify: `api/watchlist.js`
- Modify: `api/alerts.js`
- Modify: `db/migrations/004_auth_access_control.sql`
- Modify: `README.md`

- [ ] **Step 1: Select auth provider**

Use one of:

- Neon Auth if it is already enabled and fits Vercel deployment.
- Clerk if the priority is fastest SaaS auth.
- Auth.js only if the app is moved to a framework that supports it cleanly.

Record the choice in `README.md` with required environment variables.

- [ ] **Step 2: Add access-control tests**

Test:

- Unauthenticated hosted request rejects private data access.
- User can only access own report jobs, sources, watchlist items, and alerts.
- Demo/local mode does not call private APIs.

- [ ] **Step 3: Enforce user ownership in repository calls**

Every hosted table query that returns private data must include user scope.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test
```

Expected: all repository tests include user ownership cases.

## Phase 6: Paid Access

**PRD coverage:** FR-008 Paid Access.

**Goal:** Validate paid report or subscription demand with Stripe before building a large platform.

**Files:**
- Create: `api/checkout.js`
- Create: `api/stripe-webhook.js`
- Create: `api/_lib/accessPlans.cjs`
- Create: `api/_lib/accessPlans.test.cjs`
- Modify: `app/index.html`
- Modify: `app/app.js`
- Modify: `app/styles.css`
- Modify: `db/migrations/005_paid_access.sql`
- Modify: `README.md`

- [ ] **Step 1: Define access plans**

Use PRD pricing language:

- Free: sample or low-depth lookup.
- Explorer: `$49/month`.
- Pro: `$99/month`.
- One-time deep-dive report: `$99-$299`.

Do not imply payments unlock financial advice.

- [ ] **Step 2: Add plan enforcement tests**

Test:

- Free user cannot generate unlimited full reports.
- Paid report unlock grants access to one completed report.
- Pro subscription grants expanded watchlist/report access.

- [ ] **Step 3: Add Stripe Checkout endpoint**

`POST /api/checkout` should create a Checkout session for:

- monthly subscription
- one-time report

- [ ] **Step 4: Add webhook endpoint**

`POST /api/stripe-webhook` should persist:

- customer id
- subscription status
- one-time report purchase
- access expiry or entitlement

- [ ] **Step 5: Verify**

Run:

```powershell
npm test
node --check api/checkout.js
node --check api/stripe-webhook.js
```

Expected: plan logic tests pass. Stripe endpoints fail safely if environment variables are missing.

## Phase 7: Source Discovery And Monitoring

**PRD coverage:** Social/sentiment snapshot, alerts, later source automation.

**Goal:** Add controlled source discovery without uncontrolled scraping cost.

**Files:**
- Create: `api/source-discovery.js`
- Create: `api/_lib/sourceDiscovery.cjs`
- Create: `api/_lib/sourceDiscovery.test.cjs`
- Modify: `api/sources.js`
- Modify: `docs/neon-cost-control.md`
- Modify: `README.md`

- [ ] **Step 1: Define supported discovery providers**

Use the existing global tooling only after cost checks:

- Firecrawl for small page scrape/search.
- Apify for structured platform-specific scraping.

- [ ] **Step 2: Add source discovery tests**

Test:

- Search inputs are bounded.
- Max result counts are enforced.
- Provider errors return safe UI messages.
- No broad "all of mining Twitter" scrape can run accidentally.

- [ ] **Step 3: Add source discovery endpoint**

`POST /api/source-discovery` accepts:

- company name
- ticker
- allowed source categories
- max results

Return discovered source candidates, not automatic report conclusions.

- [ ] **Step 4: Wire UI**

Add a "Find source candidates" action that appends results to the source queue for user review.

## Phase 8: Product QA, Compliance, And Launch Readiness

**PRD coverage:** Non-functional requirements, legal/compliance requirements, success metrics.

**Goal:** Make the MVP safe to share with prospects and paid testers.

**Files:**
- Create: `docs/launch-checklist.md`
- Create: `docs/compliance-language.md`
- Modify: `app/prd.html`
- Modify: `app/index.html`
- Modify: `README.md`
- Modify: `docs/oreiq-build-roadmap.html`

- [ ] **Step 1: Add compliance copy audit**

Search for prohibited language:

```powershell
rg -n "strong buy|buy now|sell now|guaranteed|price target|financial advice" app api docs landing-v4
```

Expected: no user-facing prohibited claims, except examples in documentation that explicitly say to avoid them.

- [ ] **Step 2: Add launch checklist**

Checklist must include:

- disclaimer visible in app and report export
- no direct advice language
- source citations visible
- confidence and missing data visible
- payment limits visible
- privacy boundary for uploaded files
- support/contact path

- [ ] **Step 3: Browser verification**

Verify desktop and mobile:

- Landing opens.
- App opens.
- PRD opens.
- Generate report works.
- Watchlist works.
- Export works.
- Hosted job mode either works or shows clear configuration state.

Save screenshots in `docs/verification/`.

- [ ] **Step 4: Update roadmap**

Update `docs/oreiq-build-roadmap.html` with repo-visible completion markers for finished tasks.

## Phase Order Recommendation

1. Phase 0: Baseline and safety gate.
2. Phase 3: AI report generation behind a hosted endpoint, because this is the core paid value.
3. Phase 2: Source extraction hardening, because AI quality depends on sources.
4. Phase 5: Auth/access control before private or paid data.
5. Phase 6: Stripe paid report/subscription validation.
6. Phase 4: Hosted watchlist and alerts after accounts exist.
7. Phase 7: Source discovery after cost controls and source review are in place.
8. Phase 8: Launch readiness before broader sharing.

## Verification Matrix

| PRD requirement | Proof command or artifact |
|---|---|
| FR-001 company intake | `node --test api/_lib/companyRepository.test.cjs` plus browser intake smoke test |
| FR-002 source collection | `node --test api/_lib/sourceExtraction.test.cjs` plus unsupported-file browser test |
| FR-003 AI report | `node --test api/_lib/openaiReport.test.cjs` plus hosted generated report sample |
| FR-004 scorecard | `node --test app/reportEngine.test.cjs` plus report UI screenshot |
| FR-005 hype/sentiment | report test covering hype label and evidence caveats |
| FR-006 watchlist | watchlist API tests plus reload persistence browser test |
| FR-007 alerts | `node --test api/_lib/alertRules.test.cjs` plus in-app alert state test |
| FR-008 paid access | `node --test api/_lib/accessPlans.test.cjs` plus Stripe test-mode checkout |
| Legal guardrails | `rg` prohibited-language scan and report export review |
| Design consistency | `npx @google/design.md lint DESIGN.md` when available plus screenshots |

## Execution Handoff

Plan complete. Execute Phase 0 first, then choose the next product slice. For fastest market validation, build Phase 3 before a full auth/payment system, but keep any shared prospect demo in a controlled environment until access control is implemented.
