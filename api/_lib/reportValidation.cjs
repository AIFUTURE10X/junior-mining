"use strict";

const VALID_ACTIONS = new Set(["processing", "complete", "fail"]);

function compact(value) {
  return String(value || "").trim();
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    return body ? JSON.parse(body) : {};
  }

  return body;
}

function normalizeCreatePayload(body) {
  const payload = parseBody(body);
  const input = payload.input && typeof payload.input === "object" ? payload.input : payload;
  const company = compact(input.company);
  const ticker = compact(input.ticker).toUpperCase();

  if (!company && !ticker) {
    const error = new Error("Enter a company name or ticker.");
    error.statusCode = 400;
    throw error;
  }

  return {
    ...input,
    company,
    ticker
  };
}

function normalizePatchPayload(body) {
  const payload = parseBody(body);
  const id = compact(payload.id);
  const action = compact(payload.action).toLowerCase();

  if (!id) {
    const error = new Error("Report job id is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_ACTIONS.has(action)) {
    const error = new Error("Report job action must be processing, complete, or fail.");
    error.statusCode = 400;
    throw error;
  }

  if (action === "complete" && (!payload.report || typeof payload.report !== "object")) {
    const error = new Error("Completed report payload is required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    id,
    action,
    report: payload.report || null,
    error: payload.error || null
  };
}

function normalizeLimit(value, fallback = 10, max = 50) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

module.exports = {
  normalizeCreatePayload,
  normalizePatchPayload,
  normalizeLimit,
  parseBody
};
