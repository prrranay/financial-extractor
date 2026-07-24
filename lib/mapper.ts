import { FinancialData, AnalysisData } from "@/lib/gemini";
import { ReportData } from "@/types";

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
  if (typeof val === "object") {
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
 *
 * @param financials - The extracted FinancialData object.
 * @param analysis - The generated AnalysisData object.
 * @returns The merged and sanitized ReportData object.
 */
export function mapToReportData(
  financials: FinancialData,
  analysis: AnalysisData
): ReportData {
  const merged = {
    ...financials,
    ...analysis,
    generatedAt: new Date().toISOString(),
  };
  
  return replaceEmptyWithNA(merged);
}
