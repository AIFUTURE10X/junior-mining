(function attachOreIQEngine(root) {
  "use strict";

  const DIRECT_ADVICE_PATTERN = /\b(strong buy|buy now|sell now|guaranteed upside|copy trades)\b/i;

  const KEYWORDS = {
    technical: ["ni 43-101", "technical report", "resource", "reserve", "pea", "feasibility", "prefeasibility"],
    drill: ["assay", "drill", "intercept", "grade", "metres", "meters", "mineralization"],
    metallurgy: ["metallurgy", "recovery", "processing", "flotation", "leach", "test work"],
    management: ["management", "insider", "track record", "board", "ceo", "ownership"],
    dilution: ["financing", "private placement", "warrant", "share issuance", "dilution", "convertible"],
    catalyst: ["assay", "resource update", "permit", "feasibility", "drill results", "production update", "metallurgy"],
    hype: ["sponsored", "paid promotion", "viral", "reddit", "stockhouse", "x/twitter", "promoter", "imminent discovery"],
    jurisdiction: ["permit", "permitting", "environmental", "community", "first nation", "jurisdiction", "licence", "license"],
    valuation: ["market cap", "ev/resource", "cash", "debt", "runway", "balance sheet"]
  };

  const MISSING_CHECKS = [
    {
      label: "Current technical report or resource statement",
      terms: KEYWORDS.technical
    },
    {
      label: "Metallurgy and recovery evidence",
      terms: KEYWORDS.metallurgy
    },
    {
      label: "Management ownership or track-record detail",
      terms: KEYWORDS.management
    },
    {
      label: "Share structure, cash, debt, and financing history",
      terms: KEYWORDS.dilution.concat(KEYWORDS.valuation)
    },
    {
      label: "Permitting, infrastructure, and jurisdiction context",
      terms: KEYWORDS.jurisdiction
    }
  ];

  function compact(value) {
    return String(value || "").trim();
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

  function normalizeFiles(files) {
    if (!files) {
      return [];
    }

    return Array.from(files)
      .map((file) => ({
        name: compact(file.name),
        type: compact(file.type),
        text: compact(file.text)
      }))
      .filter((file) => file.name || file.text);
  }

  function normalizeExpertSources(expertSources) {
    if (!expertSources) {
      return [];
    }

    if (Array.isArray(expertSources)) {
      return expertSources
        .map((source) => ({
          name: compact(source.name),
          sourceType: compact(source.sourceType || source.type),
          sourceUrl: compact(source.sourceUrl || source.url),
          commentary: compact(source.commentary || source.note || source.summary)
        }))
        .filter((source) => source.name || source.commentary || source.sourceUrl);
    }

    return compact(expertSources)
      .split(/\r?\n/)
      .map((line) => {
        const parts = line.split("|").map(compact);
        return {
          name: parts[0] || "Public source",
          sourceType: parts[1] || "Public commentary",
          sourceUrl: parts[2] || "",
          commentary: parts.slice(3).join(" | ") || parts[2] || ""
        };
      })
      .filter((source) => source.name || source.commentary || source.sourceUrl);
  }

  function normalizeInput(input) {
    const sourceUrls = splitLines(input.sourceUrls);
    const files = normalizeFiles(input.files);
    const expertSources = normalizeExpertSources(input.expertSources);

    return {
      company: compact(input.company) || "Selected Mining Company",
      ticker: compact(input.ticker).toUpperCase() || "TICKER",
      exchange: compact(input.exchange),
      commodity: compact(input.commodity) || "Mixed metals",
      stage: compact(input.stage) || "Stage not supplied",
      jurisdiction: compact(input.jurisdiction) || "Jurisdiction not supplied",
      marketCap: compact(input.marketCap),
      sourceUrls,
      sourceText: compact(input.sourceText),
      files,
      expertSources
    };
  }

  function textBundle(input) {
    return [
      input.company,
      input.ticker,
      input.exchange,
      input.commodity,
      input.stage,
      input.jurisdiction,
      input.marketCap,
      input.sourceUrls.join(" "),
      input.sourceText,
      input.files.map((file) => `${file.name} ${file.text}`).join(" "),
      input.expertSources.map((source) => `${source.name} ${source.sourceType} ${source.sourceUrl} ${source.commentary}`).join(" ")
    ].join(" ").toLowerCase();
  }

  function countHits(text, keywords) {
    return keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
  }

  function hasAny(text, keywords) {
    return countHits(text, keywords) > 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function score(value) {
    return Number(clamp(value, 1, 9.4).toFixed(1));
  }

  function confidenceLabel(value) {
    if (value >= 78) {
      return "High";
    }
    if (value >= 58) {
      return "Medium";
    }
    return "Low";
  }

  function scoreItem(scoreValue, confidence, rationale) {
    return {
      score: score(scoreValue),
      confidence: confidenceLabel(confidence),
      rationale
    };
  }

  function computeConfidence(input, text) {
    let confidence = 36;
    confidence += Math.min(input.sourceUrls.length, 3) * 6;
    confidence += Math.min(input.files.length, 3) * 4;
    confidence += input.sourceText.length > 220 ? 20 : input.sourceText.length > 40 ? 9 : 0;
    confidence += hasAny(text, KEYWORDS.technical) ? 8 : 0;
    confidence += hasAny(text, KEYWORDS.drill) ? 6 : 0;
    confidence += hasAny(text, KEYWORDS.metallurgy) ? 4 : 0;
    confidence += input.exchange ? 3 : 0;
    confidence += input.marketCap ? 3 : 0;

    if (!input.sourceUrls.length && !input.sourceText && !input.files.length) {
      confidence -= 10;
    }

    return Math.round(clamp(confidence, 22, 92));
  }

  function makeScorecard(input, text, confidence, hypeStatus) {
    const technicalHits = countHits(text, KEYWORDS.technical);
    const drillHits = countHits(text, KEYWORDS.drill);
    const metallurgyHits = countHits(text, KEYWORDS.metallurgy);
    const managementHits = countHits(text, KEYWORDS.management);
    const dilutionHits = countHits(text, KEYWORDS.dilution);
    const jurisdictionHits = countHits(text, KEYWORDS.jurisdiction);
    const catalystHits = countHits(text, KEYWORDS.catalyst);
    const valuationHits = countHits(text, KEYWORDS.valuation);

    const stageBoost = /resource|pea|feasibility|producer|development/i.test(input.stage) ? 0.8 : 0;
    const marketCapValue = Number(String(input.marketCap).replace(/[^\d.]/g, ""));
    const hasMarketCap = Number.isFinite(marketCapValue) && marketCapValue > 0;

    return {
      projectQuality: scoreItem(
        4.2 + technicalHits * 0.55 + drillHits * 0.42 + stageBoost,
        confidence,
        technicalHits || drillHits
          ? "Technical and drill-result cues support a deeper project review."
          : "Project quality is hard to judge without technical or drill-result sources."
      ),
      managementQuality: scoreItem(
        4.8 + managementHits * 0.75,
        confidence - 8,
        managementHits
          ? "Management or insider context is present in the source set."
          : "Management quality needs ownership and track-record evidence."
      ),
      shareStructure: scoreItem(
        6.8 - dilutionHits * 0.75 + (hasMarketCap ? 0.35 : 0),
        confidence - 4,
        dilutionHits
          ? "Financing or share-issuance language requires dilution review."
          : "No major dilution cue was detected in supplied sources."
      ),
      jurisdictionPermitting: scoreItem(
        5.2 + jurisdictionHits * 0.36,
        confidence - 6,
        jurisdictionHits
          ? "Permitting or jurisdiction context is available for review."
          : "Jurisdiction risk needs permitting and infrastructure evidence."
      ),
      metallurgyTechnical: scoreItem(
        4.4 + metallurgyHits * 0.86,
        confidence - 10,
        metallurgyHits
          ? "Metallurgy or recovery test-work cues are present."
          : "Metallurgy remains a key missing technical question."
      ),
      commodityExposure: scoreItem(
        5.6 + (/copper|uranium|gold|silver|lithium|rare earth/i.test(input.commodity) ? 1.1 : 0),
        confidence,
        `${input.commodity} exposure is explicit, but price sensitivity still needs market data.`
      ),
      catalystStrength: scoreItem(
        4.1 + catalystHits * 0.72,
        confidence,
        catalystHits
          ? "Upcoming or recent catalysts are visible in the source set."
          : "No strong catalyst cue was found in the supplied material."
      ),
      valuationSetup: scoreItem(
        4.8 + valuationHits * 0.46 + (hasMarketCap ? 0.65 : 0),
        confidence - 8,
        hasMarketCap
          ? "Market-cap input is present, but peer valuation still needs data."
          : "Valuation setup needs market cap, cash, debt, and peer context."
      ),
      sentimentHype: scoreItem(
        hypeStatus === "Elevated" ? 3.6 : hypeStatus === "Neutral" ? 6.5 : 5.2,
        confidence - 8,
        hypeStatus === "Elevated"
          ? "Promotional or viral language was detected."
          : "No severe promotional hype cue was detected."
      )
    };
  }

  function averageScore(scorecard) {
    const values = Object.values(scorecard).map((item) => item.score);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function makeRating(scorecard, confidence, redFlags, missingInformation) {
    const overall = averageScore(scorecard);

    if (confidence < 45 || missingInformation.length >= 5) {
      return "Insufficient evidence";
    }
    if (redFlags.length >= 3 || scorecard.sentimentHype.score < 4) {
      return "Avoid until key questions are answered";
    }
    if (overall >= 7.2 && confidence >= 72) {
      return "High-priority research candidate";
    }
    if (overall >= 5.8) {
      return "Watchlist candidate";
    }
    return "Speculative/high risk";
  }

  function extractSnippet(text, keywords) {
    const source = compact(text);
    if (!source) {
      return "";
    }

    const lower = source.toLowerCase();
    const keyword = keywords.find((term) => lower.includes(term.toLowerCase()));

    if (!keyword) {
      return source.slice(0, 140);
    }

    const index = Math.max(0, lower.indexOf(keyword.toLowerCase()) - 44);
    return source.slice(index, index + 180).replace(/\s+/g, " ").trim();
  }

  function addEvidence(evidence, source, cue, finding, type, confidence) {
    evidence.push({
      source,
      cue,
      finding,
      type,
      confidence: confidenceLabel(confidence)
    });
  }

  function buildEvidence(input, text, confidence, hypeStatus, missingInformation, expertSignals) {
    const evidence = [];

    input.sourceUrls.forEach((url) => {
      addEvidence(evidence, url, "Submitted URL", "Source URL included in the review set.", "fact", confidence);
    });

    input.files.forEach((file) => {
      const cue = file.type === "application/pdf" && !file.text
        ? "PDF queued; browser app records file metadata only"
        : "Uploaded source file";
      addEvidence(evidence, file.name, cue, "File included in the review set.", "fact", confidence);
    });

    if (hasAny(text, KEYWORDS.technical)) {
      addEvidence(
        evidence,
        "Source text",
        extractSnippet(input.sourceText, KEYWORDS.technical) || "Technical source cue",
        "Technical-report or resource language supports project-quality scoring.",
        "fact",
        confidence
      );
    }

    if (hasAny(text, KEYWORDS.drill)) {
      addEvidence(
        evidence,
        "Source text",
        extractSnippet(input.sourceText, KEYWORDS.drill) || "Drill or assay cue",
        "Drill-result language contributes to catalyst and project scoring.",
        "fact",
        confidence
      );
    }

    if (hypeStatus === "Elevated") {
      addEvidence(
        evidence,
        "Source text",
        extractSnippet(input.sourceText, KEYWORDS.hype) || "Promotional cue",
        "Promotional or viral language suggests hype risk may be elevated.",
        "inference",
        confidence - 10
      );
    }

    expertSignals.items.forEach((item) => {
      addEvidence(
        evidence,
        item.sourceUrl || item.name,
        `${item.name} / ${item.sourceType}`,
        item.finding,
        "expert",
        confidence - 8
      );
    });

    missingInformation.forEach((item) => {
      addEvidence(evidence, "Missing data", item, "Conclusion confidence is limited until this evidence is supplied.", "missing", 38);
    });

    return evidence;
  }

  function buildExpertSignals(input, text, confidence) {
    const items = input.expertSources.map((source) => {
      const commentary = source.commentary || "Public commentary source submitted for monitoring.";
      const technicalSupport = hasAny(text, KEYWORDS.technical.concat(KEYWORDS.drill, KEYWORDS.catalyst));
      const hypeCue = hasAny(commentary.toLowerCase(), KEYWORDS.hype);
      const finding = technicalSupport
        ? "Public commentary is logged as a research signal and should be compared against supplied technical and catalyst evidence."
        : "Public commentary is logged as a research signal, but source evidence is not strong enough to validate it yet.";

      return {
        name: source.name || "Public source",
        sourceType: source.sourceType || "Public commentary",
        sourceUrl: source.sourceUrl,
        commentary,
        finding,
        signal: hypeCue ? "Promotional-context review" : "Context signal",
        confidence: confidenceLabel(confidence - 8)
      };
    });

    return {
      status: items.length ? "Tracked public commentary" : "No expert signals submitted",
      summary: items.length
        ? `${items.length} public commentary ${items.length === 1 ? "source is" : "sources are"} tracked as context, not as a recommendation.`
        : "No public expert commentary was supplied for this report.",
      guardrail:
        "Tracked people are public sources only; they are not affiliated with OreIQ, are not endorsing this report, and their comments are not personalized investment recommendations.",
      items
    };
  }

  function findMissingInformation(input, text) {
    const missing = [];

    if (!input.sourceUrls.length && !input.sourceText && !input.files.length) {
      missing.push("No source URLs, source text, or files were supplied.");
    }

    MISSING_CHECKS.forEach((check) => {
      if (!hasAny(text, check.terms)) {
        missing.push(check.label);
      }
    });

    return missing;
  }

  function findRedFlags(text, hypeStatus, missingInformation) {
    const redFlags = [];

    if (hasAny(text, KEYWORDS.dilution)) {
      redFlags.push("Financing, warrants, share issuance, or dilution language needs capital-structure review.");
    }

    if (hypeStatus === "Elevated") {
      redFlags.push("Promotion or hype cues appear stronger than supplied technical evidence.");
    }

    if (/no new assay|no assay data|without assay/i.test(text)) {
      redFlags.push("Market attention may be unsupported by new assay data.");
    }

    if (missingInformation.length >= 4) {
      redFlags.push("Several core due-diligence inputs are missing.");
    }

    return redFlags;
  }

  function findCatalysts(text) {
    const catalysts = [];

    if (/assay|drill results/i.test(text)) {
      catalysts.push("Assay or drill-result follow-up");
    }
    if (/resource update|resource estimate/i.test(text)) {
      catalysts.push("Resource update");
    }
    if (/metallurgy|recovery|test work/i.test(text)) {
      catalysts.push("Metallurgy or recovery test work");
    }
    if (/permit|permitting|environmental/i.test(text)) {
      catalysts.push("Permitting update");
    }
    if (/production update|quarterly/i.test(text)) {
      catalysts.push("Production update");
    }

    return catalysts.length ? catalysts : ["No clear near-term catalyst found in supplied sources"];
  }

  function hypeAssessment(text, confidence) {
    const hypeHits = countHits(text, KEYWORDS.hype);
    const technicalHits = countHits(text, KEYWORDS.technical.concat(KEYWORDS.drill));

    if (hypeHits >= 2 && technicalHits < 3) {
      return {
        status: "Elevated",
        rationale: "Promotional or viral cues appear stronger than the supplied technical evidence.",
        confidence: confidenceLabel(confidence - 10)
      };
    }

    if (hypeHits > 0) {
      return {
        status: "Review",
        rationale: "Some promotional or social cues exist, but evidence is not clearly disconnected yet.",
        confidence: confidenceLabel(confidence - 8)
      };
    }

    return {
      status: "Neutral",
      rationale: "No strong promotional cue was detected in the supplied source set.",
      confidence: confidenceLabel(confidence - 6)
    };
  }

  function makeSummary(input, rating, confidence, scorecard, redFlags, missingInformation) {
    const overall = score(averageScore(scorecard));
    const riskLine = redFlags.length
      ? `${redFlags.length} red flag ${redFlags.length === 1 ? "area" : "areas"} need review before deeper work.`
      : "No red flag crossed the local MVP threshold in the supplied material.";
    const missingLine = missingInformation.length
      ? `${missingInformation.length} missing evidence ${missingInformation.length === 1 ? "item limits" : "items limit"} confidence.`
      : "The supplied source set covers the main first-pass review categories.";

    return [
      `${input.company} (${input.ticker}) is classified as ${rating.toLowerCase()} for further research support.`,
      `The local OreIQ scorecard averages ${overall}/10 with ${confidence}% report confidence.`,
      riskLine,
      missingLine
    ];
  }

  function buildReport(rawInput) {
    const input = normalizeInput(rawInput || {});
    const text = textBundle(input);
    const confidence = computeConfidence(input, text);
    const hype = hypeAssessment(text, confidence);
    const expertSignals = buildExpertSignals(input, text, confidence);
    const missingInformation = findMissingInformation(input, text);
    const scorecard = makeScorecard(input, text, confidence, hype.status);
    const redFlags = findRedFlags(text, hype.status, missingInformation);
    const catalysts = findCatalysts(text);
    const rating = makeRating(scorecard, confidence, redFlags, missingInformation);
    const evidence = buildEvidence(input, text, confidence, hype.status, missingInformation, expertSignals);
    const summary = makeSummary(input, rating, confidence, scorecard, redFlags, missingInformation);

    const report = {
      id: `${input.ticker}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      company: input.company,
      ticker: input.ticker,
      exchange: input.exchange,
      commodity: input.commodity,
      stage: input.stage,
      jurisdiction: input.jurisdiction,
      marketCap: input.marketCap,
      rating,
      confidence,
      summary,
      scorecard,
      redFlags,
      catalysts,
      missingInformation,
      hype,
      expertSignals,
      evidence,
      disclaimer:
        "OreIQ provides research support and source summaries only. It does not provide personalized investment advice, broker services, or guaranteed return claims."
    };

    const serialized = JSON.stringify(report);
    if (DIRECT_ADVICE_PATTERN.test(serialized)) {
      throw new Error("Report contains prohibited direct financial-advice language.");
    }

    return report;
  }

  function reportToMarkdown(report) {
    const scoreRows = Object.entries(report.scorecard)
      .map(([key, item]) => `| ${labelFromKey(key)} | ${item.score}/10 | ${item.confidence} | ${item.rationale} |`)
      .join("\n");
    const evidenceRows = report.evidence
      .map((item) => `| ${item.type} | ${item.source} | ${item.cue} | ${item.finding} | ${item.confidence} |`)
      .join("\n");

    return [
      `# OreIQ Report: ${report.company} (${report.ticker})`,
      "",
      `Generated: ${report.generatedAt}`,
      `Rating: ${report.rating}`,
      `Confidence: ${report.confidence}%`,
      "",
      "## Executive Summary",
      ...report.summary.map((line) => `- ${line}`),
      "",
      "## Scorecard",
      "| Category | Score | Confidence | Rationale |",
      "|---|---:|---|---|",
      scoreRows,
      "",
      "## Red Flags",
      ...(report.redFlags.length ? report.redFlags : ["No red flag crossed the local MVP threshold."]).map((line) => `- ${line}`),
      "",
      "## Catalysts",
      ...report.catalysts.map((line) => `- ${line}`),
      "",
      "## Missing Information",
      ...(report.missingInformation.length ? report.missingInformation : ["No major missing information item detected."]).map((line) => `- ${line}`),
      "",
      "## Expert Signals",
      `Status: ${report.expertSignals.status}`,
      report.expertSignals.summary,
      report.expertSignals.guardrail,
      ...(report.expertSignals.items.length
        ? report.expertSignals.items.map((item) => `- ${item.name} (${item.sourceType}): ${item.commentary} Source: ${item.sourceUrl || "not supplied"}`)
        : ["- No expert signal source supplied."]),
      "",
      "## Evidence",
      "| Type | Source | Cue | Finding | Confidence |",
      "|---|---|---|---|---|",
      evidenceRows,
      "",
      `> ${report.disclaimer}`
    ].join("\n");
  }

  function labelFromKey(key) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());
  }

  const api = {
    buildReport,
    reportToMarkdown,
    labelFromKey
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.OreIQEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
