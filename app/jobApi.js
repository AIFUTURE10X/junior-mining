(function attachOreIQJobApi(root) {
  "use strict";

  function canUseApi() {
    return root.location && /^https?:$/.test(root.location.protocol);
  }

  function endpoint(query) {
    const url = new URL("/api/report-jobs", root.location.origin);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    return url.toString();
  }

  async function request(method, body, query) {
    const response = await fetch(endpoint(query), {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Report job API returned ${response.status}.`);
    }

    return payload;
  }

  async function listReportJobs(limit = 10) {
    const payload = await request("GET", null, { limit });
    return payload.jobs || [];
  }

  async function getReportJob(id) {
    const payload = await request("GET", null, { id });
    return payload.job;
  }

  async function createReportJob(input) {
    const payload = await request("POST", { input });
    return payload.job;
  }

  async function updateReportJob(id, action, options) {
    const payload = await request("PATCH", {
      id,
      action,
      report: options && options.report,
      error: options && options.error
    });

    return payload.job;
  }

  root.OreIQJobApi = {
    canUseApi,
    createReportJob,
    getReportJob,
    listReportJobs,
    updateReportJob
  };
})(window);
