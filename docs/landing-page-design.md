# OreIQ Landing Page Design

Status: Draft for first build  
Date: 2026-05-23

## Direction

Build a premium, product-first landing page for OreIQ as a junior mining due-diligence assistant. The page should feel like a serious financial research product, not a generic AI stock picker.

The agreed design blend:

- Fiscal.ai polish: clean premium hero, product UI visible immediately, restrained motion.
- AiCrewPilot motion: cinematic dark hero with a large slow-moving background object.
- Glowpost reference: beveled slate/charcoal cards with inset depth and metallic edges.
- OreScan mark: dark ore crystal, AI network nodes, gold/copper scan line.

## First Screen

The hero should be the app entry point, not just marketing.

Required hero elements:

- OreIQ/OreScan branding.
- Headline: AI due diligence for junior mining stocks.
- Short subcopy explaining source-cited mining reports.
- Company/ticker input.
- Primary CTA to analyze a company.
- Secondary CTA to view a sample report.
- Animated ore-body scan canvas in the background.
- Product report card layered in front.

## Visual System

Palette:

- Black: #050505
- Charcoal: #101112
- Slate panel: #1a1b1c
- Graphite line: #2a2c2e
- Text: #f6f1e8
- Muted text: #a9a198
- Copper: #c7763e
- Gold: #f4c76f
- Verification green: #38d083
- Warning red: #ff6a55

Shape and depth:

- Use 8px radius for product/report cards and controls.
- Use beveled edge treatments on dashboard cards.
- Use restrained shadows and inset highlights.
- Avoid nested cards except inside the report mockup where it represents the product UI.

Animation:

- Canvas ore-body scan: slow rotating mineral deposit / geological scan.
- Subtle point cloud and scan rings.
- Small glowing drill-hit points.
- Respect `prefers-reduced-motion`.
- No flashy neon or fast motion.

## Page Sections

1. Hero with input and product preview.
2. "From hype to evidence" section with the report workflow.
3. Feature grid:
   - Drill results and technical reports.
   - Dilution, management, and jurisdiction risk.
   - Hype and sentiment detection.
4. Sample report preview.
5. Pricing/early access.
6. Trust/disclaimer footer.

## Build Format

For the first version, build a standalone local page:

- `landing/index.html`
- `landing/styles.css`
- `landing/app.js`

No dev server required. Open `landing/index.html` directly in a browser.

