import { FinancialData, ExhaustiveFinancialData, AnalysisData } from "@/lib/gemini";
import { ReportData } from "@/types";

interface ParsedMetric {
  metric: string;
  period: string;
  value: string;
}

/**
 * Searches for a value across flat metrics using keywords.
 */
function findValue(
  metrics: Array<{ label: string; value: string; unit?: string }>,
  keywords: string[]
): string {
  for (const m of metrics) {
    if (!m || !m.label) continue;
    const labelLower = m.label.toLowerCase();
    const matches = keywords.some((kw) => labelLower.includes(kw.toLowerCase()));
    if (matches && m.value && m.value !== "N/A" && m.value !== "") {
      const unitStr = m.unit ? ` ${m.unit}` : "";
      return `${m.value}${unitStr}`;
    }
  }
  return "N/A";
}

/**
 * Parses flat metrics to extract period-specific metrics (Yearly or Quarterly).
 * Example: "Revenue Q2 FY26" -> metric: "Revenue", period: "Q2FY26"
 */
function parseFlatPeriodMetrics(
  metrics: Array<{ label: string; value: string; unit?: string }>
): ParsedMetric[] {
  const list: ParsedMetric[] = [];
  const yrRegex = /(FY\d{2}E?|FY\d{4}E?)/i;
  const qrRegex = /(Q\d\s?FY\d{2}E?|Q\d\s?FY\d{4}E?)/i;

  for (const m of metrics) {
    if (!m || !m.label || !m.value || m.value === "N/A" || m.value === "") continue;

    const label = m.label;
    const valStr = `${m.value}${m.unit ? " " + m.unit : ""}`;

    // Check Quarter first (more specific)
    const qrMatch = label.match(qrRegex);
    if (qrMatch) {
      const period = qrMatch[1].toUpperCase().replace(/\s/g, "");
      const metric = label.replace(qrRegex, "").replace(/[()]/g, "").trim();
      list.push({ metric, period, value: valStr });
      continue;
    }

    // Check Year
    const yrMatch = label.match(yrRegex);
    if (yrMatch) {
      const period = yrMatch[1].toUpperCase();
      const metric = label.replace(yrRegex, "").replace(/[()]/g, "").trim();
      list.push({ metric, period, value: valStr });
      continue;
    }
  }
  return list;
}

/**
 * Groups period-based metrics into a tabular format.
 */
function reconstructTable(metrics: ParsedMetric[]): Array<Record<string, string>> {
  if (metrics.length === 0) return [];

  const periods = Array.from(new Set(metrics.map((m) => m.period))).sort();
  const metricNames = Array.from(new Set(metrics.map((m) => m.metric)));

  const table: Array<Record<string, string>> = [];

  for (const name of metricNames) {
    const row: Record<string, string> = { Metric: name };
    periods.forEach((p) => {
      const found = metrics.find((m) => m.metric === name && m.period === p);
      row[p] = found ? found.value : "N/A";
    });
    table.push(row);
  }
  return table;
}

/**
 * Builds segment tables from dynamic group records matching keyword signatures.
 */
function buildSegmentTable(
  metrics: Array<{ label: string; value: string; unit?: string }>,
  keywords: string[],
  colLabel: string = "Segment"
): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  for (const m of metrics) {
    if (!m || !m.label) continue;
    const matches = keywords.some((kw) => m.label.toLowerCase().includes(kw.toLowerCase()));
    if (matches && m.value && m.value !== "N/A" && m.value !== "") {
      const cleanedLabel = m.label.replace(new RegExp(keywords.join("|"), "gi"), "").replace(/[()]/g, "").trim() || m.label;
      rows.push({
        [colLabel]: cleanedLabel,
        "Share (%)": `${m.value}${m.unit ? " " + m.unit : ""}`,
      });
    }
  }
  return rows;
}

/**
 * Maps dynamic, flat Stage 1 JSON into structured FinancialData matching the flat schema.
 */
