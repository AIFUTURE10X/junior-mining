"use strict";

function compact(value) {
  return String(value || "").trim();
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  return value;
}

function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map(compact).filter(Boolean);
  }

  return compact(value)
    .split(/\r?\n|,/)
    .map(compact)
    .filter(Boolean);
}

function toDateString(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

async function query(sql, text, params = []) {
  if (!sql || typeof sql.query !== "function") {
    throw new Error("Neon SQL client with query() is required.");
  }

  return sql.query(text, params);
}

function rowToJob(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    company: row.company,
    ticker: row.ticker,
    requestedAt: toDateString(row.requested_at),
    updatedAt: toDateString(row.updated_at),
    input: parseJson(row.input, {}),
    report: parseJson(row.report, null),
    error: row.error || "",
    statusLog: parseJson(row.status_log, []),
    userId: row.user_id || null,
    companyId: row.company_id || null
  };
}

function sourceRowsFromInput(input) {
  const sourceUrls = splitLines(input.sourceUrls);
  const files = Array.isArray(input.files) ? input.files : [];
  const rows = sourceUrls.map((url) => ({
    title: "",
    url,
    fileName: "",
    sourceType: "url",
    extractedText: "",
    metadata: {}
  }));

  files.forEach((file) => {
    rows.push({
      title: compact(file.name),
      url: "",
      fileName: compact(file.name),
      sourceType: compact(file.type) || "file",
      extractedText: compact(file.text),
      metadata: {
        mimeType: compact(file.type),
        textParsed: Boolean(compact(file.text))
      }
    });
  });

  if (compact(input.sourceText)) {
    rows.push({
      title: "Submitted source text",
      url: "",
      fileName: "",
      sourceType: "pasted_text",
      extractedText: compact(input.sourceText),
      metadata: {}
    });
  }

  return rows;
}

async function upsertCompany(sql, input) {
  const rows = await query(
    sql,
    `
      insert into companies (ticker, exchange, name, commodity, stage, jurisdiction, market_cap_text)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (exchange, ticker) do update set
        name = excluded.name,
        commodity = excluded.commodity,
        stage = excluded.stage,
        jurisdiction = excluded.jurisdiction,
        market_cap_text = excluded.market_cap_text,
        updated_at = now()
      returning id
    `,
    [
      compact(input.ticker).toUpperCase() || "TICKER",
      compact(input.exchange).toUpperCase(),
      compact(input.company) || "Selected Mining Company",
      compact(input.commodity),
      compact(input.stage),
      compact(input.jurisdiction),
      compact(input.marketCap)
    ]
  );

  return rows[0].id;
}

