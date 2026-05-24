const assert = require("node:assert/strict");
const test = require("node:test");

const {
  normalizeCreatePayload,
  normalizeLimit,
  normalizePatchPayload,
  parseBody
} = require("./reportValidation.cjs");

test("normalizeCreatePayload accepts direct form input and normalizes ticker", () => {
  const input = normalizeCreatePayload({
    company: "Aurora Copper",
    ticker: " auc ",
    sourceText: "NI 43-101 report."
  });

  assert.equal(input.company, "Aurora Copper");
  assert.equal(input.ticker, "AUC");
  assert.equal(input.sourceText, "NI 43-101 report.");
});

test("normalizeCreatePayload accepts wrapped input payloads", () => {
  const input = normalizeCreatePayload({
    input: {
      company: "",
      ticker: "nsm"
    }
  });

  assert.equal(input.company, "");
  assert.equal(input.ticker, "NSM");
});

test("normalizeCreatePayload rejects blank company and ticker", () => {
  assert.throws(() => normalizeCreatePayload({ company: " ", ticker: "" }), /company name or ticker/i);
});

test("normalizePatchPayload validates supported job transitions", () => {
  assert.deepEqual(normalizePatchPayload({ id: "job-auc-fixed", action: "processing" }), {
    id: "job-auc-fixed",
    action: "processing",
    report: null,
    error: null
  });

  assert.equal(
    normalizePatchPayload({
      id: "job-auc-fixed",
      action: "complete",
      report: { id: "AUC-1" }
    }).report.id,
    "AUC-1"
  );

  assert.throws(() => normalizePatchPayload({ id: "job-auc-fixed", action: "complete" }), /report payload/i);
  assert.throws(() => normalizePatchPayload({ id: "job-auc-fixed", action: "archive" }), /processing, complete, or fail/i);
});

test("parseBody and normalizeLimit handle API request shapes", () => {
  assert.deepEqual(parseBody('{"id":"job-1"}'), { id: "job-1" });
  assert.equal(normalizeLimit("12"), 12);
  assert.equal(normalizeLimit("0"), 10);
  assert.equal(normalizeLimit("500"), 50);
});