export function mapExhaustiveToFinancialData(exhaustive: ExhaustiveFinancialData): FinancialData {
  const metrics = exhaustive.extractedMetrics || [];

  // 1. Gather all yearly and quarterly metrics for table reconstruction
  const flatPeriodMetrics = parseFlatPeriodMetrics(metrics);

  const quarterlyMetrics = flatPeriodMetrics.filter((m) => /Q\d/i.test(m.period));
  const yearlyMetrics = flatPeriodMetrics.filter((m) => /FY\d/i.test(m.period));

  // Categorize yearly metrics based on balance sheet or cash flow keywords
  const bsKeywords = ["asset", "liability", "equity", "debt", "borrowing", "reserve", "capital"];
  const cfKeywords = ["cash flow", "capex", "operating cash", "investing", "financing", "working capital"];

  const balanceSheetMetrics = yearlyMetrics.filter((m) =>
    bsKeywords.some((kw) => m.metric.toLowerCase().includes(kw))
  );
  const cashFlowMetrics = yearlyMetrics.filter((m) =>
    cfKeywords.some((kw) => m.metric.toLowerCase().includes(kw))
  );
  
  // Standard Profit and Loss list (everything that is not Balance Sheet or Cashflow)
  const plMetrics = yearlyMetrics.filter(
    (m) =>
      !bsKeywords.some((kw) => m.metric.toLowerCase().includes(kw)) &&
      !cfKeywords.some((kw) => m.metric.toLowerCase().includes(kw))
  );

  // 2. Reconstruct table structures
  const quarterlyTable = reconstructTable(quarterlyMetrics);
  const plTable = reconstructTable(plMetrics);
  const bsTable = reconstructTable(balanceSheetMetrics);
  const cfTable = reconstructTable(cashFlowMetrics);

  // 3. Extract Segment splits
  const revenueMix = buildSegmentTable(metrics, ["mix", "share", "product mix", "vertical"], "Segment");
  const revGeo = buildSegmentTable(metrics, ["geography", "geographic", "region", "country"], "Region");
  const segmentRev = buildSegmentTable(metrics, ["segment revenue", "segment contribution", "division"], "Segment");
  const clientStats = buildSegmentTable(metrics, ["client", "customer", "concentration"], "Metric");

  // Gather raw highlights list
  const rawHighlights: string[] = [];
  metrics.forEach((m) => {
    if (m.label && m.value && m.value !== "N/A" && m.value !== "") {
      rawHighlights.push(`${m.label}: ${m.value}${m.unit ? " " + m.unit : ""}`);
    }
  });

  return {
    Company: findValue(metrics, ["company name", "company", "name"]),
    Sector: findValue(metrics, ["sector"]),
    Industry: findValue(metrics, ["industry"]),
    "Market Cap": findValue(metrics, ["market cap", "mcap", "m-cap"]),
    CMP: findValue(metrics, ["cmp", "current price", "current market price"]),
    "Target Price": findValue(metrics, ["target", "target price"]),
    Recommendation: findValue(metrics, ["recommendation", "rating", "recommendation rating"]) || "HOLD",
    Revenue: findValue(metrics, ["revenue", "sales"]),
    EBITDA: findValue(metrics, ["ebitda"]),
    PAT: findValue(metrics, ["pat", "net profit", "adjusted pat"]),
    Margins: findValue(metrics, ["ebitda margin", "operating margin", "margin"]),
    EPS: findValue(metrics, ["eps", "earnings per share"]),
    ROE: findValue(metrics, ["roe", "return on equity"]),
    ROCE: findValue(metrics, ["roce", "return on capital employed"]),
    Debt: findValue(metrics, ["debt", "borrowings"]),
    Cash: findValue(metrics, ["cash", "cash equivalents", "bank balances"]),
    Ratios: {},
    "Quarterly Financial Table": quarterlyTable,
    "Profit and Loss Table": plTable,
    "Balance Sheet Table": bsTable,
    "Cashflow Table": cfTable,
    "Ratios Table": [],
    "Change in Estimates Table": [],
    "Recommendation History Table": [],
    "Revenue Mix": revenueMix,
    "Revenue by Geography": revGeo,
    "Segment Revenue": segmentRev,
    "Client Statistics": clientStats,
    Shareholding: {},
    Guidance: findValue(metrics, ["guidance", "target"]),
    "Management Commentary": findValue(metrics, ["commentary", "highlights"]),
    "Raw Highlights": rawHighlights,
  };
}

/**
 * Recursively scans and cleans values, replacing any nulls, undefineds,
 * empty strings, or string literals of "undefined"/"null" with "N/A".
 */
function replaceEmptyWithNA<T>(val: T): T {
  if (val === undefined || val === null) {
    return "N/A" as unknown as T;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" || trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null"
      ? ("N/A" as unknown as T)
      : (trimmed as unknown as T);
  }
  if (Array.isArray(val)) {
    return val.map((item) => replaceEmptyWithNA(item)) as unknown as T;
  }
  if (val !== null && typeof val === "object") {
    const copy: Record<string, unknown> = {};
    const obj = val as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      copy[key] = replaceEmptyWithNA(obj[key]);
    }
    return copy as unknown as T;
  }
  return val;
}

/**
 * Merges structured financial data and generated investment analysis data
 * into a single unified ReportData object, removing any undefined or empty values.
 */
export function mapToReportData(financials: FinancialData, analysis: AnalysisData): ReportData {
  const merged = {
    ...financials,
    ...analysis,
    generatedAt: new Date().toISOString(),
  };

  return replaceEmptyWithNA(merged);
}
