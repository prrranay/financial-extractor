import { FinancialData, ExhaustiveFinancialData, AnalysisData } from "@/lib/gemini";
import { ReportData } from "@/types";

interface ExtractedMetric {
  metric: string;
  period: string;
  value: string;
}

/**
 * Searches for a value across dynamic category records using keywords.
 */
function findValue(
  groups: Array<Record<string, { value: string; unit?: string }>>,
  keywords: string[]
): string {
  for (const group of groups) {
    if (!group) continue;
    for (const key of Object.keys(group)) {
      const matches = keywords.some((kw) => key.toLowerCase().includes(kw.toLowerCase()));
      if (matches) {
        const item = group[key];
        if (item && item.value && item.value !== "N/A" && item.value !== "") {
          const unitStr = item.unit ? ` ${item.unit}` : "";
          return `${item.value}${unitStr}`;
        }
      }
    }
  }
  return "N/A";
}

/**
 * Parses dynamic key-value pairs to extract period-specific metrics (Yearly or Quarterly).
 * Example: "Revenue (FY24)" -> metric: "Revenue", period: "FY24"
 */
function parsePeriodMetrics(group: Record<string, { value: string; unit?: string }>): ExtractedMetric[] {
  const list: ExtractedMetric[] = [];
  const yrRegex = /(FY\d{2}E?|FY\d{4}E?)/i;
  const qrRegex = /(Q\d\s?FY\d{2}E?|Q\d\s?FY\d{4}E?)/i;

  for (const key of Object.keys(group)) {
    const item = group[key];
    if (!item || !item.value || item.value === "N/A" || item.value === "") continue;

    // Check Quarter first (more specific)
    const qrMatch = key.match(qrRegex);
    if (qrMatch) {
      const period = qrMatch[1].toUpperCase().replace(/\s/g, "");
      const metric = key.replace(qrRegex, "").replace(/[()]/g, "").trim();
      list.push({ metric, period, value: `${item.value}${item.unit ? " " + item.unit : ""}` });
      continue;
    }

    // Check Year
    const yrMatch = key.match(yrRegex);
    if (yrMatch) {
      const period = yrMatch[1].toUpperCase();
      const metric = key.replace(yrRegex, "").replace(/[()]/g, "").trim();
      list.push({ metric, period, value: `${item.value}${item.unit ? " " + item.unit : ""}` });
      continue;
    }
  }
  return list;
}

/**
 * Groups period-based metrics into a tabular format.
 */
function reconstructTable(metrics: ExtractedMetric[]): Array<Record<string, string>> {
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
  group: Record<string, { value: string; unit?: string }>,
  keywords: string[],
  colLabel: string = "Segment"
): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  for (const key of Object.keys(group)) {
    const matches = keywords.some((kw) => key.toLowerCase().includes(kw.toLowerCase()));
    if (matches) {
      const item = group[key];
      const cleanedKey = key.replace(new RegExp(keywords.join("|"), "gi"), "").replace(/[()]/g, "").trim() || key;
      rows.push({
        [colLabel]: cleanedKey,
        "Share (%)": `${item.value}${item.unit ? " " + item.unit : ""}`,
      });
    }
  }
  return rows;
}

/**
 * Maps dynamic, exhaustive Stage 1 JSON into structured FinancialData matching the flat schema.
 */
export function mapExhaustiveToFinancialData(exhaustive: ExhaustiveFinancialData): FinancialData {
  // 1. Gather all yearly and quarterly metrics for table reconstruction
  const yearlyMetricsList = [
    ...parsePeriodMetrics(exhaustive.yearlyMetrics),
    ...parsePeriodMetrics(exhaustive.profitability),
    ...parsePeriodMetrics(exhaustive.revenueMetrics),
    ...parsePeriodMetrics(exhaustive.margins),
  ];

  const quarterlyMetricsList = [
    ...parsePeriodMetrics(exhaustive.quarterlyMetrics),
  ];

  const balanceSheetMetricsList = [
    ...parsePeriodMetrics(exhaustive.balanceSheet),
  ];

  const cashFlowMetricsList = [
    ...parsePeriodMetrics(exhaustive.cashFlow),
  ];

  // 2. Reconstruct table structures
  const quarterlyTable = reconstructTable(quarterlyMetricsList);
  const plTable = reconstructTable(yearlyMetricsList);
  const bsTable = reconstructTable(balanceSheetMetricsList);
  const cfTable = reconstructTable(cashFlowMetricsList);

  // 3. Extract Segment & operational parameters
  const revenueMix = buildSegmentTable(exhaustive.revenueMetrics, ["mix", "share", "product"], "Segment");
  const revGeo = buildSegmentTable(exhaustive.revenueMetrics, ["geography", "geographic", "region", "country"], "Region");
  const segmentRev = buildSegmentTable(exhaustive.yearlyMetrics, ["segment", "division"], "Segment");
  const clientStats = buildSegmentTable(exhaustive.otherMetrics.reduce((acc, curr) => {
    acc[curr.label] = { value: curr.value, unit: curr.unit };
    return acc;
  }, {} as Record<string, { value: string; unit?: string }>), ["client", "customer", "concentration"], "Metric");

  // Gather raw highlights list
  const rawHighlights: string[] = [];
  exhaustive.otherMetrics.forEach((m) => {
    if (m.label && m.value && m.value !== "N/A") {
      rawHighlights.push(`${m.label}: ${m.value}${m.unit ? " " + m.unit : ""}`);
    }
  });

  return {
    Company: findValue([exhaustive.companyInformation], ["company name", "company", "name"]),
    Sector: findValue([exhaustive.companyInformation], ["sector"]),
    Industry: findValue([exhaustive.companyInformation], ["industry"]),
    "Market Cap": findValue([exhaustive.valuation], ["market cap", "mcap", "m-cap"]),
    CMP: findValue([exhaustive.valuation], ["cmp", "current price", "current market price"]),
    "Target Price": findValue([exhaustive.valuation], ["target", "target price"]),
    Recommendation: findValue([exhaustive.valuation], ["recommendation", "rating", "recommendation rating"]) || "HOLD",
    Revenue: findValue([exhaustive.revenueMetrics, exhaustive.profitability], ["revenue", "sales"]),
    EBITDA: findValue([exhaustive.profitability], ["ebitda"]),
    PAT: findValue([exhaustive.profitability], ["pat", "net profit", "adjusted pat"]),
    Margins: findValue([exhaustive.margins], ["ebitda margin", "operating margin", "margin"]),
    EPS: findValue([exhaustive.profitability], ["eps", "earnings per share"]),
    ROE: findValue([exhaustive.profitability], ["roe", "return on equity"]),
    ROCE: findValue([exhaustive.profitability], ["roce", "return on capital employed"]),
    Debt: findValue([exhaustive.debtMetrics, exhaustive.balanceSheet], ["debt", "borrowings"]),
    Cash: findValue([exhaustive.balanceSheet], ["cash", "cash equivalents", "bank balances"]),
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
    Guidance: findValue([exhaustive.guidance], ["guidance", "target"]),
    "Management Commentary": findValue([exhaustive.managementCommentary], ["commentary", "highlights"]),
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
