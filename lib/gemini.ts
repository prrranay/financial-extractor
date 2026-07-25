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
  "Revenue Mix": FinancialTableSchema.default([]),
  "Revenue by Geography": FinancialTableSchema.default([]),
  "Segment Revenue": FinancialTableSchema.default([]),
  "Client Statistics": FinancialTableSchema.default([]),
  Shareholding: z.record(z.string(), z.string()).default({}),
  Guidance: z.string().default("N/A"),
  "Management Commentary": z.string().default("N/A"),
  "Raw Highlights": z.array(z.string()).default([]),
});

export type FinancialData = z.infer<typeof financialDataSchema>;

export const geminiFinancialSchema = {
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
    "Revenue Mix": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Revenue by Geography": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Segment Revenue": {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        additionalProperties: { type: "STRING" }
      }
    },
    "Client Statistics": {
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
    "Revenue Mix",
    "Revenue by Geography",
    "Segment Revenue",
    "Client Statistics",
    "Shareholding",
    "Guidance",
    "Management Commentary",
    "Raw Highlights"
  ]
};

// ==========================================
// 1.1 Exhaustive Extraction Definitions
// ==========================================

const ExtractedMetricSchema = z.object({
  label: z.string().default(""),
  value: z.string().default(""),
  unit: z.string().default(""),
  page: z.union([z.string(), z.number()]).default(""),
  context: z.string().default("")
});

export const exhaustiveFinancialSchema = z.object({
  extractedMetrics: z.array(ExtractedMetricSchema).default([])
});

export type ExhaustiveFinancialData = z.infer<typeof exhaustiveFinancialSchema>;

const geminiExhaustiveFinancialSchema = {
  type: "OBJECT",
  properties: {
    extractedMetrics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
          unit: { type: "STRING" },
          page: { type: "STRING" },
          context: { type: "STRING" }
        },
        required: ["label", "value", "unit", "page", "context"]
      }
    }
  },
  required: ["extractedMetrics"]
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

import { saveDebugData } from "./cache";

// ==========================================
// 3. API Functions (Multi-Stage Pipeline)
// ==========================================

/**
 * Stage 1: Extracts exhaustive financial data from raw text.
 * No subjective analysis or forecasts are generated in this prompt.
 */
export async function extractFinancialData(text: string, fileHash?: string): Promise<ExhaustiveFinancialData> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text content provided for financial data extraction.");
  }

  const ai = getAiClient();
  const prompt = `
You are a senior financial data extraction system. Your job is to extract EVERY numerical financial metric that appears in the raw text of the document.
Do NOT limit extraction only to predefined fields. Search the ENTIRE document: headings, tables, footnotes, charts, management commentary, financial highlights, appendix, notes.
Do not stop after finding the first occurrence. Capture all periods (e.g. Q2 FY26, H1 FY26, FY25).

Return JSON matching the schema.

For every extracted value, return:
{
  "label": "descriptive metric name including period e.g. Revenue Q2 FY26, Reported EBITDA, Installed Capacity",
  "value": "string representation of the number e.g. 5361, 13.5",
  "unit": "currency/unit e.g. Cr, Rs, %, x, MW",
  "page": "page number where it was found e.g. 18",
  "context": "verbatim text snippet around the number"
}

Rules:
1. Never ignore a number.
2. Never replace a value with null.
3. If uncertain, store the metric anyway.
4. Coverage is more important than categorization.

Do NOT summarize. Do NOT generate investment analysis. Do NOT generate recommendations. Only perform exhaustive extraction.

Raw Extracted Text:
------------------
${text}
------------------
`;

  let attempts = 0;
  const maxAttempts = 2;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiExhaustiveFinancialSchema as unknown as Record<string, unknown>,
          temperature: 0,
          topP: 0.1,
          topK: 1,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const jsonObject = JSON.parse(responseText.trim());
      
      if (!jsonObject.extractedMetrics || !Array.isArray(jsonObject.extractedMetrics) || jsonObject.extractedMetrics.length === 0) {
        throw new Error("Extracted metrics list is completely empty.");
      }

      const result = exhaustiveFinancialSchema.safeParse(jsonObject);
      if (result.success) {
        // Save raw, parsed, and validated JSON outputs for debugging
        if (fileHash) {
          saveDebugData(fileHash, "financial", responseText, jsonObject, result.data);
        }
        return result.data;
      } else {
        console.warn("Factual Zod validation warning (retrying):", result.error.format());
        throw new Error("Factual Zod validation failed.");
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempts} to extract financial data failed:`, lastError.message);
      if (attempts >= maxAttempts) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to extract financial data.");
}

/**
 * Stage 2: Generates professional investment analysis based on extracted factual JSON.
 * strictly holds calculations and financial facts from Stage 1 to prevent hallucinations.
 */
export async function generateAnalysis(financialData: FinancialData, fileHash?: string): Promise<AnalysisData> {
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
  let lastError: Error | null = null;

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
        if (fileHash) {
          saveDebugData(fileHash, "analysis", responseText, jsonObject, result.data);
        }
        return result.data;
      } else {
        console.warn("Analysis Zod validation warning (retrying):", result.error.format());
        throw new Error("Analysis Zod validation failed.");
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempts} to generate investment analysis failed:`, lastError.message);
      if (attempts >= maxAttempts) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to generate investment analysis.");
}
