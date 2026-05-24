const assert = require("node:assert/strict");
const test = require("node:test");

const { rowToJob, sourceRowsFromInput } = require("./reportRepository.cjs");

test("rowToJob maps Neon row fields into browser job shape", () => {
  const job = rowToJob({
    id: "job-auc-fixed",
    status: "ready",
    company: "Aurora Copper",
    ticker: "AUC",
    requested_at: "2026-05-24T09:00:00.000Z",
    updated_at: "2026-05-24T09:02:00.000Z",
    input: '{"company":"Aurora Copper"}',
    report: '{"id":"AUC-1"}',
    error: null,
    status_log: '[{"status":"queued"}]',
    user_id: null,
    company_id: "company-1"
  });

  assert.equal(job.id, "job-auc-fixed");
  assert.equal(job.status, "ready");
  assert.deepEqual(job.input, { company: "Aurora Copper" });
  assert.deepEqual(job.report, { id: "AUC-1" });
  assert.deepEqual(job.statusLog, [{ status: "queued" }]);
  assert.equal(job.companyId, "company-1");
});

test("sourceRowsFromInput normalizes URLs, uploaded files, and pasted text", () => {
  const rows = sourceRowsFromInput({
    sourceUrls: "https://example.com/report\nhttps://example.com/news",
    sourceText: "NI 43-101 technical report text",
    files: [
      { name: "deck.pdf", type: "application/pdf", text: "" },
      { name: "notes.md", type: "text/markdown", text: "assay notes" }
    ]
  });

  assert.equal(rows.length, 5);
  assert.equal(rows[0].sourceType, "url");
  assert.equal(rows[2].fileName, "deck.pdf");
  assert.equal(rows[3].metadata.textParsed, true);
  assert.equal(rows[4].sourceType, "pasted_text");
});