async function replaceSources(sql, reportJobId, input) {
  await query(sql, "delete from sources where report_job_id = $1", [reportJobId]);

  for (const row of sourceRowsFromInput(input)) {
    await query(
      sql,
      `
        insert into sources (report_job_id, title, url, file_name, source_type, extracted_text, metadata)
        values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        reportJobId,
        row.title,
        row.url,
        row.fileName,
        row.sourceType,
        row.extractedText,
        JSON.stringify(row.metadata)
      ]
    );
  }
}

async function insertReportJob(sql, job) {
  const companyId = await upsertCompany(sql, job.input || {});
  const rows = await query(
    sql,
    `
      insert into report_jobs (
        id, company_id, status, company, ticker, input, report, error, requested_at, updated_at, status_log
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11::jsonb)
      on conflict (id) do update set
        company_id = excluded.company_id,
        status = excluded.status,
        company = excluded.company,
        ticker = excluded.ticker,
        input = excluded.input,
        report = excluded.report,
        error = excluded.error,
        updated_at = excluded.updated_at,
        status_log = excluded.status_log
      returning *
    `,
    [
      job.id,
      companyId,
      job.status,
      job.company,
      job.ticker,
      JSON.stringify(job.input || {}),
      job.report ? JSON.stringify(job.report) : null,
      job.error || null,
      job.requestedAt,
      job.updatedAt,
      JSON.stringify(job.statusLog || [])
    ]
  );

  await replaceSources(sql, job.id, job.input || {});
  return rowToJob(rows[0]);
}

async function listReportJobs(sql, limit) {
  const rows = await query(
    sql,
    "select * from report_jobs order by updated_at desc limit $1",
    [limit]
  );

  return rows.map(rowToJob);
}

async function getReportJob(sql, id) {
  const rows = await query(sql, "select * from report_jobs where id = $1", [id]);
  return rowToJob(rows[0]);
}

async function updateReportJob(sql, job) {
  const rows = await query(
    sql,
    `
      update report_jobs set
        status = $2,
        input = $3::jsonb,
        report = $4::jsonb,
        error = $5,
        updated_at = $6,
        status_log = $7::jsonb
      where id = $1
      returning *
    `,
    [
      job.id,
      job.status,
      JSON.stringify(job.input || {}),
      job.report ? JSON.stringify(job.report) : null,
      job.error || null,
      job.updatedAt,
      JSON.stringify(job.statusLog || [])
    ]
  );

  const savedJob = rowToJob(rows[0]);

  if (savedJob && savedJob.status === "ready" && savedJob.report) {
    await persistReport(sql, savedJob);
  }

  return savedJob;
}

async function persistReport(sql, job) {
  const report = job.report;
  const reportId = `${job.id}-report`;
  const generatedAt = report.generatedAt || job.updatedAt;

  const rows = await query(
    sql,
    `
      insert into reports (
        id, report_job_id, user_id, company_id, generated_at, rating, confidence,
        summary, red_flags, catalysts, missing_information, hype, expert_signals,
        valuation, disclaimer, full_report
      )
      values (
        $1, $2, $3, $4, $5, $6, $7,
        $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb,
        $14::jsonb, $15, $16::jsonb
      )
      on conflict (report_job_id) do update set
        id = excluded.id,
        user_id = excluded.user_id,
        company_id = excluded.company_id,
        generated_at = excluded.generated_at,
        rating = excluded.rating,
        confidence = excluded.confidence,
        summary = excluded.summary,
        red_flags = excluded.red_flags,
        catalysts = excluded.catalysts,
        missing_information = excluded.missing_information,
        hype = excluded.hype,
        expert_signals = excluded.expert_signals,
        valuation = excluded.valuation,
        disclaimer = excluded.disclaimer,
        full_report = excluded.full_report,
        updated_at = now()
      returning id
    `,
    [
      reportId,
      job.id,
      job.userId,
      job.companyId,
      generatedAt,
      compact(report.rating) || "Insufficient evidence",
      Number.isFinite(Number(report.confidence)) ? Number(report.confidence) : 0,
      JSON.stringify(report.summary || []),
      JSON.stringify(report.redFlags || []),
      JSON.stringify(report.catalysts || []),
      JSON.stringify(report.missingInformation || []),
      JSON.stringify(report.hype || {}),
      JSON.stringify(report.expertSignals || {}),
      JSON.stringify(report.valuation || {}),
      compact(report.disclaimer),
      JSON.stringify(report)
    ]
  );

  await replaceScorecard(sql, rows[0].id, report.scorecard || {});
  await replaceEvidence(sql, rows[0].id, report.evidence || []);
  return rows[0].id;
}

async function replaceScorecard(sql, reportId, scorecard) {
  await query(sql, "delete from scorecard_items where report_id = $1", [reportId]);

  for (const [categoryKey, item] of Object.entries(scorecard)) {
    await query(
      sql,
      `
        insert into scorecard_items (report_id, category_key, score, confidence, rationale)
        values ($1, $2, $3, $4, $5)
      `,
      [
        reportId,
        categoryKey,
        Number.isFinite(Number(item.score)) ? Number(item.score) : 0,
        compact(item.confidence),
        compact(item.rationale)
      ]
    );
  }
}

async function replaceEvidence(sql, reportId, evidence) {
  await query(sql, "delete from evidence_items where report_id = $1", [reportId]);

  for (const [index, item] of evidence.entries()) {
    await query(
      sql,
      `
        insert into evidence_items (report_id, sort_order, evidence_type, source, cue, finding, confidence)
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        reportId,
        index,
        compact(item.type),
        compact(item.source),
        compact(item.cue),
        compact(item.finding),
        compact(item.confidence)
      ]
    );
  }
}

module.exports = {
  getReportJob,
  insertReportJob,
  listReportJobs,
  persistReport,
  rowToJob,
  sourceRowsFromInput,
  updateReportJob
};
