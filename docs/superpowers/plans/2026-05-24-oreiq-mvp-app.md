# OreIQ MVP App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static local OreIQ MVP app with company intake, source capture, deterministic due-diligence reports, watchlist persistence, and export.

**Architecture:** Keep marketing and app surfaces separate. `landing-v4/` remains the latest landing page; `app/` becomes the working product demo. The report engine is isolated from DOM code so it can be tested with Node before the browser app is wired.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser localStorage, Node built-in test runner.

---

## File Structure

- Create `app/reportEngine.js`: pure report-generation functions exposed to both browser and Node.
- Create `app/reportEngine.test.cjs`: Node tests for report generation behavior.
- Create `app/index.html`: accessible static app shell.
- Create `app/styles.css`: app-specific UI built from `DESIGN.md` tokens.
- Create `app/app.js`: DOM state, localStorage watchlist, file-source capture, export, and print actions.
- Modify `landing-v4/index.html`: add a direct app link from the hero/nav surface.
- Create `README.md`: local run/use instructions and backend next steps.

## Tasks

### Task 1: Report Engine Test First

**Files:**
- Create: `app/reportEngine.test.cjs`
- Create after red test: `app/reportEngine.js`

- [ ] Add tests for rating language, hype detection, missing evidence, source citations, and score improvement from catalyst/source cues.
- [ ] Run `node --test app/reportEngine.test.cjs` and confirm it fails because `app/reportEngine.js` does not exist.
- [ ] Implement `buildReport(input)` and supporting helpers.
- [ ] Re-run `node --test app/reportEngine.test.cjs` and confirm all tests pass.

### Task 2: Static App Shell

**Files:**
- Create: `app/index.html`
- Create: `app/styles.css`
- Create: `app/app.js`

- [ ] Build the app layout: header, intake panel, report panel, scorecard, evidence table, watchlist, alerts, and action buttons.
- [ ] Wire forms to `buildReport(input)`.
- [ ] Add localStorage save/load/remove behavior.
- [ ] Add Markdown export and print actions.

### Task 3: Landing Link And Docs

**Files:**
- Modify: `landing-v4/index.html`
- Create: `README.md`

- [ ] Add an "Open app" link to `landing-v4/index.html`.
- [ ] Document direct file usage and optional static server usage in `README.md`.
- [ ] Document the gap between this local MVP and the later backend AI/Neon/Stripe build.

### Task 4: Verification

**Commands:**
- `node --test app/reportEngine.test.cjs`
- `npx @google/design.md lint DESIGN.md`
- Browser smoke check for `app/index.html` desktop and mobile.

- [ ] Run tests and read output.
- [ ] Run design lint if the package is available.
- [ ] Open the app, generate a report, save to watchlist, reload it, export Markdown, and check responsive layout.
