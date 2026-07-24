import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable. Please define it in your .env file."
    );
  }
  
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export interface FinancialData {
  companyName: string;
  period: string;
  currency: string;
  financialStatements: {
    incomeStatement?: Array<{ metric: string; value: number; note?: string }>;
    balanceSheet?: Array<{ metric: string; value: number; note?: string }>;
    cashFlow?: Array<{ metric: string; value: number; note?: string }>;
  };
  additionalMetrics?: Array<{ name: string; value: string; category?: string }>;
}

// Define strict JSON Schema for the response to enforce output structure
const financialSchema = {
  type: "OBJECT",
  properties: {
    companyName: { type: "STRING" },
    period: { type: "STRING" },
    currency: { type: "STRING" },
    financialStatements: {
      type: "OBJECT",
      properties: {
        incomeStatement: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              metric: { type: "STRING" },
              value: { type: "NUMBER" },
              note: { type: "STRING" }
            },
            required: ["metric", "value"]
          }
        },
        balanceSheet: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              metric: { type: "STRING" },
              value: { type: "NUMBER" },
              note: { type: "STRING" }
            },
            required: ["metric", "value"]
          }
        },
        cashFlow: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              metric: { type: "STRING" },
              value: { type: "NUMBER" },
              note: { type: "STRING" }
            },
            required: ["metric", "value"]
          }
        }
      }
    },
    additionalMetrics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          value: { type: "STRING" },
          category: { type: "STRING" }
        },
        required: ["name", "value"]
      }
    }
  },
  required: ["companyName", "period", "currency", "financialStatements"]
};

/**
 * Sends plain text to Gemini 2.5 Flash to extract structured financial data.
 * The model is configured to return strictly JSON conforming to the defined schema.
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
Do not write any commentary, paragraphs, or markdown code blocks (like \`\`\`json).
Return ONLY the raw JSON object conforming to the schema specified.

Raw Extracted Text:
------------------
${text}
------------------
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: financialSchema as unknown as Record<string, unknown>,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from Gemini API.");
    }

    // Parse and return the structured JSON
    const parsedData: FinancialData = JSON.parse(responseText.trim());
    return parsedData;
  } catch (error) {
    console.error("Error extracting financial data with Gemini:", error);
    throw new Error(
      error instanceof Error 
        ? `Gemini extraction failed: ${error.message}` 
        : "Gemini extraction failed with an unknown error."
    );
  }
}
