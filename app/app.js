(function initOreIQApp() {
  "use strict";

  const STORAGE_KEY = "oreiq.savedReports.v1";
  const JOB_STORAGE_KEY = "oreiq.reportJobs.v1";
  const engine = window.OreIQEngine;
  const jobs = window.OreIQJobs;
  const jobApi = window.OreIQJobApi;

  const sampleInput = {
    company: "Northern Shield Metals",
    ticker: "NSM",
    exchange: "TSXV",
    commodity: "Copper",
    stage: "Resource definition",
    jurisdiction: "British Columbia",
    marketCap: "85",
    valuationMetrics:
      "P/NAV | 0.42x\n" +
      "EV/oz | $38/oz\n" +
      "AISC | $17/oz AgEq\n" +
      "Reserve life | 8 years",
    peerMetrics:
      "Company | Stage | P/NAV | EV/oz | AISC | EV/EBITDA | P/CF | Reserve life\n" +
      "Boreal Copper | Developer | 0.60x | $52/oz | $19/oz AgEq |  |  | 10 years\n" +
      "Canyon Metals | Explorer | 0.30x | $24/oz |  |  |  | ",
    sourceUrls: [
      "https://example.com/northern-shield-ni-43-101",
      "https://example.com/northern-shield-assay-results"
    ],
    sourceText:
      "NI 43-101 technical report confirms an inferred copper resource. Recent assay results returned copper intercepts from step-out drilling. Management announced a resource update and metallurgy test work. The company is also preparing a permitting update.",
    expertSources:
      "Rick Rule | Public interview | https://example.com/rick-rule-copper | Discussed copper optionality and management discipline for Northern Shield Metals.\n" +
      "Don Durrett | Public article | https://example.com/don-durrett-nsm | Mentioned Northern Shield Metals as a high-risk exploration story that needs assay follow-up.",
    files: [
      { name: "Northern-Shield-NI-43-101.pdf", type: "application/pdf", text: "" }
    ]
  };

  const els = {
    appMode: document.getElementById("app-mode"),
    form: document.getElementById("analysis-form"),
    company: document.getElementById("company"),
    ticker: document.getElementById("ticker"),
    exchange: document.getElementById("exchange"),
    commodity: document.getElementById("commodity"),
    stage: document.getElementById("stage"),
    jurisdiction: document.getElementById("jurisdiction"),
    marketCap: document.getElementById("market-cap"),
    valuationMetrics: document.getElementById("valuation-metrics"),
    peerMetrics: document.getElementById("peer-metrics"),
    sourceUrls: document.getElementById("source-urls"),
    sourceText: document.getElementById("source-text"),
    expertSources: document.getElementById("expert-sources"),
    sourceFiles: document.getElementById("source-files"),
    fileList: document.getElementById("file-list"),
    formError: document.getElementById("form-error"),
    reportTitle: document.getElementById("report-title"),
    reportContent: document.getElementById("report-content"),
    saveReport: document.getElementById("save-report"),
    exportReport: document.getElementById("export-report"),
    printReport: document.getElementById("print-report"),
    loadSample: document.getElementById("load-sample"),
    refreshJobs: document.getElementById("refresh-jobs"),
    jobList: document.getElementById("job-list"),
    watchlist: document.getElementById("watchlist"),
    alertList: document.getElementById("alert-list"),
    status: document.getElementById("status-text")
  };

  let selectedFiles = [];
  let currentReport = null;
  let useHostedJobs = false;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function setAppMode(label) {
    const dot = document.createElement("span");
    els.appMode.replaceChildren(dot, document.createTextNode(label));
  }

  function setError(message) {
    els.formError.textContent = message || "";
  }

  function getSavedReports() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      setStatus("Watchlist storage could not be read.");
      return [];
    }
  }

  function setSavedReports(reports) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      return true;
    } catch (error) {
      setStatus("Watchlist storage is unavailable in this browser mode.");
      return false;
    }
  }

  function getReportJobs() {
    try {
      return JSON.parse(localStorage.getItem(JOB_STORAGE_KEY) || "[]");
    } catch (error) {
      setStatus("Report job storage could not be read.");
      return [];
    }
  }

  function setReportJobs(reportJobs) {
    try {
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(reportJobs));
      return true;
    } catch (error) {
      setStatus("Report job storage is unavailable in this browser mode.");
      return false;
    }
  }

  function upsertReportJob(job) {
    const reportJobs = getReportJobs().filter((item) => item.id !== job.id);
    reportJobs.unshift(job);
    const trimmed = reportJobs.slice(0, 10);

    if (setReportJobs(trimmed)) {
      renderJobQueue();
      return job;
    }

    return null;
  }

  function updateReportJob(id, updater) {
    const reportJobs = getReportJobs();
    const existing = reportJobs.find((job) => job.id === id);

    if (!existing) {
      return null;
    }

    return upsertReportJob(updater(existing));
  }

  function canUseHostedJobs() {
    return Boolean(jobApi && jobApi.canUseApi());
  }

  async function connectHostedJobs() {
    if (!canUseHostedJobs()) {
      setAppMode("Local job engine");
      return false;
    }

    try {
      const reportJobs = await jobApi.listReportJobs(10);
      setReportJobs(reportJobs);
      useHostedJobs = true;
      setAppMode("Neon job API");
      setStatus("Refreshed hosted report jobs from Neon.");
      return true;
    } catch (error) {
      useHostedJobs = false;
      setAppMode("Local job engine");
      setStatus("Using local job engine until the Neon API is configured.");
      return false;
    }
  }

  function fallBackToLocalJobs(message) {
    useHostedJobs = false;
    setAppMode("Local job engine");

    if (message) {
      setStatus(message);
    }
  }

  function readForm() {
    return {
      company: els.company.value,
      ticker: els.ticker.value,
      exchange: els.exchange.value,
      commodity: els.commodity.value,
      stage: els.stage.value,
      jurisdiction: els.jurisdiction.value,
      marketCap: els.marketCap.value,
      valuationMetrics: els.valuationMetrics.value,
      peerMetrics: els.peerMetrics.value,
      sourceUrls: els.sourceUrls.value,
      sourceText: els.sourceText.value,
      expertSources: els.expertSources.value,
      files: selectedFiles
    };
  }

  function fillForm(input) {
    els.company.value = input.company || "";
    els.ticker.value = input.ticker || "";
    els.exchange.value = input.exchange || "";
    els.commodity.value = input.commodity || "Copper";
    els.stage.value = input.stage || "Resource definition";
    els.jurisdiction.value = input.jurisdiction || "";
    els.marketCap.value = input.marketCap || "";
    els.valuationMetrics.value = typeof input.valuationMetrics === "string" ? input.valuationMetrics : "";
    els.peerMetrics.value = typeof input.peerMetrics === "string" ? input.peerMetrics : "";
    els.sourceUrls.value = Array.isArray(input.sourceUrls) ? input.sourceUrls.join("\n") : input.sourceUrls || "";
    els.sourceText.value = input.sourceText || "";
    els.expertSources.value = Array.isArray(input.expertSources)
      ? input.expertSources.map((item) => `${item.name || ""} | ${item.sourceType || item.type || ""} | ${item.sourceUrl || item.url || ""} | ${item.commentary || item.note || ""}`).join("\n")
      : input.expertSources || "";
    selectedFiles = input.files || [];
    renderFileList();
  }

  function validateReportInput(input) {
    const cleanedCompany = String(input.company || "").trim();
    const cleanedTicker = String(input.ticker || "").trim();

    if (!cleanedCompany && !cleanedTicker) {
      setError("Enter a company name or ticker.");
      return false;
    }

    setError("");
    return true;
  }

  async function submitReportJob(input) {
    if (!validateReportInput(input)) {
      return;
    }

    let job = null;

    if (useHostedJobs || canUseHostedJobs()) {
      try {
        job = upsertReportJob(await jobApi.createReportJob(input));
        useHostedJobs = true;
        setAppMode("Neon job API");
      } catch (error) {
        fallBackToLocalJobs("Neon job API unavailable; queued the report locally.");
      }
    }

    if (!job) {
      job = upsertReportJob(jobs.createReportJob(input));
    }

    if (!job) {
      return;
    }

    enableReportActions(false);
    setStatus(`Queued ${job.ticker} report job${useHostedJobs ? " in Neon" : ""}.`);
    scheduleReportJob(job.id);
  }

  function scheduleReportJob(id) {
    window.setTimeout(async () => {
      let processingJob = null;

      if (useHostedJobs) {
        try {
          processingJob = upsertReportJob(await jobApi.updateReportJob(id, "processing"));
        } catch (error) {
          fallBackToLocalJobs("Neon processing update failed; continuing locally.");
        }
      }

      if (!processingJob) {
        processingJob = updateReportJob(id, (job) => jobs.markJobProcessing(job));
      }

      if (!processingJob) {
        return;
      }

      setStatus(`Processing ${processingJob.ticker} sources.`);

      window.setTimeout(async () => {
        try {
          const report = engine.buildReport(processingJob.input);
          report.jobId = processingJob.id;
          let readyJob = null;

          if (useHostedJobs) {
            try {
              readyJob = upsertReportJob(await jobApi.updateReportJob(processingJob.id, "complete", { report }));
            } catch (error) {
              fallBackToLocalJobs("Report is ready locally; Neon report persistence failed.");
            }
          }

          if (!readyJob) {
            readyJob = updateReportJob(processingJob.id, (job) => jobs.completeReportJob(job, report));
          }

          if (!readyJob) {
            return;
          }

          currentReport = readyJob.report;
          renderReport(currentReport);
          renderAlerts(currentReport);
          enableReportActions(true);
          setStatus(`Ready: ${currentReport.ticker} report generated with ${currentReport.confidence}% confidence${useHostedJobs ? " and saved to Neon" : ""}.`);
        } catch (error) {
          let failedJob = null;

          if (useHostedJobs) {
            try {
              failedJob = upsertReportJob(await jobApi.updateReportJob(processingJob.id, "fail", { error: error.message }));
            } catch (apiError) {
              fallBackToLocalJobs("Report generation failed; Neon failure update also failed.");
            }
          }

          if (!failedJob) {
            failedJob = updateReportJob(processingJob.id, (job) => jobs.failReportJob(job, error));
          }

          setStatus(failedJob ? `Failed: ${failedJob.error}` : "Report generation failed.");
        }
      }, 520);
    }, 180);
  }

  function enableReportActions(enabled) {
    els.saveReport.disabled = !enabled;
    els.exportReport.disabled = !enabled;
    els.printReport.disabled = !enabled;
  }

  function renderReport(report) {
    els.reportTitle.textContent = report.company;
    const valuation = report.valuation || {
      status: "No valuation data supplied",
      summary: "Add target metrics and peer rows to compare valuation context.",
      metricCards: [],
      peerRows: [
        {
          company: report.company,
          ticker: report.ticker,
          stage: report.stage,
          isTarget: true,
          metrics: {}
        }
      ]
    };

    const scoreTiles = Object.entries(report.scorecard)
      .map(([key, item]) => `
        <article class="score-tile">
          <span>${escapeHtml(engine.labelFromKey(key))}</span>
          <strong>${escapeHtml(item.score)}/10</strong>
          <p>${escapeHtml(item.rationale)}</p>
        </article>
      `)
      .join("");

    const evidenceRows = report.evidence
      .map((item) => `
        <tr>
          <td><span class="type-pill ${escapeHtml(item.type)}">${escapeHtml(item.type)}</span></td>
          <td>${escapeHtml(item.source)}</td>
          <td>${escapeHtml(item.cue)}</td>
          <td>${escapeHtml(item.finding)}</td>
          <td>${escapeHtml(item.confidence)}</td>
        </tr>
      `)
      .join("");
    const expertRows = report.expertSignals.items.length
      ? report.expertSignals.items
          .map((item) => `
            <article class="expert-card">
              <div>
                <span>${escapeHtml(item.sourceType)}</span>
                <h4>${escapeHtml(item.name)}</h4>
              </div>
              <p>${escapeHtml(item.commentary)}</p>
              <small>${escapeHtml(item.sourceUrl || "Source URL not supplied")} / ${escapeHtml(item.signal)} / ${escapeHtml(item.confidence)}</small>
            </article>
          `)
          .join("")
      : `<article class="expert-card muted-card"><p>No public expert commentary supplied for this report.</p></article>`;
    const valuationMetricCards = valuation.metricCards.length
      ? valuation.metricCards
          .map((item) => `
            <article class="valuation-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <p>${escapeHtml(item.position)} / peer median ${escapeHtml(item.peerMedian)}.</p>
              <small>${escapeHtml(item.stageContext)}</small>
            </article>
          `)
          .join("")
      : `<article class="valuation-card muted-card"><p>No valuation metrics supplied yet.</p></article>`;
    const valuationColumns = [
      ["pNav", "P/NAV"],
      ["evPerOz", "EV/oz"],
      ["aisc", "AISC"],
      ["evEbitda", "EV/EBITDA"],
      ["pCashFlow", "P/CF"],
      ["reserveLife", "Reserve life"]
    ];
    const valuationHeader = valuationColumns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
    const valuationRows = valuation.peerRows
      .map((row) => `
        <tr class="${row.isTarget ? "target-row" : ""}">
          <td>
            <strong>${escapeHtml(row.company)}</strong>
            <small>${escapeHtml(row.ticker || row.stage || "")}</small>
          </td>
          ${valuationColumns.map(([key]) => `<td>${escapeHtml(row.metrics[key] || "-")}</td>`).join("")}
        </tr>
      `)
      .join("");

    els.reportContent.innerHTML = `
      <div class="report-hero">
        <section class="report-hero-card">
          <div class="meta-line">${escapeHtml(report.exchange || "Exchange pending")} / ${escapeHtml(report.commodity)} / ${escapeHtml(report.stage)}</div>
          <h3>${escapeHtml(report.company)} (${escapeHtml(report.ticker)})</h3>
          <div class="meta-line">${escapeHtml(report.jurisdiction)}${report.marketCap ? ` / Market cap: ${escapeHtml(report.marketCap)}` : ""}</div>
          <div class="rating-pill">${escapeHtml(report.rating)}</div>
          <div class="generated-line">Generated ${escapeHtml(formatDate(report.generatedAt))}</div>
        </section>

        <aside class="confidence-card">
          <span>Confidence</span>
          <strong>${escapeHtml(report.confidence)}%</strong>
          <div class="meter" aria-hidden="true"><i style="--meter: ${Math.max(5, report.confidence)}%"></i></div>
        </aside>
      </div>

      <section class="report-section valuation-section">
        <div class="section-title-row">
          <div>
            <h3>Valuation vs peers</h3>
            <p><strong>${escapeHtml(valuation.status)}:</strong> ${escapeHtml(valuation.summary)}</p>
          </div>
        </div>
        <div class="valuation-grid">${valuationMetricCards}</div>
        <div class="valuation-table-wrap">
          <table class="valuation-table">
            <thead>
              <tr>
                <th>Company</th>
                ${valuationHeader}
              </tr>
            </thead>
            <tbody>${valuationRows}</tbody>
          </table>
        </div>
      </section>

      <div class="score-grid">${scoreTiles}</div>

      <section class="report-section">
        <h3>Executive summary</h3>
        <ul class="summary-list">${report.summary.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      </section>

      <div class="section-columns">
        <section class="report-section">
          <h3>Red flags</h3>
          <ul class="compact-list risk-list">${listItems(report.redFlags, "No red flag above the local threshold.")}</ul>
        </section>
        <section class="report-section">
          <h3>Catalysts</h3>
          <ul class="compact-list catalyst-list">${listItems(report.catalysts, "No clear catalyst found.")}</ul>
        </section>
        <section class="report-section">
          <h3>Missing information</h3>
          <ul class="compact-list missing-list">${listItems(report.missingInformation, "No major missing item detected.")}</ul>
        </section>
      </div>

      <section class="report-section">
        <h3>Hype and sentiment</h3>
        <p><strong>${escapeHtml(report.hype.status)}:</strong> ${escapeHtml(report.hype.rationale)} Confidence: ${escapeHtml(report.hype.confidence)}.</p>
      </section>

      <section class="report-section">
        <h3>Expert signals</h3>
        <p><strong>${escapeHtml(report.expertSignals.status)}:</strong> ${escapeHtml(report.expertSignals.summary)}</p>
        <p class="guardrail-copy">${escapeHtml(report.expertSignals.guardrail)}</p>
        <div class="expert-grid">${expertRows}</div>
      </section>

      <section class="report-section">
        <h3>Evidence table</h3>
        <div class="evidence-table-wrap">
          <table class="evidence-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Cue</th>
                <th>Finding</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>${evidenceRows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function listItems(items, fallback) {
    const list = items && items.length ? items : [fallback];
    return list.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function renderWatchlist() {
    const reports = getSavedReports();

    if (!reports.length) {
      els.watchlist.innerHTML = `<div class="alert-item">No saved reports yet.</div>`;
      return;
    }

    els.watchlist.innerHTML = reports
      .map((report) => `
        <div class="watch-actions">
          <button class="watch-item" type="button" data-load-id="${escapeHtml(report.id)}">
            <strong>${escapeHtml(report.ticker)} - ${escapeHtml(report.company)}</strong>
            <span>${escapeHtml(report.rating)} / ${escapeHtml(report.confidence)}%</span>
            <small>${escapeHtml(formatDate(report.generatedAt))}</small>
          </button>
          <button class="remove-watch" type="button" data-remove-id="${escapeHtml(report.id)}" title="Remove saved report">X</button>
        </div>
      `)
      .join("");
  }

  function renderJobQueue() {
    const reportJobs = getReportJobs();

    if (!reportJobs.length) {
      els.jobList.innerHTML = `<div class="alert-item">No report jobs yet.</div>`;
      return;
    }

    els.jobList.innerHTML = reportJobs
      .map((job) => {
        const summary = jobs.summarizeJob(job);
        const disabled = summary.status === "ready" ? "" : " disabled";
        const generated = job.report ? `${job.report.confidence}% confidence` : summary.detail;

        return `
          <button class="job-item ${escapeHtml(summary.status)}" type="button" data-load-job-id="${escapeHtml(summary.id)}"${disabled}>
            <span>${escapeHtml(summary.label)}</span>
            <strong>${escapeHtml(summary.ticker)} - ${escapeHtml(summary.company)}</strong>
            <small>${escapeHtml(generated)}</small>
            <small>${escapeHtml(formatDate(job.updatedAt))}</small>
          </button>
        `;
      })
      .join("");
  }

  async function loadReadyJob(id) {
    let job = getReportJobs().find((item) => item.id === id);

    if (useHostedJobs && jobApi && (!job || !job.report || !job.report.scorecard)) {
      try {
        job = upsertReportJob(await jobApi.getReportJob(id));
      } catch (error) {
        setStatus("Could not load the full hosted report. Try refresh again.");
      }
    }

    if (!job || job.status !== "ready" || !job.report || !job.report.scorecard) {
      setStatus("Report job is not ready yet.");
      return;
    }

    currentReport = job.report;
    renderReport(currentReport);
    renderAlerts(currentReport);
    enableReportActions(true);
    setStatus(`Opened ready ${currentReport.ticker} report job.`);
  }

  function saveCurrentReport() {
    if (!currentReport) {
      return;
    }

    const reports = getSavedReports().filter((report) => report.id !== currentReport.id);
    reports.unshift(currentReport);
    const trimmed = reports.slice(0, 12);

    if (setSavedReports(trimmed)) {
      renderWatchlist();
      setStatus(`Saved ${currentReport.ticker} to the local watchlist.`);
    }
  }

  function loadSavedReport(id) {
    const report = getSavedReports().find((item) => item.id === id);
    if (!report) {
      setStatus("Saved report was not found.");
      renderWatchlist();
      return;
    }

    currentReport = report;
    renderReport(report);
    renderAlerts(report);
    enableReportActions(true);
    setStatus(`Loaded ${report.ticker} from the local watchlist.`);
  }

  function removeSavedReport(id) {
    const reports = getSavedReports().filter((item) => item.id !== id);
    if (setSavedReports(reports)) {
      renderWatchlist();
      setStatus("Removed saved report.");
    }
  }

  function renderAlerts(report) {
    const alerts = [];

    if (!report) {
      els.alertList.innerHTML = `<div class="alert-item">Generate a report to populate review alerts.</div>`;
      return;
    }

    report.redFlags.slice(0, 3).forEach((flag) => {
      alerts.push({ kind: "risk", text: flag });
    });

    report.catalysts.slice(0, 3).forEach((catalyst) => {
      alerts.push({ kind: "catalyst", text: catalyst });
    });

    if (report.hype.status !== "Neutral") {
      alerts.push({ kind: "risk", text: `Hype status: ${report.hype.status}. ${report.hype.rationale}` });
    }

    if (report.expertSignals.items.length) {
      alerts.push({ kind: "expert", text: `${report.expertSignals.items.length} expert signal source(s) attached for source-backed comparison.` });
    }

    els.alertList.innerHTML = alerts.length
      ? alerts.map((item) => `<div class="alert-item ${escapeHtml(item.kind)}">${escapeHtml(item.text)}</div>`).join("")
      : `<div class="alert-item">No active review alert for this report.</div>`;
  }

  function exportMarkdown() {
    if (!currentReport) {
      return;
    }

    const markdown = engine.reportToMarkdown(currentReport);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentReport.ticker.toLowerCase()}-oreiq-report.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${currentReport.ticker} Markdown report.`);
  }

  async function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    selectedFiles = await Promise.all(files.map(readSourceFile));
    renderFileList();
    setStatus(selectedFiles.length ? `${selectedFiles.length} source file(s) staged.` : "No source files staged.");
  }

  function readSourceFile(file) {
    const isText = /^text\//.test(file.type) || /\.(txt|md|csv)$/i.test(file.name);

    if (!isText) {
      return Promise.resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        text: ""
      });
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type || "text/plain",
          text: String(reader.result || "")
        });
      };
      reader.onerror = () => {
        resolve({
          name: file.name,
          type: file.type || "text/plain",
          text: ""
        });
      };
      reader.readAsText(file);
    });
  }

  function renderFileList() {
    els.fileList.innerHTML = selectedFiles
      .map((file) => `<li>${escapeHtml(file.name)}${file.text ? " / text parsed" : " / metadata only"}</li>`)
      .join("");
  }

  function handleWatchlistClick(event) {
    const loadButton = event.target.closest("[data-load-id]");
    const removeButton = event.target.closest("[data-remove-id]");

    if (loadButton) {
      loadSavedReport(loadButton.dataset.loadId);
    }

    if (removeButton) {
      removeSavedReport(removeButton.dataset.removeId);
    }
  }

  function handleJobClick(event) {
    const loadButton = event.target.closest("[data-load-job-id]");

    if (loadButton) {
      loadReadyJob(loadButton.dataset.loadJobId);
    }
  }

  async function refreshHostedJobs() {
    if (!canUseHostedJobs()) {
      setStatus("Hosted Neon refresh needs the app to run from an http deployment.");
      return;
    }

    await connectHostedJobs();
    renderJobQueue();
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitReportJob(readForm());
  });

  els.sourceFiles.addEventListener("change", handleFileSelection);
  els.saveReport.addEventListener("click", saveCurrentReport);
  els.exportReport.addEventListener("click", exportMarkdown);
  els.printReport.addEventListener("click", () => window.print());
  els.refreshJobs.addEventListener("click", refreshHostedJobs);
  els.loadSample.addEventListener("click", () => {
    fillForm(sampleInput);
    submitReportJob(readForm());
  });
  els.jobList.addEventListener("click", handleJobClick);
  els.watchlist.addEventListener("click", handleWatchlistClick);

  async function init() {
    fillForm(sampleInput);
    setAppMode(canUseHostedJobs() ? "On-demand Neon sync" : "Local job engine");
    renderWatchlist();
    renderAlerts(null);
    renderJobQueue();

    const existingJobs = getReportJobs();
    const latestReadyJob = existingJobs.find((job) => job.status === "ready" && job.report);

    if (latestReadyJob) {
      loadReadyJob(latestReadyJob.id);
    } else if (!existingJobs.length && !canUseHostedJobs()) {
      submitReportJob(readForm());
    }
  }

  init();
})();
