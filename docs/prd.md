# OreIQ PRD

Status: Draft v0.1  
Date: 2026-05-23  
Product: OreIQ  
Positioning: Junior mining due-diligence assistant, not a generic AI stock picker.

## 1. Overview

OreIQ helps retail resource investors, serious speculators, small funds, and mining professionals evaluate junior mining companies faster and with less hype. The product reads mining-specific source material, summarizes the opportunity, highlights red flags, and explains whether social-market excitement is supported by evidence.

### One-Liner

OreIQ is a source-cited AI analyst for junior mining stocks that turns filings, technical reports, drill results, company news, and market sentiment into plain-English risk and opportunity reports.

### Objective

The first product should prove that users will pay for faster, clearer junior mining due diligence before building a full SaaS platform.

### Core Differentiation

Generic AI stock tools understand price charts and financial metrics. OreIQ is specialized around mining-specific judgment:

- NI 43-101 and technical report interpretation.
- Drill result and resource-estimate analysis.
- Project-stage and derisking assessment.
- Management, share structure, dilution, and insider-risk checks.
- Commodity exposure and catalyst tracking.
- Social hype detection for promotional junior mining names.

### Magic Moment

A user enters a junior mining company or ticker and receives a clear report answering:

> Is this worth deeper research, what are the biggest risks, what evidence supports the story, and is the market/social hype justified?

### Product Guardrail

OreIQ should avoid direct financial-advice language such as guaranteed buy/sell calls. The product can provide evidence-backed ratings, risk alerts, catalyst alerts, overhyped/over-hated signals, and watchlist guidance.

## 2. Target Users

### Primary User

Retail junior mining investor who follows newsletters, X/Twitter, Reddit, CEO interviews, mining forums, and press releases, but struggles to separate serious opportunities from promotion.

### Secondary Users

- Serious resource speculators with 10-50 mining names on a watchlist.
- Small resource-focused funds and family offices that want research triage.
- Mining professionals who understand geology but want investor-focused market context.
- Newsletter writers or media operators who need first-pass research support.

### Current Alternatives

- Paid newsletters and Substacks.
- Mining forums, Reddit, X/Twitter, CEO interviews, and YouTube channels.
- Manual review of technical reports, filings, presentations, and press releases.
- General stock tools such as Seeking Alpha, Danelfin, Tickeron, TrendSpider, Fiscal.ai, and AlphaSense.
- Doing nothing and buying based on social buzz.

## 3. User Problems

### P0 Problems

- Junior mining investors lack a fast way to evaluate whether a company story is evidence-backed or promotional.
- Drill results and technical reports are hard to interpret without domain context.
- Social sentiment is noisy, manipulated, and hard to separate from real catalysts.
- Dilution, weak management, jurisdiction risk, permitting risk, and metallurgy issues are often missed by casual investors.

### P1 Problems

- Investors need timely alerts when a company issues important news.
- Investors need watchlist-level monitoring across commodities and project stages.
- Users want comparable scoring across gold, silver, copper, uranium, lithium, and rare-earth juniors.

## 4. MVP Scope

The MVP should be a due-diligence report generator with limited monitoring. It should not start as a full trading platform.

### In Scope

- Company/ticker lookup.
- Manual source upload or URL submission for reports, news, investor presentations, and filings.
- AI-generated due-diligence report.
- Evidence citations and confidence levels.
- Mining-specific scoring rubric.
- Social/sentiment snapshot from public web and social sources where available.
- Watchlist with saved reports.
- Basic alert rules for new company news or sentiment spikes.
- Stripe subscription or paid report checkout.

### Out Of Scope For MVP

- Broker integrations.
- Automated trading.
- Direct buy/sell recommendations.
- Full portfolio optimization.
- White-label dashboards.
- API access.
- Mobile native app.
- Full historical commodity database.
- Fully automated ingestion of every exchange filing source globally.

## 5. Core Product Requirements

### FR-001: Company Intake

Priority: P0

Users can enter a company name, stock ticker, exchange, or website. The system creates a company profile with available metadata.

