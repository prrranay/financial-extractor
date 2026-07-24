import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getEnv } from "./env";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const env = getEnv();
  aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return aiClient;
}

// ==========================================
// 1. Financial Data Extraction Definitions
// ==========================================

const FinancialTableSchema = z.array(z.record(z.string(), z.union([z.string(), z.number()])));

export const financialDataSchema = z.object({
  Company: z.string().default("N/A"),
  Sector: z.string().default("N/A"),
  Industry: z.string().default("N/A"),
  "Market Cap": z.string().default("N/A"),
  CMP: z.string().default("N/A"),
  "Target Price": z.string().default("N/A"),
  Recommendation: z.string().default("HOLD"),
  Revenue: z.string().default("N/A"),
  EBITDA: z.string().default("N/A"),
  PAT: z.string().default("N/A"),
  Margins: z.string().default("N/A"),
  EPS: z.string().default("N/A"),
  ROE: z.string().default("N/A"),
  ROCE: z.string().default("N/A"),
  Debt: z.string().default("N/A"),
  Cash: z.string().default("N/A"),
  Ratios: z.record(z.string(), z.string()).default({}),
  "Quarterly Financial Table": FinancialTableSchema.default([]),
  "Profit and Loss Table": FinancialTableSchema.default([]),
  "Balance Sheet Table": FinancialTableSchema.default([]),
  "Cashflow Table": FinancialTableSchema.default([]),
  "Ratios Table": FinancialTableSchema.default([]),
  "Change in Estimates Table": FinancialTableSchema.default([]),
  "Recommendation History Table": FinancialTableSchema.default([]),
  Shareholding: z.record(z.string(), z.string()).default({}),
  Guidance: z.string().default("N/A"),
  "Management Commentary": z.string().default("N/A"),
  "Raw Highlights": z.array(z.string()).default([]),
});

export type FinancialData = z.infer<typeof financialDataSchema>;

