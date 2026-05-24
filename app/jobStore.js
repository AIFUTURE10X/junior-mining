(function attachOreIQJobs(root) {
  "use strict";

  const STATUS_LABELS = {
    queued: "Queued",
    processing: "Processing",
    ready: "Ready",
    failed: "Failed"
  };

  function compact(value) {
    return String(value || "").trim();
  }

  function timestamp(options) {
    return options && options.now ? options.now : new Date().toISOString();
  }

  function idPart(value) {
    return compact(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report";
  }

  function makeId(input, options) {
    const seed = options && options.idSeed ? options.idSeed : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return `job-${idPart(input.ticker || input.company)}-${idPart(seed)}`;
  }

  function logEntry(status, at, message) {
    return { status, at, message };
  }

  function appendStatus(job, status, message, options) {
    const at = timestamp(options);
    return {
      ...job,
      status,
      updatedAt: at,
      statusLog: [...(job.statusLog || []), logEntry(status, at, message)]
    };
  }

  function createReportJob(input, options) {
    const at = timestamp(options);
    const company = compact(input.company) || "Selected Mining Company";
    const ticker = compact(input.ticker).toUpperCase() || "TICKER";

    return {
      id: makeId({ company, ticker }, options),
      status: "queued",
      company,
      ticker,
      requestedAt: at,
      updatedAt: at,
      input: { ...input, company, ticker },
      statusLog: [logEntry("queued", at, "Report request queued.")]
    };
  }

  function markJobProcessing(job, options) {
    return appendStatus(job, "processing", "Analyzing submitted sources.", options);
  }

  function completeReportJob(job, report, options) {
    return {
      ...appendStatus(job, "ready", "Report ready.", options),
      report
    };
  }

  function failReportJob(job, error, options) {
    const message = compact(error && error.message) || "Report generation failed.";
    return {
      ...appendStatus(job, "failed", message, options),
      error: message
    };
  }

  function summarizeJob(job) {
    const status = job.status || "queued";
    const details = {
      queued: "Waiting to start.",
      processing: "Analyzing sources.",
      ready: "Report ready.",
      failed: job.error || "Needs review."
    };

    return {
      id: job.id,
      status,
      label: STATUS_LABELS[status] || "Queued",
      company: job.company,
      ticker: job.ticker,
      detail: details[status] || details.queued
    };
  }

  const api = {
    createReportJob,
    markJobProcessing,
    completeReportJob,
    failReportJob,
    summarizeJob
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.OreIQJobs = api;
})(typeof window !== "undefined" ? window : globalThis);
