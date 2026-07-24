import { FinancialData, AnalysisData } from "@/lib/gemini";
import { ReportData } from "@/types";

/**
 * Merges structured financial data and generated investment analysis data
 * into a single unified ReportData object.
 *
 * @param financials - The extracted FinancialData object.
 * @param analysis - The generated AnalysisData object.
 * @returns The merged ReportData object.
 */
export function mapToReportData(
  financials: FinancialData,
  analysis: AnalysisData
): ReportData {
  return {
    ...financials,
    ...analysis,
    generatedAt: new Date().toISOString(),
  };
}
