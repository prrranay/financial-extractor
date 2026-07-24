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
  Company: z.string(),
  Sector: z.string(),
  "Market Cap": z.string(),
  CMP: z.string(),
  "Target Price": z.string(),
  Revenue: z.string(),
  EBITDA: z.string(),
  PAT: z.string(),
  Margins: z.string(),
  EPS: z.string(),
  ROE: z.string(),
  Debt: z.string(),
  Cash: z.string(),
  Ratios: z.record(z.string(), z.string()),
  "Quarterly Financial Table": FinancialTableSchema,
  "Yearly Financial Table": FinancialTableSchema,
  Shareholding: z.record(z.string(), z.string()),
  "Key Events": z.array(z.string()),
  Guidance: z.string(),
  "Raw Highlights": z.array(z.string()),
});

export type FinancialData = z.infer<typeof financialDataSchema>;

const geminiFinancialSchema = {
  type: "OBJECT",
  properties: {
    Company: { type: "STRING" },
    Sector: { type: "STRING" },
    "Market Cap": { type: "STRING" },
    CMP: { type: "STRING" },
    "Target Price": { type: "STRING" },
    Revenue: { type: "STRING" },
    EBITDA: { type: "STRING" },
    PAT: { type: "STRING" },
    Margins: { type: "STRING" },
    EPS: { type: "STRING" },
    ROE: { type: "STRING" },
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
    "Yearly Financial Table": {
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
    "Key Events": {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    Guidance: { type: "STRING" },
    "Raw Highlights": {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: [
    "Company",
    "Sector",
    "Market Cap",
    "CMP",
    "Target Price",
    "Revenue",
    "EBITDA",
    "PAT",
    "Margins",
    "EPS",
    "ROE",
    "Debt",
    "Cash",
    "Ratios",
    "Quarterly Financial Table",
    "Yearly Financial Table",
    "Shareholding",
    "Key Events",
    "Guidance",
    "Raw Highlights"
  ]
};

// ==========================================
// 2. Investment Analysis Definitions
// ==========================================

export const analysisDataSchema = z.object({
  "Investment Summary": z.string(),
  "Investment Thesis": z.string(),
  "Key Highlights": z.array(z.string()),
  "Growth Drivers": z.array(z.string()),
  "Risks": z.array(z.string()),
  "Outlook": z.string(),
  "Recommendation Reason": z.string(),
});

export type AnalysisData = z.infer<typeof analysisDataSchema>;

const geminiAnalysisSchema = {
  type: "OBJECT",
  properties: {
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
    "Outlook": { type: "STRING" },
    "Recommendation Reason": { type: "STRING" }
  },
  required: [
    "Investment Summary",
    "Investment Thesis",
    "Key Highlights",
    "Growth Drivers",
    "Risks",
    "Outlook",
    "Recommendation Reason"
  ]
};

// ==========================================
// 3. API Functions
// ==========================================

/**
 * Sends plain text to Gemini 2.5 Flash to extract structured financial data.
 * The model is configured to return strictly JSON conforming to the defined schema.
 * Retries once if JSON parsing or Zod validation fails.
 * 
 * @param text - The raw extracted text from the document.
 * @returns A promise resolving to the structured FinancialData JSON object.
 */
export async function extractFinancialData(text: string): Promise<FinancialData> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text content provided for financial data extraction.");
  }

  const ai = getAiClient();
  const prompt = `
You are a financial analyst expert. Analyze the raw text extracted from a financial document below.
Extract all relevant structured financial data into a clean JSON output. 
Do not write any commentary, paragraphs, or markdown code blocks.
Return ONLY the raw JSON object conforming to the schema specified.

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
          temperature: 0.1, // Low temperature for factual extraction
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const jsonObject = JSON.parse(responseText.trim());
      const parsedData = financialDataSchema.parse(jsonObject);
      return parsedData;

    } catch (error) {
      console.warn(`Attempt ${attempts} to extract financial data failed:`, error);
      
      if (attempts >= maxAttempts) {
        throw new Error(
          error instanceof Error 
            ? `Gemini extraction failed after ${maxAttempts} attempts: ${error.message}` 
            : "Gemini extraction failed after maximum attempts."
        );
      }
      
      console.log("Retrying financial data extraction...");
    }
  }

  throw new Error("Gemini extraction failed.");
}

/**
 * Sends structured financial JSON to Gemini 2.5 Flash to generate an investment analysis report.
 * The model is configured to return strictly JSON conforming to the defined analysis schema.
 * Never invents metrics or modifies financial numbers.
 * Retries once if JSON parsing or Zod validation fails.
 * 
 * @param financialData - The structured FinancialData JSON object.
 * @returns A promise resolving to the structured AnalysisData JSON object.
 */
export async function generateAnalysis(financialData: FinancialData): Promise<AnalysisData> {
  if (!financialData || !financialData.Company) {
    throw new Error("Invalid financial data provided for investment analysis.");
  }

  const ai = getAiClient();
  
  // Prompt instructions enforcing the strict constraints
  const prompt = `
You are a senior investment analyst. Generate a comprehensive investment analysis report based on the provided structured financial JSON.

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
          temperature: 0.2, // Slightly higher temperature for professional analysis synthesis while staying factual
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const jsonObject = JSON.parse(responseText.trim());
      const parsedData = analysisDataSchema.parse(jsonObject);
      return parsedData;

    } catch (error) {
      console.warn(`Attempt ${attempts} to generate investment analysis failed:`, error);
      
      if (attempts >= maxAttempts) {
        throw new Error(
          error instanceof Error 
            ? `Gemini analysis generation failed after ${maxAttempts} attempts: ${error.message}` 
            : "Gemini analysis generation failed after maximum attempts."
        );
      }
      
      console.log("Retrying investment analysis generation...");
    }
  }

  throw new Error("Gemini analysis generation failed.");
}
