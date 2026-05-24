"use strict";

const jobs = require("../app/jobStore.js");
const repository = require("./_lib/reportRepository.cjs");
const {
  normalizeCreatePayload,
  normalizeLimit,
  normalizePatchPayload,
  parseBody
} = require("./_lib/reportValidation.cjs");

let sqlClientPromise = null;

async function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    const error = new Error("DATABASE_URL or NEON_DATABASE_URL is required.");
    error.statusCode = 500;
    throw error;
  }

  if (!sqlClientPromise) {
    sqlClientPromise = import("@neondatabase/serverless").then(({ neon }) => neon(databaseUrl));
  }

  return sqlClientPromise;
}

function setJsonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}

function getQuery(req) {
  if (req.query) {
    return req.query;
  }

  const url = new URL(req.url || "/", "https://oreiq.local");
  return Object.fromEntries(url.searchParams.entries());
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  send(res, error.statusCode || 500, {
    error: error.message || "Report job API failed."
  });
}

async function handleGet(req, res, sql) {
  const query = getQuery(req);

  if (query.id) {
    const job = await repository.getReportJob(sql, String(query.id));

    if (!job) {
      send(res, 404, { error: "Report job not found." });
      return;
    }

    send(res, 200, { job });
    return;
  }

  const limit = normalizeLimit(query.limit);
  const reportJobs = await repository.listReportJobs(sql, limit);
  send(res, 200, { jobs: reportJobs });
}

async function handlePost(req, res, sql) {
  const input = normalizeCreatePayload(parseBody(await readRequestBody(req)));
  const job = jobs.createReportJob(input);
  const savedJob = await repository.insertReportJob(sql, job);
  send(res, 201, { job: savedJob });
}

async function handlePatch(req, res, sql) {
  const payload = normalizePatchPayload(parseBody(await readRequestBody(req)));
  const existingJob = await repository.getReportJob(sql, payload.id);

  if (!existingJob) {
    send(res, 404, { error: "Report job not found." });
    return;
  }

  const updatedJob = payload.action === "processing"
    ? jobs.markJobProcessing(existingJob)
    : payload.action === "complete"
      ? jobs.completeReportJob(existingJob, payload.report)
      : jobs.failReportJob(existingJob, payload.error || new Error("Report generation failed."));

  const savedJob = await repository.updateReportJob(sql, updatedJob);
  send(res, 200, { job: savedJob });
}

module.exports = async function handler(req, res) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }

  try {
    const sql = await getSqlClient();

    if (req.method === "GET") {
      await handleGet(req, res, sql);
      return;
    }

    if (req.method === "POST") {
      await handlePost(req, res, sql);
      return;
    }

    if (req.method === "PATCH") {
      await handlePatch(req, res, sql);
      return;
    }

    send(res, 405, { error: "Use GET, POST, or PATCH for report jobs." });
  } catch (error) {
    sendError(res, error);
  }
};
