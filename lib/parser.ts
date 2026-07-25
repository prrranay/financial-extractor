import "./polyfills";

// Force Vercel Node File Trace to bundle the PDF worker script
if (false) {
  // @ts-expect-error - pdf.worker.mjs has no type declarations
  import("pdfjs-dist/legacy/build/pdf.worker.mjs");
}

import { PDFParse } from "pdf-parse";
import path from "path";

export interface ParseResult {
  text: string;
  type: "pdf" | "txt" | "csv";
  tables?: string[][][];
}

/**
 * Parses a CSV line respecting quoted commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Split on comma only outside quotes
      result.push(cleanCsvValue(current));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(cleanCsvValue(current));
  return result;
}

/**
 * Removes surrounding quotes and trims whitespace from a CSV value.
 */
function cleanCsvValue(val: string): string {
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  // Replace escaped quotes
  return cleaned.replace(/""/g, '"');
}

/**
 * Converts a CSV string into a formatted JSON array string.
 */
function csvToJson(csvText: string): string {
  const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return JSON.stringify([]);

  // Extract headers
  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const val = values[index];
      record[header] = val !== undefined ? val : "";
    });
    
    records.push(record);
  }

  return JSON.stringify(records, null, 2);
}

/**
 * Detects the file type based on the file name/extension and content header.
 */
function detectFileType(buffer: Buffer, fileName: string): "pdf" | "txt" | "csv" {
  // 1. Check Magic Bytes for PDF (%PDF)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "pdf";
  }

  // 2. Fall back to file extension detection
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") {
    return "pdf";
  }
  if (ext === ".csv") {
    return "csv";
  }
  
  // Default to txt for plain text formats
  return "txt";
}

/**
 * Automatically detects the file type from the name/content and extracts its text and tables.
 * - PDFs: Uses PDFParse class to extract plain text and native vector tables.
 * - TXT: Decodes the buffer directly as a UTF-8 string.
 * - CSV: Decodes as UTF-8 and converts the tabular rows into a structured JSON string.
 *
 * @param buffer - File contents as a Buffer.
 * @param fileName - Original name of the uploaded file.
 * @returns A promise resolving to the ParseResult containing the text, type, and optional raw tables.
 */
export async function parseFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const type = detectFileType(buffer, fileName);

  switch (type) {
    case "pdf": {
      const parser = new PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        let tables: string[][][] = [];
        try {
          const tableResult = await parser.getTable();
          if (tableResult && tableResult.mergedTables) {
            tables = tableResult.mergedTables;
          }
        } catch (e) {
          console.warn("Notice: Vector table parsing skipped or returned empty:", e);
        }

        return {
          text: textResult.text || "",
          type: "pdf",
          tables,
        };
      } finally {
        await parser.destroy();
      }
    }
    case "csv": {
      const csvText = buffer.toString("utf-8");
      const jsonText = csvToJson(csvText);
      return {
        text: jsonText,
        type: "csv",
      };
    }
    case "txt":
    default: {
      const txtContent = buffer.toString("utf-8");
      return {
        text: txtContent,
        type: "txt",
      };
    }
  }
}
