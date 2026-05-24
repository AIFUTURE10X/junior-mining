const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createReportJob,
  markJobProcessing,
  completeReportJob,
  failReportJob,
  summarizeJob
} = require("./jobStore.js");

const baseInput = {
  company: "Aurora Copper",
  ticker: "auc",
  sourceText: "NI 43-101 report and assay results."
};

test("createReportJob queues normalized report requests", () => {
  const job = createReportJob(baseInput, { now: "2026-05-24T09:00:00.000Z", idSeed: "fixed" });

  assert.equal(job.id, "job-auc-fixed");
  assert.equal(job.status, "queued");
  assert.equal(job.company, "Aurora Copper");
  assert.equal(job.ticker, "AUC");
  assert.equal(job.requestedAt, "2026-05-24T09:00:00.000Z");
  assert.equal(job.updatedAt, "2026-05-24T09:00:00.000Z");
  assert.deepEqual(job.statusLog, [
    {
      status: "queued",
      at: "2026-05-24T09:00:00.000Z",
      message: "Report request queued."
    }
  ]);
});

test("report jobs move from queued to processing to ready without mutating previous states", () => {
  const queued = createReportJob(baseInput, { now: "2026-05-24T09:00:00.000Z", idSeed: "fixed" });
  const processing = markJobProcessing(queued, { now: "2026-05-24T09:01:00.000Z" });
  const ready = completeReportJob(processing, { id: "AUC-1", rating: "Watchlist candidate" }, { now: "2026-05-24T09:02:00.000Z" });

  assert.equal(queued.status, "queued");
  assert.equal(processing.status, "processing");
  assert.equal(ready.status, "ready");
  assert.equal(ready.report.id, "AUC-1");
  assert.equal(ready.statusLog.length, 3);
  assert.deepEqual(ready.statusLog.map((entry) => entry.status), ["queued", "processing", "ready"]);
});

test("failReportJob records a safe failure message", () => {
  const queued = createReportJob(baseInput, { now: "2026-05-24T09:00:00.000Z", idSeed: "fixed" });
  const failed = failReportJob(queued, new Error("Report contains prohibited direct financial-advice language."), {
    now: "2026-05-24T09:03:00.000Z"
  });

  assert.equal(failed.status, "failed");
  assert.equal(failed.error, "Report contains prohibited direct financial-advice language.");
  assert.equal(failed.statusLog.at(-1).status, "failed");
  assert.equal(failed.statusLog.at(-1).message, "Report contains prohibited direct financial-advice language.");
});

test("summarizeJob returns compact UI copy for each status", () => {
  const queued = createReportJob(baseInput, { now: "2026-05-24T09:00:00.000Z", idSeed: "fixed" });
  const processing = markJobProcessing(queued, { now: "2026-05-24T09:01:00.000Z" });
  const ready = completeReportJob(processing, { id: "AUC-1", confidence: 82 }, { now: "2026-05-24T09:02:00.000Z" });

  assert.deepEqual(summarizeJob(queued), {
    id: "job-auc-fixed",
    status: "queued",
    label: "Queued",
    company: "Aurora Copper",
    ticker: "AUC",
    detail: "Waiting to start."
  });
  assert.equal(summarizeJob(processing).detail, "Analyzing sources.");
  assert.equal(summarizeJob(ready).detail, "Report ready.");
});
