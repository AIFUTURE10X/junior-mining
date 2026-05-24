(function initOreIQApp() {
  "use strict";

  const STORAGE_KEY = "oreiq.savedReports.v1";
  const engine = window.OreIQEngine;

  const sampleInput = {
    company: "Northern Shield Metals",
    ticker: "NSM",
    exchange: "TSXV",
    commodity: "Copper",
    stage: "Resource definition",
    jurisdiction: "British Columbia",
    marketCap: "85",
    sourceUrls: [
      "https://example.com/northern-shield-ni-43-101",
      "https://example.com/northern-shield-assay-results"
    ],
    sourceText:
      "NI 43-101 technical report confirms an inferred copper resource. Recent assay results returned copper intercepts from step-out drilling. Management announced a resource update and metallurgy test work. The company is also preparing a permitting update.",
    files: [
      { name: "Northern-Shield-NI-43-101.pdf", type: "application/pdf", text: "" }
    ]
  };

  const els = {
    form: document.getElementById("analysis-form"),
    company: document.getElementById("company"),
    ticker: document.getElementById("ticker"),
    exchange: document.getElementById("exchange"),
    commodity: document.getElementById("commodity"),
    stage: document.getElementById("stage"),
    jurisdiction: document.getElementById("jurisdiction"),
    marketCap: document.getElementById("market-cap"),
    sourceUrls: document.getElementById("source-urls"),
    sourceText: document.getElementById("source-text"),
    sourceFiles: document.getElementById("source-files"),
    fileList: document.getElementById("file-list"),
    formError: document.getElementById("form-error"),
    reportTitle: document.getElementById("report-title"),
    reportContent: document.getElementById("report-content"),
    saveReport: document.getElementById("save-report"),
    exportReport: document.getElementById("export-report"),
    printReport: document.getElementById("print-report"),
    loadSample: document.getElementById("load-sample"),
    watchlist: document.getElementById("watchlist"),
    alertList: document.getElementById("alert-list"),
    status: document.getElementById("status-text")
  };

  let selectedFiles = [];
  let currentReport = null;

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

  function readForm() {
    return {
      company: els.company.value,
      ticker: els.ticker.value,
      exchange: els.exchange.value,
      commodity: els.commodity.value,
      stage: els.stage.value,
      jurisdiction: els.jurisdiction.value,
      marketCap: els.marketCap.value,
      sourceUrls: els.sourceUrls.value,
      sourceText: els.sourceText.value,
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
    els.sourceUrls.value = Array.isArray(input.sourceUrls) ? input.sourceUrls.join("\n") : input.sourceUrls || "";
    els.sourceText.value = input.sourceText || "";
    selectedFiles = input.files || [];
    renderFileList();
  }

  function generateReport(input) {
    const cleanedCompany = String(input.company || "").trim();
    const cleanedTicker = String(input.ticker || "").trim();

    if (!cleanedCompany && !cleanedTicker) {
      setError("Enter a company name or ticker.");
      return;
    }

    setError("");
    currentReport = engine.buildReport(input);
    renderReport(currentReport);
    renderAlerts(currentReport);
    enableReportActions(true);
    setStatus(`Generated ${currentReport.ticker} report with ${currentReport.confidence}% confidence.`);
  }

  function enableReportActions(enabled) {
    els.saveReport.disabled = !enabled;
    els.exportReport.disabled = !enabled;
    els.printReport.disabled = !enabled;
  }

  function renderReport(report) {
    els.reportTitle.textContent = report.company;

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

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateReport(readForm());
  });

  els.sourceFiles.addEventListener("change", handleFileSelection);
  els.saveReport.addEventListener("click", saveCurrentReport);
  els.exportReport.addEventListener("click", exportMarkdown);
  els.printReport.addEventListener("click", () => window.print());
  els.loadSample.addEventListener("click", () => {
    fillForm(sampleInput);
    generateReport(readForm());
  });
  els.watchlist.addEventListener("click", handleWatchlistClick);

  fillForm(sampleInput);
  renderWatchlist();
  renderAlerts(null);
  generateReport(readForm());
})();