Acceptance criteria:

- User can search by company name or ticker.
- System stores company name, ticker, exchange, commodity focus, country, project stage, and source URLs when available.
- If the company cannot be found automatically, user can create a manual profile.

### FR-002: Source Collection

Priority: P0

Users can provide source documents and URLs for analysis.

Acceptance criteria:

- User can upload PDF files.
- User can paste URLs to press releases, investor presentations, technical reports, and regulatory filings.
- System extracts text and stores source metadata.
- System flags unsupported or unreadable files.

### FR-003: AI Due-Diligence Report

Priority: P0

The system produces a structured mining-focused report.

Required sections:

- Executive summary.
- Company and project overview.
- Commodity exposure.
- Project stage and derisking status.
- Geology and deposit quality summary.
- Drill result interpretation, when applicable.
- Resource estimate summary, when applicable.
- Metallurgy and recovery risks.
- Jurisdiction, permitting, and infrastructure risks.
- Management and capital structure.
- Dilution and financing risk.
- Catalyst timeline.
- Social and promotional-hype assessment.
- Red flags.
- Evidence table.
- Final rating.

Acceptance criteria:

- Report includes citations back to uploaded or scraped sources.
- Report separates facts, inference, and missing information.
- Report displays a confidence level for each major conclusion.
- Report avoids direct personalized investment advice.

### FR-004: Mining Scorecard

Priority: P0

Each company receives a scorecard that decomposes the investment case.

Score categories:

- Project quality.
- Management quality.
- Share structure and dilution risk.
- Jurisdiction and permitting.
- Metallurgy and technical risk.
- Commodity exposure.
- Catalyst strength.
- Valuation setup.
- Sentiment/hype risk.
- Overall due-diligence priority.

Acceptance criteria:

- Scores include one-sentence rationale.
- Scores show confidence level.
- Low-confidence scores explain what data is missing.

### FR-005: Hype And Sentiment Snapshot

Priority: P1

The system summarizes recent public discussion and detects whether attention is unusually promotional, negative, or catalyst-driven.

Acceptance criteria:

- System can summarize selected public web/social sources.
- Sentiment is labeled as overhyped, neutral, over-hated, or insufficient data.
- Hype label includes supporting evidence and caveats.
- Promotional red flags are called out separately from bullish sentiment.

### FR-006: Watchlist

Priority: P1

Users can save companies and reports to a watchlist.

Acceptance criteria:

- User can save/remove companies.
- User can view latest report status and rating.
- User can filter by commodity, project stage, risk level, and hype status.

### FR-007: Alerts

Priority: P1

Users can receive alerts for meaningful changes.

Alert types:

- New press release or filing.
- New drill result.
- Financing or share issuance.
- Permitting or regulatory update.
- Sentiment spike.
- Report rating change.

Acceptance criteria:

- MVP supports in-app alerts.
- Email alerts can be added after the core workflow works.
- Alerts explain why they matter.

### FR-008: Paid Access

Priority: P1

The product supports either paid report purchases or subscriptions.

Initial pricing hypothesis:

- Free: limited sample reports or one low-depth company lookup.
- Explorer: $49/month for full reports and limited watchlist.
- Pro: $99/month for unlimited reports, watchlist monitoring, and priority analysis.
- One-time deep-dive reports: $99-$299 while product is still research-assisted.

Acceptance criteria:

- User can unlock a report through checkout.
- User sees clear limitations before paying.
- Payments do not unlock financial advice, only research tools and reports.

## 6. Report Rating Language

Avoid:

- Buy.
- Strong buy.
- Sell now.
- Guaranteed upside.
- Price target framed as advice.

Use:

- High-priority research candidate.
- Watchlist candidate.
- Speculative/high risk.
- Avoid until key data improves.
- Overhyped relative to evidence.
- Underfollowed relative to catalyst quality.
- Insufficient evidence.

## 7. Data Sources

### MVP Sources

- User-uploaded PDFs.
- Company press releases.
- Investor presentations.
- NI 43-101 reports where available.
- SEDAR+ and company filing links, where accessible.
- SEC/EDGAR for US-listed companies.
- Company websites.
- Public news pages.
- Selected social/forum pages submitted or configured by user.

