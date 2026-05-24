# OreIQ MVP Plan

Status: Draft v0.1  
Date: 2026-05-23

## MVP Thesis

Do not build a full AI stock analyst platform first. Build the smallest product that proves people will pay for junior mining due diligence.

The MVP should answer one question:

> Will junior mining investors pay for a source-cited AI report that helps them avoid hype and quickly judge whether a company deserves deeper research?

## Recommended MVP

### Product Shape

A web-based report generator for junior mining companies.

The first version can be semi-manual behind the scenes. Users should experience a polished product, but the backend can include manual review, manually selected sources, and concierge report cleanup until demand is proven.

### User Promise

"Enter a junior mining company. Get a plain-English due-diligence report with evidence, red flags, hype risk, dilution risk, catalysts, and a mining-specific scorecard."

## MVP Features

### Must Have

1. Company/ticker intake.
2. Upload or paste sources.
3. PDF/text extraction.
4. AI-generated report.
5. Evidence citations.
6. Mining-specific scorecard.
7. Red flag section.
8. Hype/sentiment section.
9. Saved report history.
10. Simple payment flow or manual invoice/payment link.

### Nice To Have

1. Watchlist.
2. Basic in-app alerts.
3. Email delivery of completed reports.
4. Report export to PDF.
5. Commodity filters.

### Cut From MVP

1. Broker integrations.
2. Automated trading.
3. Direct buy/sell alerts.
4. Mobile apps.
5. API access.
6. White-label dashboards.
7. Full global filings automation.
8. Complex portfolio analytics.
9. Community features.
10. Live market-data terminal.

## First Report Template

Each MVP report should include:

1. Executive summary.
2. Company snapshot.
3. Commodity and project exposure.
4. Project stage.
5. Geological potential.
6. Drill results summary, if available.
7. Resource estimate summary, if available.
8. Management and track record.
9. Share structure and dilution risk.
10. Jurisdiction and permitting risk.
11. Metallurgy and recovery risk.
12. Near-term catalysts.
13. Social/hype assessment.
14. Red flags.
15. Missing information.
16. Evidence table.
17. Final due-diligence rating.

## MVP Rating System

Use research-support language:

- High-priority research candidate.
- Watchlist candidate.
- Speculative/high risk.
- Avoid until key questions are answered.
- Overhyped relative to evidence.
- Underfollowed relative to catalyst quality.
- Insufficient evidence.

Do not use:

- Buy.
- Sell.
- Strong buy.
- Guaranteed upside.
- Personalized investment advice.

## 14-Day Validation Test

### Goal

Prove willingness to pay before building the full app.

### Test Design

1. Pick 10 junior mining companies people are actively discussing.
2. Create 3 sample OreIQ reports manually assisted by AI.
3. Share anonymized/report-preview examples with target users.
4. Offer paid custom reports at $49-$99.
5. Interview every buyer and non-buyer.

### Pass Criteria

The MVP is worth building if:

- 10+ target users agree to review a sample.
- 5+ users submit a company they want analyzed.
- 3+ users pay or commit to pay for a custom report.
- 2+ users ask for monitoring/alerts after reading a report.

### Fail Criteria

Pause or pivot if:

- Users only want free reports.
- Users do not trust AI interpretation even with citations.
- Users say the report is less useful than newsletters/forums.
- Users want real-time trade calls more than due diligence.

## First 10 Customer Hunt

1. Resource investing communities.
   Find active users on Reddit, CEO.ca, Stockhouse, X/Twitter, and mining newsletter comment sections. Ask for feedback on a sample report, not a sale.

2. Newsletter and YouTube audiences.
   Contact smaller resource-stock creators and offer to analyze one company they recently covered.

3. Mining investor network.
   Ask people who already buy junior mining newsletters or follow Rick Rule-style resource investing whether they would pay for a faster pre-screen.

## Build Sequence

### Phase 1: Manual Report Product

Outcome: Sell the first reports without a full SaaS app.

- Create report template.
- Build source extraction workflow.
- Build AI prompt chain.
- Produce 3 public sample reports.
- Create payment link or simple checkout.
- Deliver reports manually.

### Phase 2: Thin Web App

Outcome: Users can submit companies and receive reports through the app.

- Landing page.
- Signup/login.
- Company submission form.
- File upload.
- Report generation job.
- Report viewer.
- Saved reports.
- Checkout.

### Phase 3: Watchlist And Alerts

Outcome: Users return because OreIQ monitors names after the first report.

- Watchlist.
- Source monitoring.
- Basic alert inbox.
- Email alerts.
- Report refresh workflow.

## Recommended First Build Stack

This can change later, but a practical first stack is:

- Next.js web app.
- Supabase Postgres/Auth/Storage.
- Stripe for payments.
- OpenAI API for report generation.
- Firecrawl and/or Apify for source collection.
- Background jobs via simple cron first, then Inngest or Trigger.dev if needed.

## Main Decision Before Building

Choose the first wedge:

1. **Paid one-time reports first** - best validation path, lowest build effort.
2. **Subscription SaaS first** - better long-term product, higher build risk.
3. **Concierge plus thin app** - recommended path: users see software, but report quality can be manually controlled early.

Recommended: concierge plus thin app.

