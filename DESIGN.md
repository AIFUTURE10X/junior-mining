---
name: OreIQ Design System
colors:
  ink: "#050505"
  charcoal: "#101112"
  panel: "#1a1b1c"
  panelRaised: "#202224"
  line: "#333639"
  lineSoft: "#494f52"
  text: "#f6f1e8"
  textMuted: "#a9a198"
  textDark: "#171717"
  paper: "#f4f0e8"
  copper: "#c7763e"
  copperBright: "#e59b5d"
  gold: "#f4c76f"
  green: "#38d083"
  red: "#ff6a55"
  blue: "#2b9cff"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "64px"
    fontWeight: 850
    lineHeight: "0.95"
    letterSpacing: "0"
  h1:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: "1.05"
    letterSpacing: "0"
  h2:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 760
    lineHeight: "1.12"
    letterSpacing: "0"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 450
    lineHeight: "1.55"
    letterSpacing: "0"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: "1.2"
    letterSpacing: "0"
rounded:
  card: "8px"
  control: "8px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  xxl: "64px"
components:
  buttonPrimary:
    background: "{colors.copper}"
    color: "{colors.ink}"
    radius: "{rounded.control}"
  panel:
    background: "{colors.panel}"
    border: "{colors.line}"
    radius: "{rounded.card}"
  focus:
    color: "{colors.gold}"
---

## Overview

OreIQ should feel like a serious mining research cockpit: dark, source-driven, and investigative. It is not a generic AI stock picker, trading terminal, or newsletter landing page. The interface should make the user's next research action visible immediately.

## Colors

Use near-black and charcoal for app surfaces, copper and gold for mining intelligence, green for verification, red for risk, and blue sparingly for market/price signals. Avoid a one-note gold/brown palette by keeping neutral graphite panels and green/blue analytical signals in the product UI.

## Typography

Use compact, information-dense type. Reserve display-scale text for the landing hero only. App panels, scorecards, source tables, and watchlists should use tighter headings and clear labels so the product can support repeat use.

## Layout

The app uses an operations-console layout: intake and source controls on the left, generated report and scorecard in the main area, watchlist and alerts on the right. Cards are for discrete tools and repeated items only. Page sections should not be nested cards.

## Elevation & Depth

Use beveled graphite cards with restrained shadows and subtle inset highlights. Depth should support scanning and hierarchy, not decoration.

## Shapes

Cards and controls use 8px radii. Avoid large pill-shaped cards. Pills are allowed only for compact status labels and tags.

## Components

- Primary action: copper/gold button for report generation.
- Secondary action: graphite button with light border.
- Scorecard: fixed grid of mining criteria with score, confidence, and one-line rationale.
- Evidence table: source label, evidence cue, finding, and whether the finding is fact, inference, or missing data.
- Watchlist items: compact rows with ticker, rating, risk, and last generated time.

## Do's and Don'ts

- Do show source-backed findings, caveats, and missing information prominently.
- Do avoid buy/sell recommendation language.
- Do make app controls visible before marketing copy.
- Don't use decorative orbs, generic AI illustrations, or oversized explanatory text inside product panels.
- Don't imply live market data or real AI analysis before the backend exists.