const geminiFinancialSchema = {
  type: "OBJECT",
  properties: {
    Company: { type: "STRING" },
    Sector: { type: "STRING" },
    Industry: { type: "STRING" },
    "Market Cap": { type: "STRING" },
    CMP: { type: "STRING" },
    "Target Price": { type: "STRING" },
    Recommendation: { type: "STRING" },
    Revenue: { type: "STRING" },
    EBITDA: { type: "STRING" },
    PAT: { type: "STRING" },
    Margins: { type: "STRING" },
    EPS: { type: "STRING" },
    ROE: { type: "STRING" },
    ROCE: { type: "STRING" },
    Debt: { type: "STRING" },
    Cash: { type: "STRING" },
    Ratios: {
      type: "OBJECT",
      additionalProperties: { type: "STRING" }
    },
    "Quarterly Financial Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Profit and Loss Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Balance Sheet Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Cashflow Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Ratios Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Change in Estimates Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Recommendation History Table": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    Shareholding: {
      type: "OBJECT",
      additionalProperties: { type: "STRING" }
    },
    Guidance: { type: "STRING" },
    "Management Commentary": { type: "STRING" },
    "Raw Highlights": {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: [
    "Company",
    "Sector",
    "Industry",
    "Market Cap",
    "CMP",
    "Target Price",
    "Recommendation",
    "Revenue",
    "EBITDA",
    "PAT",
    "Margins",
    "EPS",
    "ROE",
    "ROCE",
    "Debt",
    "Cash",
    "Ratios",
    "Quarterly Financial Table",
    "Profit and Loss Table",
    "Balance Sheet Table",
    "Cashflow Table",
    "Ratios Table",
    "Change in Estimates Table",
    "Recommendation History Table",
    "Shareholding",
    "Guidance",
    "Management Commentary",
    "Raw Highlights"
  ]
};

// ==========================================
// 2. Investment Analysis Definitions
// ==========================================

export const analysisDataSchema = z.object({
  "Company Overview": z.string().default("N/A"),
  "Investment Summary": z.string().default("N/A"),
  "Investment Thesis": z.string().default("N/A"),
  "Key Highlights": z.array(z.string()).default([]),
  "Growth Drivers": z.array(z.string()).default([]),
  "Risks": z.array(z.string()).default([]),
  "Strategic Updates": z.array(z.string()).default([]),
  "Outlook": z.string().default("N/A"),
  "Recommendation Reason": z.string().default("N/A"),
});

export type AnalysisData = z.infer<typeof analysisDataSchema>;

const geminiAnalysisSchema = {
  type: "OBJECT",
  properties: {
    "Company Overview": { type: "STRING" },
    "Investment Summary": { type: "STRING" },
    "Investment Thesis": { type: "STRING" },
    "Key Highlights": {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    "Growth Drivers": {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    "Risks": {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    "Strategic Updates": {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    "Outlook": { type: "STRING" },
    "Recommendation Reason": { type: "STRING" }
  },
  required: [
    "Company Overview",
    "Investment Summary",
    "Investment Thesis",
    "Key Highlights",
    "Growth Drivers",
    "Risks",
    "Strategic Updates",
    "Outlook",
    "Recommendation Reason"
  ]
};

// ==========================================
// 3. API Functions (Multi-Stage Pipeline)
// ==========================================

/**
 * Stage 1: Extracts factual financial data from raw text.
 * No subjective analysis or forecasts are generated in this prompt.
 */
export async function extractFinancialData(text: string): Promise<FinancialData> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text content provided for financial data extraction.");
  }

  const ai = getAiClient();
  const prompt = `
You are an expert financial data extraction system. Your job is to extract structured tables and metrics from the raw text of an equity research report.
Analyze the raw text and populate a structured JSON output conforming to the required schema.

Follow these strict table-specific extraction instructions:
1. "Quarterly Financial Table": Extract the quarterly performance parameters. Columns should represent quarters (e.g., "Metric", "Q1FY25", "Q4FY24", "Q1FY24", "YoY (%)", "QoQ (%)"). Metrics must include: Revenue/Sales, EBITDA, EBITDA Margin (%), EBIT, Interest, PBT, Tax, Reported PAT, Adjusted PAT.
2. "Profit and Loss Table": Extract the full income statement. Each row in the table should represent a financial metric, with columns representing years (e.g., "Metric", "FY23", "FY24", "FY25E", "FY26E", "FY27E"). Metrics must include: Sales/Revenue, EBITDA, Depreciation, EBIT, Interest, PBT, Tax, Reported PAT, Adjusted PAT, No. of Shares, Adjusted EPS, DPS.
3. "Balance Sheet Table": Extract all balance sheet parameters. Columns should represent years (e.g., "Metric", "FY23", "FY24", "FY25E", "FY26E", "FY27E"). Metrics must include: Cash, Accounts Receivable, Inventories, Other Current Assets, Investments, Net Fixed Assets, Total Assets, Current Liabilities, Debt Funds, Share Capital, Reserves & Surplus, Total Liabilities.
4. "Cashflow Table": Extract all cash flow metrics. Columns should represent years. Metrics must include: Net Income, Depreciation, Changes in Working Capital, Cash Flow from Operations, Capital Expenditure, Cash Flow from Investing, Debt Issued/Repaid, Dividends Paid, Cash Flow from Financing, Net Change in Cash.
5. "Ratios Table": Extract key valuation and financial ratios. Columns should represent years. Metrics must include: EBITDA Margin (%), EBIT Margin (%), Net Profit Margin (%), ROE (%), ROCE (%), Receivables (days), Inventory (days), Payables (days), Current Ratio (x), Debt/Equity (x), P/E (x), P/BV (x), EV/EBITDA (x).
6. "Change in Estimates Table": Extract revisions of projections. Columns should represent periods and revision parameters (e.g., "Metric", "Old FY25E", "New FY25E", "Change (%)", "Old FY26E", "New FY26E", "Change (%)"). Metrics: Revenue, EBITDA, EBITDA Margin (%), PAT, EPS.
7. "Recommendation History Table": Extract historical rating recommendations. Columns: "Date", "Rating", "Target Price", "CMP".

Do not invent, calculate, or hallucinate any numbers. Extract them exactly as they are presented in the document text.

Raw Extracted Text:
------------------
${text}
------------------
`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiFinancialSchema as unknown as Record<string, unknown>,
          temperature: 0.05, // Low temperature for highly factual extraction
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const jsonObject = JSON.parse(responseText.trim());
      
      // Use zod safeParse to fall back to default values instead of crashing on validation
      const result = financialDataSchema.safeParse(jsonObject);
      if (result.success) {
        return result.data;
      } else {
        console.warn("Factual Zod validation warning (retrying):", result.error.format());
        throw new Error("Factual Zod validation failed.");
      }

    } catch (error) {
      console.warn(`Attempt ${attempts} to extract financial data failed:`, error);
      if (attempts >= maxAttempts) {
        // Safe Zod fallback in case extraction fails entirely after max attempts
        return financialDataSchema.parse({});
      }
    }
  }

  return financialDataSchema.parse({});
}

/**
 * Stage 2: Generates professional investment analysis based on extracted factual JSON.
 * strictly holds calculations and financial facts from Stage 1 to prevent hallucinations.
 */
export async function generateAnalysis(financialData: FinancialData): Promise<AnalysisData> {
  if (!financialData || !financialData.Company) {
    throw new Error("Invalid financial data provided for investment analysis.");
  }

  const ai = getAiClient();
  const prompt = `
You are a senior equity research analyst. Generate a comprehensive investment analysis report based on the provided structured financial JSON.

STRICT CONSTRAINTS:
1. NEVER modify any financial numbers provided in the input.
2. NEVER invent, assume, or hallucinate metrics or statistics. If a value or metric is not present or is empty, refer only to the available facts.
3. Return ONLY a valid JSON object matching the requested schema. Do not write any paragraphs outside JSON or wrap in markdown blocks.

Structured Financial JSON:
------------------
${JSON.stringify(financialData, null, 2)}
------------------
`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiAnalysisSchema as unknown as Record<string, unknown>,
          temperature: 0.2, // Slightly higher temperature for synthesis while staying factual
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const jsonObject = JSON.parse(responseText.trim());
      const result = analysisDataSchema.safeParse(jsonObject);
      
      if (result.success) {
        return result.data;
      } else {
        console.warn("Analysis Zod validation warning (retrying):", result.error.format());
        throw new Error("Analysis Zod validation failed.");
      }

    } catch (error) {
      console.warn(`Attempt ${attempts} to generate investment analysis failed:`, error);
      if (attempts >= maxAttempts) {
        // Safe Zod fallback
        return analysisDataSchema.parse({});
      }
    }
  }

  return analysisDataSchema.parse({});
}
