import crypto from "crypto";
import fs from "fs";
import path from "path";
import { ReportData } from "../types";

// Absolute path to the cache directories
const CACHE_DIR = path.join(process.cwd(), "data", "cache");
const DEBUG_DIR = path.join(CACHE_DIR, "debug");

/**
 * Ensures that the cache and debug directories exist.
 */
function ensureDirectoriesExist() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
}

/**
 * Computes the SHA-256 hash of a file buffer.
 */
export function getFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Retrieves the cached ReportData if it exists.
 */
export function getCachedReport(hash: string): ReportData | null {
  ensureDirectoriesExist();
  const filePath = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as ReportData;
    } catch (e) {
      console.error(`Error reading cached report for hash ${hash}:`, e);
    }
  }
  
  return null;
}

/**
 * Saves a generated ReportData object to the cache.
 */
export function saveCachedReport(hash: string, data: ReportData) {
  ensureDirectoriesExist();
  const filePath = path.join(CACHE_DIR, `${hash}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error saving report to cache for hash ${hash}:`, e);
  }
}

/**
 * Saves detailed Gemini response, parsed JSON, and validated JSON to disk for debugging.
 */
export function saveDebugData(
  hash: string,
  prefix: string, // e.g., "financial" or "analysis"
  rawResponse: string,
  parsedJson: unknown,
  validatedJson: unknown
) {
  ensureDirectoriesExist();
  
  const rawPath = path.join(DEBUG_DIR, `${hash}_raw_${prefix}.txt`);
  const parsedPath = path.join(DEBUG_DIR, `${hash}_parsed_${prefix}.json`);
  const validatedPath = path.join(DEBUG_DIR, `${hash}_validated_${prefix}.json`);
  
  try {
    fs.writeFileSync(rawPath, rawResponse, "utf-8");
    fs.writeFileSync(parsedPath, JSON.stringify(parsedJson, null, 2), "utf-8");
    fs.writeFileSync(validatedPath, JSON.stringify(validatedJson, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing debug files for hash ${hash} (${prefix}):`, e);
  }
}
