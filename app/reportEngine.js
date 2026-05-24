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

  const VALUATION_METRICS = [
    {
      key: "pNav",
      label: "P/NAV",
      aliases: ["p/nav", "price/nav", "price to nav", "price to net asset value"],
      stageContext: "P/NAV is the main mining valuation shortcut. Developers often trade around 0.4x to 0.8x NAV, while early explorers can be much lower."
    },
    {
      key: "evPerOz",
      label: "EV/oz",
      aliases: ["ev/oz", "ev per oz", "enterprise value per ounce", "ev per ounce"],
      stageContext: "EV/oz helps compare what the market is assigning to each resource ounce across explorers, developers, and producers."
    },
    {
      key: "aisc",
      label: "AISC",
      aliases: ["aisc", "all-in sustaining cost", "all in sustaining cost"],
      stageContext: "AISC is most useful for producers because it compares operating cost and profitability rather than project value alone."
    },
    {
      key: "evEbitda",
      label: "EV/EBITDA",
      aliases: ["ev/ebitda", "enterprise value to ebitda"],
      stageContext: "EV/EBITDA is mainly useful for producing companies with operating earnings."
    },
    {
      key: "pCashFlow",
      label: "P/CF",
      aliases: ["p/cf", "price to cash flow", "price/cash flow"],
      stageContext: "P/CF is mainly useful for producers because it compares market price with operating cash generation."
    },
    {
      key: "tac",
      label: "TAC",
      aliases: ["tac", "total acquisition cost"],
      stageContext: "TAC is useful in M&A and project screening because it combines acquisition cost, build cost, and operating cost assumptions."
    },
    {
      key: "npvIrr",
      label: "NPV / IRR",
      aliases: ["npv", "irr", "npv/irr", "npv / irr"],
      stageContext: "NPV and IRR describe project-level economics from studies, and depend heavily on commodity-price and capex assumptions."
    },
    {
      key: "reserveLife",
      label: "Reserve life",
      aliases: ["reserve life", "mine life", "years of production"],
      stageContext: "Reserve life shows production longevity at current or planned rates and is most meaningful for producers and advanced developers."
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

  function matchValuationMetricKey(label) {
    const normalized = compact(label).toLowerCase();

    if (!normalized) {
      return "";
    }

    const metric = VALUATION_METRICS.find((item) => {
      return item.key.toLowerCase() === normalized || item.aliases.some((alias) => normalized.includes(alias));
    });

    return metric ? metric.key : "";
  }

  function normalizeValuationMetrics(metrics) {
    const normalized = {};

    if (!metrics) {
      return normalized;
    }

    if (typeof metrics === "object" && !Array.isArray(metrics)) {
      VALUATION_METRICS.forEach((metric) => {
        const value = compact(metrics[metric.key]);

        if (value) {
          normalized[metric.key] = value;
        }
      });
      return normalized;
    }

    compact(metrics)
      .split(/\r?\n/)
      .forEach((line) => {
        const parts = line.split(/\||:|=/).map(compact);
        const key = matchValuationMetricKey(parts[0]);
        const value = parts.slice(1).join(" ").trim();

        if (key && value) {
          normalized[key] = value;
        }
      });

    return normalized;
  }

  function parseDelimitedLine(line) {
    if (line.includes("|")) {
      return line.split("|").map(compact);
    }

    return line.split(",").map(compact);
  }

  function normalizePeerMetrics(peerMetrics) {
    if (!peerMetrics) {
      return [];
    }

    if (Array.isArray(peerMetrics)) {
      return peerMetrics
        .map((peer) => ({
          company: compact(peer.company || peer.name),
          ticker: compact(peer.ticker).toUpperCase(),
          stage: compact(peer.stage),
          metrics: normalizeValuationMetrics(peer)
        }))
        .filter((peer) => peer.company || Object.keys(peer.metrics).length);
    }

    const lines = compact(peerMetrics).split(/\r?\n/).map(compact).filter(Boolean);

    if (!lines.length) {
      return [];
    }

    const header = parseDelimitedLine(lines[0]);
    const dataLines = /company|ticker|p\/nav|ev\/oz|aisc|reserve/i.test(lines[0]) ? lines.slice(1) : lines;

    return dataLines
      .map((line) => {
        const values = parseDelimitedLine(line);
        const peer = {
          company: "",
          ticker: "",
          stage: "",
          metrics: {}
        };

        values.forEach((value, index) => {
          const headerLabel = header[index] || "";
          const lowerHeader = headerLabel.toLowerCase();
          const key = matchValuationMetricKey(headerLabel);

          if (/company|peer|name/.test(lowerHeader)) {
            peer.company = value;
          } else if (/ticker/.test(lowerHeader)) {
            peer.ticker = value.toUpperCase();
          } else if (/stage/.test(lowerHeader)) {
            peer.stage = value;
          } else if (key && value) {
            peer.metrics[key] = value;
          } else if (index === 0 && !peer.company) {
            peer.company = value;
          }
        });

        return peer;
      })
      .filter((peer) => peer.company || Object.keys(peer.metrics).length);
  }

  function normalizeInput(input) {
    const sourceUrls = splitLines(input.sourceUrls);
    const files = normalizeFiles(input.files);
    const expertSources = normalizeExpertSources(input.expertSources);
    const valuationMetrics = normalizeValuationMetrics(input.valuationMetrics);
    const peerMetrics = normalizePeerMetrics(input.peerMetrics);

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
      expertSources,
      valuationMetrics,
      peerMetrics
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
      input.expertSources.map((source) => `${source.name} ${source.sourceType} ${source.sourceUrl} ${source.commentary}`).join(" "),
      Object.values(input.valuationMetrics).join(" "),
      input.peerMetrics.map((peer) => `${peer.company} ${peer.ticker} ${peer.stage} ${Object.values(peer.metrics).join(" ")}`).join(" ")
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

  function parseMetricNumber(value) {
    const match = compact(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function median(values) {
    const numbers = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);

    if (!numbers.length) {
      return null;
    }

    const middle = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
  }

  function trimNumber(value, digits) {
    return Number(value.toFixed(digits)).toString();
  }

  function formatMetricNumber(key, value) {
    if (!Number.isFinite(value)) {
      return "";
    }

    if (key === "pNav" || key === "evEbitda" || key === "pCashFlow") {
      return `${trimNumber(value, 2)}x`;
    }
    if (key === "evPerOz" || key === "aisc") {
      return `$${trimNumber(value, 0)}/oz`;
    }
    if (key === "reserveLife") {
      return `${trimNumber(value, 1)} years`;
    }

    return trimNumber(value, 2);
  }

  function compareToMedian(target, peerMedian) {
    if (!Number.isFinite(target) || !Number.isFinite(peerMedian)) {
      return "Needs peer data";
    }

    const spread = peerMedian === 0 ? 0 : ((target - peerMedian) / peerMedian) * 100;

    if (Math.abs(spread) < 8) {
      return "Near peer median";
    }

    return spread > 0 ? "Above peer median" : "Below peer median";
  }

  function buildValuationComparison(input) {
    const targetMetrics = input.valuationMetrics;
    const peerRows = [
      {
        company: input.company,
        ticker: input.ticker,
        stage: input.stage,
        isTarget: true,
        metrics: targetMetrics
      },
      ...input.peerMetrics.map((peer) => ({
        ...peer,
        isTarget: false
      }))
    ];

    const metricCards = VALUATION_METRICS.map((metric) => {
      const targetValue = targetMetrics[metric.key] || "";
      const targetNumber = parseMetricNumber(targetValue);
      const peerNumbers = input.peerMetrics.map((peer) => parseMetricNumber(peer.metrics[metric.key])).filter((value) => value !== null);
      const peerMedianValue = median(peerNumbers);
      const hasMetric = targetValue || peerNumbers.length;

      if (!hasMetric) {
        return null;
      }

      return {
        key: metric.key,
        label: metric.label,
        value: targetValue || "Not supplied",
        peerMedian: peerMedianValue === null ? "Not supplied" : formatMetricNumber(metric.key, peerMedianValue),
        position: compareToMedian(targetNumber, peerMedianValue),
        stageContext: metric.stageContext
      };
    }).filter(Boolean);

    return {
      status: metricCards.length && input.peerMetrics.length
        ? "Peer comparison available"
        : metricCards.length
          ? "Target valuation metrics available"
          : "No valuation data supplied",
      summary: metricCards.length
        ? "Valuation metrics are shown as peer-comparison context, not as a standalone recommendation."
        : "Add P/NAV, EV/oz, AISC, EV/EBITDA, P/CF, TAC, NPV/IRR, reserve life, and peer rows to compare valuation context.",
      metricCards,
      peerRows
    };
  }

  function buildEvidence(input, text, confidence, hypeStatus, missingInformation, expertSignals, valuation) {
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

    valuation.metricCards.forEach((item) => {
      addEvidence(
        evidence,
        "Valuation input",
        `${item.label}: ${item.value}; peer median: ${item.peerMedian}`,
        `${item.label} is ${item.position.toLowerCase()} based on supplied peer median data.`,
        "valuation",
        confidence - 6
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
    const valuation = buildValuationComparison(input);
    const missingInformation = findMissingInformation(input, text);
    const scorecard = makeScorecard(input, text, confidence, hype.status);
    const redFlags = findRedFlags(text, hype.status, missingInformation);
    const catalysts = findCatalysts(text);
    const rating = makeRating(scorecard, confidence, redFlags, missingInformation);
    const evidence = buildEvidence(input, text, confidence, hype.status, missingInformation, expertSignals, valuation);
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
      valuation,
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
    const valuation = report.valuation || {
      status: "No valuation data supplied",
      summary: "Add target metrics and peer rows to compare valuation context.",
      metricCards: []
    };
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
      "## Valuation vs Peers",
      `Status: ${valuation.status}`,
      valuation.summary,
      ...(valuation.metricCards.length
        ? valuation.metricCards.map((item) => `- ${item.label}: ${item.value}; peer median ${item.peerMedian}; ${item.position}. ${item.stageContext}`)
        : ["- No valuation metrics supplied."]),
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