### Later Sources

- Paid market data.
- Commodity pricing feeds.
- Insider filing feeds.
- Exchange announcements.
- Global regulatory filing feeds.
- Institutional ownership datasets.
- Historical dilution and financing datasets.

## 8. Suggested Technical Architecture

These are draft assumptions, not final stack commitments.

| Layer | Draft Choice | Reason |
|---|---|---|
| Frontend | Next.js web app | Fast SaaS build, good for dashboards and reports. |
| Backend | Next.js API routes or server actions | Enough for MVP if scope is controlled. |
| Database | Neon Postgres | Good for users, companies, reports, sources, alerts, watchlists, and report jobs. |
| Auth | Neon Auth, Clerk, or Auth.js | Simple account management. |
| Payments | Stripe | Subscription and one-time report payments. |
| AI | OpenAI API | Report generation, extraction, summarization, classification. |
| File storage | Object storage such as Cloudflare R2, S3, or Vercel Blob | PDF uploads and source artifacts. |
| Scraping | Firecrawl/Apify/manual URLs | Existing project context already has both available globally. |
| Jobs | Inngest, Trigger.dev, or simple cron | Background report generation and alert monitoring. |

## 9. Data Model

### User

- id
- email
- name
- plan
- stripe_customer_id
- created_at

### Company

- id
- name
- ticker
- exchange
- website
- commodity_focus
- country
- project_stage
- description
- created_at

### SourceDocument

- id
- company_id
- uploaded_by_user_id
- source_type
- title
- url
- file_path
- extracted_text
- published_at
- created_at

### Report

- id
- company_id
- user_id
- status
- summary
- full_report_markdown
- score_json
- evidence_json
- confidence
- generated_at

### WatchlistItem

- id
- user_id
- company_id
- notes
- created_at

### Alert

- id
- user_id
- company_id
- alert_type
- title
- body
- severity
- source_url
- created_at
- read_at

## 10. Primary User Flow

1. User signs up.
2. User enters a junior mining company or ticker.
3. User uploads/pastes source material.
4. OreIQ extracts the source text.
5. User clicks "Generate Report."
6. System produces a source-cited due-diligence report.
7. User saves company to watchlist.
8. User receives future alerts when new evidence changes the story.

## 11. Non-Functional Requirements

- Reports should clearly distinguish source facts from AI interpretation.
- Every high-impact claim should cite a source or be marked as inference.
- Report generation should complete within 2-5 minutes for MVP.
- Uploaded files must be private to the user unless explicitly shared.
- App must include legal disclaimers that it is research software, not financial advice.
- UI should make uncertainty visible instead of hiding it.

## 12. Legal And Compliance Requirements

OreIQ must present itself as research tooling and decision support.

Required:

- Financial advice disclaimer.
- No personalized portfolio recommendation without regulatory review.
- No guaranteed return claims.
- Clear explanation of data limitations.
- No undisclosed affiliate influence in ratings.
- Paid promotion detection should be framed as risk signal, not accusation, unless evidence is explicit.

## 13. Success Metrics

### Validation Metrics

- 10 conversations with junior mining investors.
- 5 users willing to submit a company for analysis.
- 3 users willing to pay for a report.
- At least 2 users say the report changed what they would research next.

### Product Metrics

- Report generation completion rate.
- Paid report conversion rate.
- Watchlist saves per user.
- Return visits after alerts.
- User-rated report usefulness.
- Number of cited evidence items per report.

## 14. Open Questions

- Should the first release support only Canadian-listed junior miners, or also ASX/US names?
- Should the first monetization be subscription, one-time reports, or concierge-reviewed reports?
- Which social sources matter most for this audience: X/Twitter, Reddit, CEO.ca, Stockhouse, HotCopper, Discord, or YouTube?
- Should reports be fully automated at first, or manually reviewed before being sold?
- Should the brand remain OreIQ, or should we keep searching for a cleaner available domain?
