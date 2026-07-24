import { FinancialData, AnalysisData } from "@/lib/gemini";

export interface ReportData extends FinancialData, AnalysisData {
  generatedAt: string;
}
