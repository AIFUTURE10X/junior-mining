const assert = require("node:assert/strict");
const test = require("node:test");

const { buildReport } = require("./reportEngine.js");

const baseInput = {
  company: "Aurora Copper",
  ticker: "AUC",
  exchange: "TSXV",
  commodity: "Copper",
  stage: "Resource definition",
  jurisdiction: "British Columbia",
  marketCap: "85",
  sourceUrls: [
    "https://example.com/aurora-copper-technical-report",
    "https://example.com/aurora-copper-assay-results"
  ],
  sourceText:
    "NI 43-101 technical report confirms an inferred resource. Recent assay results returned copper intercepts. Management announced a resource update and metallurgy test work.",
  files: [
    { name: "Aurora-Copper-NI-43-101.pdf", type: "application/pdf", text: "" }
  ]
};

test("buildReport returns research language without direct buy or sell calls", () => {
  const report = buildReport(baseInput);
  const serialized = JSON.stringify(report).toLowerCase();

  assert.equal(report.company, "Aurora Copper");
  assert.equal(report.ticker, "AUC");
  assert.match(report.rating, /candidate|insufficient|avoid/i);
  assert.doesNotMatch(serialized, /\bstrong buy\b|\bbuy now\b|\bsell now\b|\bguaranteed upside\b/);
});

test("promotional source text raises hype risk and creates a red flag", () => {
  const report = buildReport({
    ...baseInput,
    sourceText:
      "Sponsored CEO interview went viral on Reddit and X. Paid promotion claims imminent discovery with no new assay data."
  });

  assert.equal(report.hype.status, "Elevated");
  assert.ok(report.redFlags.some((flag) => /promotion|hype|unsupported/i.test(flag)));
  assert.ok(report.evidence.some((item) => item.type === "inference" && /promotion|hype/i.test(item.finding)));
});

test("missing source material lowers confidence and records missing information", () => {
  const report = buildReport({
    ...baseInput,
    sourceUrls: [],
    sourceText: "",
    files: []
  });

  assert.ok(report.confidence < 55);
  assert.ok(report.missingInformation.length >= 3);
  assert.ok(report.evidence.some((item) => item.type === "missing"));
});

test("source URLs and file names appear in evidence citations", () => {
  const report = buildReport(baseInput);
  const sources = report.evidence.map((item) => item.source).join("\n");

  assert.match(sources, /technical-report/);
  assert.match(sources, /assay-results/);
  assert.match(sources, /Aurora-Copper-NI-43-101\.pdf/);
});

test("catalyst and technical source cues improve project and catalyst scores", () => {
  const weakReport = buildReport({
    ...baseInput,
    sourceUrls: ["https://example.com/company-profile"],
    sourceText: "Company profile with limited public data.",
    files: []
  });
  const strongReport = buildReport(baseInput);

  assert.ok(strongReport.scorecard.projectQuality.score > weakReport.scorecard.projectQuality.score);
  assert.ok(strongReport.scorecard.catalystStrength.score > weakReport.scorecard.catalystStrength.score);
  assert.ok(strongReport.catalysts.length >= 2);
});

test("public expert commentary creates cited expert signals without advice language", () => {
  const report = buildReport({
    ...baseInput,
    expertSources:
      "Rick Rule | Public interview | https://example.com/rick-rule-copper | Discussed copper optionality and management discipline for Aurora Copper.\n" +
      "Don Durrett | Public article | https://example.com/don-durrett-aurora | Mentioned Aurora Copper as a high-risk exploration story that needs assay follow-up."
  });
  const serialized = JSON.stringify(report).toLowerCase();

  assert.equal(report.expertSignals.items.length, 2);
  assert.match(report.expertSignals.summary, /public commentary/i);
  assert.match(report.expertSignals.guardrail, /not affiliated|not endors/i);
  assert.ok(report.evidence.some((item) => item.source.includes("rick-rule-copper") && item.type === "expert"));
  assert.ok(report.expertSignals.items.every((item) => item.sourceUrl.startsWith("https://")));
  assert.doesNotMatch(serialized, /\bstrong buy\b|\bbuy now\b|\bsell now\b|\bcopy trades\b/);
});
