import { FinancialData } from "./gemini";

type TableRecord = Array<Record<string, string>>;

/**
 * Converts a 2D string matrix (rows x columns) into a record array using the first row as column headers.
 */
function matrixToRecordArray(matrix: string[][]): TableRecord {
  if (!matrix || matrix.length < 2) return [];

  // Filter out completely blank rows
  const cleanMatrix = matrix.filter((row) => row.some((cell) => cell && cell.trim().length > 0));
  if (cleanMatrix.length < 2) return [];

  const rawHeaders = cleanMatrix[0];
  const headers = rawHeaders.map((h, i) => (h && h.trim().length > 0 ? h.trim() : i === 0 ? "Metric" : `Col_${i}`));

  const records: TableRecord = [];

  for (let r = 1; r < cleanMatrix.length; r++) {
    const row = cleanMatrix[r];
    const record: Record<string, string> = {};
    let hasValue = false;

    headers.forEach((header, c) => {
      const val = row[c] ? row[c].trim() : "";
      record[header] = val || "N/A";
      if (val && val !== "N/A") hasValue = true;
    });

    if (hasValue) {
      records.push(record);
    }
  }

  return records;
}

/**
 * Score table based on keyword occurrences.
 */
function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  keywords.forEach((kw) => {
    if (lower.includes(kw.toLowerCase())) {
      score += 1;
    }
  });
  return score;
}

/**
 * Classifies extracted raw vector tables into structured financial tables.
 * Returns a partial FinancialData object with categorized tables.
 */
export function classifyTables(rawTables: string[][][]): Partial<FinancialData> {
  const result: Partial<FinancialData> = {
    "Quarterly Financial Table": [],
    "Profit and Loss Table": [],
    "Balance Sheet Table": [],
    "Cashflow Table": [],
    "Ratios Table": [],
    "Change in Estimates Table": [],
    "Recommendation History Table": [],
    "Revenue Mix": [],
    "Revenue by Geography": [],
    "Segment Revenue": [],
    "Client Statistics": [],
  };

  if (!rawTables || rawTables.length === 0) {
    return result;
  }

  rawTables.forEach((matrix) => {
    if (!matrix || matrix.length < 2) return;

    const fullTableText = matrix.map((row) => row.join(" ")).join("\n");
    const records = matrixToRecordArray(matrix);
    if (records.length === 0) return;

    // Keyword signature scores
    const quarterlyScore = scoreKeywords(fullTableText, ["quarter", "q1", "q2", "q3", "q4", "qoq", "yoy", "q1fy", "q2fy", "q3fy", "q4fy"]);
    const plScore = scoreKeywords(fullTableText, ["revenue", "sales", "ebitda", "pat", "eps", "net profit", "pbt", "fy23", "fy24", "fy25e", "fy26e"]);
    const bsScore = scoreKeywords(fullTableText, ["assets", "liabilities", "equity", "share capital", "reserves", "borrowings", "debt"]);
    const cfScore = scoreKeywords(fullTableText, ["cash flow", "operating", "investing", "financing", "capex", "working capital"]);
    const ratioScore = scoreKeywords(fullTableText, ["roe", "roce", "margin", "p/e", "ev/ebitda", "debt/equity", "ratio"]);
    const estScore = scoreKeywords(fullTableText, ["estimate", "old", "new", "revision", "change %", "target price"]);
    const recScore = scoreKeywords(fullTableText, ["rating", "recommendation", "buy", "hold", "sell", "target price", "date"]);
    const revMixScore = scoreKeywords(fullTableText, ["revenue mix", "product mix", "vertical", "product breakdown"]);
    const revGeoScore = scoreKeywords(fullTableText, ["geography", "geographic", "india", "us", "europe", "rest of world", "international"]);
    const segScore = scoreKeywords(fullTableText, ["segment", "segment revenue", "business segment", "division"]);
    const clientScore = scoreKeywords(fullTableText, ["client", "customer", "top 5", "top 10", "concentration", "active users"]);

    // Assign to category with highest matching score
    const scores = [
      { key: "Quarterly Financial Table" as const, score: quarterlyScore },
      { key: "Profit and Loss Table" as const, score: plScore },
      { key: "Balance Sheet Table" as const, score: bsScore },
      { key: "Cashflow Table" as const, score: cfScore },
      { key: "Ratios Table" as const, score: ratioScore },
      { key: "Change in Estimates Table" as const, score: estScore },
      { key: "Recommendation History Table" as const, score: recScore },
      { key: "Revenue Mix" as const, score: revMixScore },
      { key: "Revenue by Geography" as const, score: revGeoScore },
      { key: "Segment Revenue" as const, score: segScore },
      { key: "Client Statistics" as const, score: clientScore },
    ];

    scores.sort((a, b) => b.score - a.score);
    const topMatch = scores[0];

    // Assign if score is at least 2 (confident match)
    if (topMatch.score >= 2 && (!result[topMatch.key] || result[topMatch.key]!.length === 0)) {
      result[topMatch.key] = records;
    }
  });

  return result;
}
