# Fiscal.ai Design Teardown For OreIQ

Source inspected: https://fiscal.ai/  
Date: 2026-05-23  
Method: Live Chrome headless DevTools inspection with desktop/mobile screenshots, DOM structure, computed styles, and animation signal scan.

## Captured References

- `design-references/fiscal-ai-desktop-hero.png`
- `design-references/fiscal-ai-desktop-mid.png`
- `design-references/fiscal-ai-desktop-features.png`
- `design-references/fiscal-ai-mobile-hero.png`
- `design-references/fiscal-ai-page-inspection.json`

## What Works

Fiscal.ai feels premium because it does not look like a normal SaaS landing page. The first viewport behaves more like a financial terminal reveal:

- Dark hero background with subtle grid/noise texture.
- Large, confident headline with very little copy.
- Floating app mockups visible immediately.
- Rounded, compact nav that feels like a product control surface.
- Simple CTA pair: one primary product action, one pricing/plans action.
- Transition from dark product-theater hero into clean light feature sections.
- Product imagery is the main proof, not generic illustrations.

## Visual System Notes

- Font: Plus Jakarta Sans.
- Hero background: near-black with subtle dotted/grid texture.
- Main page background after hero: warm off-white.
- Accent color: bright green for financial data wins and product highlights.
- Cards/mockups: dark terminal UI with soft borders, heavy depth, and layered panels.
- Navigation: floating pill container, low border contrast, rounded corners.
- Buttons: large pill buttons, strong contrast, minimal text.
- Page rhythm: lots of vertical whitespace, but product screenshots keep it from feeling empty.

## Animation And Interaction Cues

The live inspection found a high number of animated/transitioned elements. The main effects to emulate for OreIQ should be restrained:

- Floating product panels that move slightly or layer as the user scrolls.
- Scroll reveal between dark hero and light feature sections.
- Subtle hover states on nav and CTAs.
- Dashboard/report panels that feel alive through layered shadows and staged positioning.
- Avoid flashy motion; the premium feel comes from slow, controlled movement.

## What OreIQ Should Borrow

### 1. Product-first hero

OreIQ should show a real product surface in the hero:

- Company/ticker input.
- Example company: a junior miner.
- AI due-diligence report preview.
- Scorecard preview.
- Red flags and evidence citations.

Do not use abstract mining illustrations as the primary hero. The app UI should be the hero.

### 2. Dark-to-light page structure

Use a dark first viewport to create a premium analytical feel, then transition into clean light sections for features, report examples, pricing, and trust.

### 3. Landing page and app in one surface

The first screen should not just market OreIQ. It should invite action:

> Enter a junior mining company or ticker.

This turns the landing page into the first product workflow.

### 4. Evidence as the visual differentiator

Fiscal.ai shows financial terminal depth. OreIQ should show due-diligence depth:

- "Evidence cited"
- "Missing data"
- "Hype risk"
- "Dilution risk"
- "Catalysts"
- "Management check"
- "Project stage"

### 5. Trust through specificity

Fiscal.ai uses trusted investor quotes, SOC2, investor count, and data quality language. OreIQ should use mining-specific trust signals:

- "Not financial advice"
- "Source-cited reports"
- "Separates facts from inference"
- "Flags promotional risk"
- "Built for junior mining due diligence"

## OreIQ Homepage Draft Structure

1. Dark hero with nav, headline, short subcopy, ticker/company input, and animated report preview.
2. Product mockup section: "From company hype to evidence-backed report."
3. Three feature blocks:
   - Drill results and technical reports.
   - Dilution, management, and jurisdiction risk.
   - Social hype and catalyst alerts.
4. Sample report preview.
5. Pricing or early-access CTA.
6. Trust and disclaimer section.

## Suggested OreIQ Hero Copy

Headline:

> AI due diligence for junior mining stocks.

Subcopy:

> OreIQ turns filings, drill results, technical reports, news, and market sentiment into source-cited mining risk reports.

Primary CTA:

> Analyze a Company

Secondary CTA:

> View Sample Report

Input placeholder:

> Enter ticker or company name

## Design Guardrails

- Do not clone Fiscal.ai's exact layout, logo, colors, or assets.
- Borrow the product-first structure, motion restraint, and premium financial-terminal feel.
- OreIQ should feel more geological and investigative than Fiscal.ai.
- Use mining/report terminology in the UI, not generic SaaS phrasing.
- Keep the first screen focused on the product workflow, not a marketing story.

