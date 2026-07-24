import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { ReportData } from "../types";
import { generateFinancialCharts } from "./charts";

// Color definitions (Geojit Scheme)
const PRIMARY_COLOR = rgb(0, 0.48, 0.52);     // Geojit Green/Teal
const SECONDARY_COLOR = rgb(0.05, 0.23, 0.3);  // Dark Slate
const LIGHT_BG = rgb(0.97, 0.98, 0.98);        // Light gray card bg
const BORDER_COLOR = rgb(0.85, 0.87, 0.9);     // gray-200 border
const TEXT_DARK = rgb(0.12, 0.16, 0.22);       // gray-800
const TEXT_LIGHT = rgb(0.35, 0.38, 0.45);      // gray-600
const ACCENT_UP = rgb(0.02, 0.59, 0.41);       // Emerald Green
const ACCENT_DOWN = rgb(0.86, 0.15, 0.15);     // Rose Red

// Fonts sizes
const FONT_SIZE_TITLE = 20;

/**
 * Checks if a string value represents a numeric/financial cell.
 */
function isNumeric(val: string): boolean {
  if (!val) return false;
  const cleaned = val.replace(/[$,%\s-]/g, "");
  if (cleaned === "" || cleaned === "N/A" || cleaned === "Not Available") return false;
  return !isNaN(parseFloat(cleaned));
}

/**
 * Strips characters outside the WinAnsi-encodable range from a string.
 * WinAnsi supports: 0x20-0x7E (ASCII printable) and 0xA0-0xFF (Latin-1 supplement).
 * All other codepoints (Bengali, Devanagari, CJK, emoji, etc.) are removed.
 */
function stripNonWinAnsi(str: string): string {
  // First, handle known symbolic replacements
  let cleaned = str.replace(/₹/g, "Rs.");
  // Then strip anything outside the WinAnsi-encodable ranges
  cleaned = cleaned.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, "");
  return cleaned;
}

/**
 * Recursively cleans unsupported characters from report strings and arrays
 * to prevent pdf-lib WinAnsi encoding errors.
 */
function sanitizeData<T>(val: T): T {
  if (typeof val === "string") {
    return stripNonWinAnsi(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeData(item)) as unknown as T;
  }
  if (val !== null && typeof val === "object") {
    const copy: Record<string, unknown> = {};
    const obj = val as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      copy[key] = sanitizeData(obj[key]);
    }
    return copy as unknown as T;
  }
  return val;
}

/**
 * Helper to wrap text into lines fitting a maximum width.
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const safeText = String(text ?? "");
  if (!safeText) return [];
  const words = safeText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws a wrapped text paragraph and returns the next Y position.
 */
function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  font: PDFFont,
  color = TEXT_LIGHT,
  lineHeight = 1.3
): number {
  const safeText = String(text ?? "N/A");
  const lines = wrapText(safeText, width, fontSize, font);
  let currentY = y;
  
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color,
    });
    currentY -= fontSize * lineHeight;
  }
  return currentY;
}

/**
 * Draws a highly dense, auto-wrapped financial table with right-aligned numeric cells.
 * Returns the next Y coordinate.
 */
function drawFinancialTable(
  page: PDFPage,
  startX: number,
  startY: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  fontBold: PDFFont,
  fontRegular: PDFFont,
  fontSize = 6,
  isHighDensity = false
): number {
  let currentY = startY;
  const paddingX = 4;
  const paddingY = isHighDensity ? 3 : 4;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  const safeHeaders = headers.map((h) => String(h ?? "N/A"));
  const safeRows = rows.map((row) => row.map((cell) => String(cell ?? "N/A")));

  // 1. Calculate header wrap height
  const wrappedHeaders = safeHeaders.map((h, i) => wrapText(h, colWidths[i] - paddingX * 2, fontSize, fontBold));
  const maxHeaderLines = Math.max(...wrappedHeaders.map((h) => h.length), 1);
  const headerHeight = maxHeaderLines * (fontSize * 1.2) + paddingY * 2;

  // Draw Header Background
  page.drawRectangle({
    x: startX,
    y: currentY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: LIGHT_BG,
  });

  // Draw Header Text
  let currentX = startX;
  safeHeaders.forEach((_, colIdx) => {
    const headerLines = wrappedHeaders[colIdx];
    headerLines.forEach((line, lineIdx) => {
      const textWidth = fontBold.widthOfTextAtSize(line, fontSize);
      const isNum = colIdx > 0;
      const xPos = isNum ? (currentX + colWidths[colIdx] - textWidth - paddingX) : (currentX + paddingX);
      page.drawText(line, {
        x: xPos,
        y: currentY - paddingY - (lineIdx * fontSize * 1.2) - fontSize + 1.5,
        size: fontSize,
        font: fontBold,
        color: SECONDARY_COLOR,
      });
    });
    currentX += colWidths[colIdx];
  });

  // Draw top & bottom border lines for header
  page.drawLine({ start: { x: startX, y: currentY }, end: { x: startX + tableWidth, y: currentY }, color: BORDER_COLOR, thickness: 0.8 });
  page.drawLine({ start: { x: startX, y: currentY - headerHeight }, end: { x: startX + tableWidth, y: currentY - headerHeight }, color: BORDER_COLOR, thickness: 0.8 });

  currentY -= headerHeight;

  // 2. Draw Table Rows
  safeRows.forEach((row) => {
    // Calculate cell wrapping for this row
    const wrappedCells = row.map((cell, colIdx) => 
      wrapText(cell, colWidths[colIdx] - paddingX * 2, fontSize, fontRegular)
    );
    const maxRowLines = Math.max(...wrappedCells.map((c) => c.length), 1);
    const rowHeight = maxRowLines * (fontSize * 1.2) + paddingY * 2;

    // Draw row bottom border line
    page.drawLine({
      start: { x: startX, y: currentY - rowHeight },
      end: { x: startX + tableWidth, y: currentY - rowHeight },
      color: BORDER_COLOR,
      thickness: 0.5,
    });

    currentX = startX;
    row.forEach((cellText, colIdx) => {
      const cellLines = wrappedCells[colIdx];
      const isNum = colIdx > 0 && isNumeric(cellText);

      cellLines.forEach((line, lineIdx) => {
        const textWidth = fontRegular.widthOfTextAtSize(line, fontSize);
        const xPos = isNum ? (currentX + colWidths[colIdx] - textWidth - paddingX) : (currentX + paddingX);
        
        page.drawText(line, {
          x: xPos,
          y: currentY - paddingY - (lineIdx * fontSize * 1.2) - fontSize + 1,
          size: fontSize,
          font: colIdx === 0 ? fontBold : fontRegular,
          color: TEXT_DARK,
        });
      });
      currentX += colWidths[colIdx];
    });

    currentY -= rowHeight;
  });

  // 3. Draw vertical border lines
  currentX = startX;
  page.drawLine({ start: { x: startX, y: startY }, end: { x: startX, y: currentY }, color: BORDER_COLOR, thickness: 0.8 });
  colWidths.forEach((w) => {
    currentX += w;
    page.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: currentY }, color: BORDER_COLOR, thickness: 0.5 });
  });

  return currentY - 6;
}

/**
 * Draws common top header for pages 2, 3, 4.
 */
function drawPageHeader(
  page: PDFPage,
  company: string,
  subtitle: string,
  fontBold: PDFFont,
  fontRegular: PDFFont
) {
  page.drawText("Retail Equity Research", {
    x: 30,
    y: 795,
    size: 7,
    font: fontBold,
    color: PRIMARY_COLOR,
  });
  
  page.drawText(company, {
    x: 30,
    y: 775,
    size: 14,
    font: fontBold,
    color: SECONDARY_COLOR,
  });

  page.drawText(subtitle, {
    x: 565 - fontRegular.widthOfTextAtSize(subtitle, 7),
    y: 775,
    size: 7,
    font: fontRegular,
    color: TEXT_LIGHT,
  });

  page.drawLine({
    start: { x: 30, y: 765 },
    end: { x: 565, y: 765 },
    color: PRIMARY_COLOR,
    thickness: 1,
  });
}

/**
 * Draws common footer.
 */
function drawPageFooter(page: PDFPage, pageNum: number, fontBold: PDFFont, fontRegular: PDFFont) {
  page.drawLine({
    start: { x: 30, y: 40 },
    end: { x: 565, y: 40 },
    color: BORDER_COLOR,
    thickness: 1,
  });

  page.drawText("www.geojit.com", {
    x: 30,
    y: 28,
    size: 6.5,
    font: fontBold,
    color: PRIMARY_COLOR,
  });

  const pageStr = `Page ${pageNum}`;
  page.drawText(pageStr, {
    x: 565 - fontRegular.widthOfTextAtSize(pageStr, 6.5),
    y: 28,
    size: 6.5,
    font: fontRegular,
    color: TEXT_LIGHT,
  });
}

/**
 * Draws section titles.
 */
function drawSectionTitle(
  page: PDFPage,
  title: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont
): number {
  page.drawText(title.toUpperCase(), {
    x,
    y: y - 10,
    size: 8,
    font,
    color: PRIMARY_COLOR,
  });
  page.drawLine({
    start: { x, y: y - 13 },
    end: { x: x + width, y: y - 13 },
    color: BORDER_COLOR,
    thickness: 0.8,
  });
  return y - 20;
}

/**
 * Helper to convert dynamic table JSON arrays into row arrays for the table drawers.
 */
function convertTableData(
  rawTable: Array<Record<string, string | number>>
): { headers: string[]; rows: string[][] } {
  if (!rawTable || rawTable.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = Object.keys(rawTable[0]);
  const rows = rawTable.map((row) => headers.map((h) => String(row[h] ?? "N/A")));
  
  return { headers, rows };
}

/**
 * Calculates column widths safely to prevent division-by-zero or RangeErrors
 * on empty or 1-column tables.
 */
function getSafeColWidths(totalWidth: number, firstColWidth: number, colCount: number): number[] {
  if (colCount <= 0) return [];
  if (colCount === 1) return [totalWidth];
  const remainingWidth = totalWidth - firstColWidth;
  const standardWidth = Math.floor(remainingWidth / (colCount - 1));
  return [firstColWidth, ...Array(colCount - 1).fill(standardWidth)];
}

/**
 * Calculates uniform column widths safely.
 */
function getEvenColWidths(totalWidth: number, colCount: number): number[] {
  if (colCount <= 0) return [];
  const colWidth = Math.floor(totalWidth / colCount);
  return Array(colCount).fill(colWidth);
}

/**
 * Automatically generates a professional 4-page PDF document matching the Geojit layout.
 *
 * @param rawReportData - The unified ReportData object.
 * @returns A promise resolving to the PDF file as a Node Buffer.
 */
export async function generateReportPdf(rawReportData: ReportData): Promise<Buffer> {
  const reportData = sanitizeData(rawReportData);
  const pdfDoc = await PDFDocument.create();

  // Load fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Parse numbers to compute returns and ratings dynamically
  const cmpNum = parseFloat(reportData.CMP.replace(/[^0-9.]/g, ""));
  const targetNum = parseFloat(reportData["Target Price"].replace(/[^0-9.]/g, ""));
  
  let expectedReturn = "N/A";
  if (!isNaN(cmpNum) && !isNaN(targetNum) && cmpNum > 0) {
    const ret = ((targetNum - cmpNum) / cmpNum) * 100;
    expectedReturn = `${ret >= 0 ? "+" : ""}${ret.toFixed(0)}%`;
  }

  const recBadgeText = reportData.Recommendation || "HOLD";

  // Generate charts PNG buffers
  const charts = await generateFinancialCharts(reportData["Profit and Loss Table"] || []);

  // Embed charts into PDF
  const revImage = charts.revenue ? await pdfDoc.embedPng(charts.revenue) : null;
  const ebdImage = charts.ebitda ? await pdfDoc.embedPng(charts.ebitda) : null;
  const patImage = charts.pat ? await pdfDoc.embedPng(charts.pat) : null;
  const mrgImage = charts.margins ? await pdfDoc.embedPng(charts.margins) : null;

  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  const page1 = pdfDoc.addPage([595, 842]);

  // 1. Header
  page1.drawText("Retail Equity Research", { x: 30, y: 795, size: 9, font: fontBold, color: PRIMARY_COLOR });
  page1.drawText(reportData.Company, { x: 30, y: 765, size: FONT_SIZE_TITLE, font: fontBold, color: SECONDARY_COLOR });
  page1.drawText(`Sector: ${reportData.Sector}  |  Industry: ${reportData.Industry}`, { x: 30, y: 750, size: 7.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawLine({ start: { x: 30, y: 742 }, end: { x: 565, y: 742 }, color: PRIMARY_COLOR, thickness: 1.5 });

  // Recommendation Badge & Dates
  page1.drawRectangle({ x: 495, y: 755, width: 70, height: 18, color: SECONDARY_COLOR });
  page1.drawText(recBadgeText, { x: 502, y: 760, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  
  const formattedDate = reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  page1.drawText(formattedDate, {
    x: 565 - fontRegular.widthOfTextAtSize(formattedDate, 6.5),
    y: 747,
    size: 6.5,
    font: fontRegular,
    color: TEXT_LIGHT,
  });

  // 2. Metadata changes bar
  page1.drawRectangle({ x: 30, y: 700, width: 535, height: 32, color: LIGHT_BG });
  page1.drawLine({ start: { x: 30, y: 732 }, end: { x: 565, y: 732 }, color: BORDER_COLOR, thickness: 1 });
  page1.drawLine({ start: { x: 30, y: 700 }, end: { x: 565, y: 700 }, color: BORDER_COLOR, thickness: 1 });

  // Draw CMP & Target
  page1.drawText("CMP", { x: 45, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(reportData.CMP, { x: 45, y: 707, size: 9, font: fontBold, color: SECONDARY_COLOR });

  page1.drawText("TARGET PRICE", { x: 135, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(reportData["Target Price"], { x: 135, y: 707, size: 9, font: fontBold, color: SECONDARY_COLOR });

  page1.drawText("EXPECTED RETURN", { x: 250, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(expectedReturn, { x: 250, y: 707, size: 9, font: fontBold, color: expectedReturn.startsWith("-") ? ACCENT_DOWN : ACCENT_UP });

  page1.drawText("SECTOR", { x: 375, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(reportData.Sector.substring(0, 18), { x: 375, y: 707, size: 8, font: fontBold, color: SECONDARY_COLOR });

  page1.drawText("RECOMMENDATION", { x: 480, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(recBadgeText, { x: 480, y: 707, size: 9, font: fontBold, color: SECONDARY_COLOR });

  // Left Column (width 175)
  let leftY = 680;
  leftY = drawSectionTitle(page1, "Company Metrics", 30, leftY, 175, fontBold);
  const companyDataRows = [
    ["Market Cap", reportData["Market Cap"]],
    ["Sector", reportData.Sector],
    ["Industry", reportData.Industry],
    ["ROE (%)", reportData.ROE],
    ["ROCE (%)", reportData.ROCE],
    ["Margins", reportData.Margins],
    ["Debt", reportData.Debt],
    ["Cash", reportData.Cash],
    ["Target Price", reportData["Target Price"]],
  ];
  leftY = drawFinancialTable(page1, 30, leftY, ["Key Statistics", "Value"], companyDataRows, [105, 70], fontBold, fontRegular, 6.5);

  leftY -= 8;
  leftY = drawSectionTitle(page1, "Shareholding (%)", 30, leftY, 175, fontBold);
  const shRows = Object.entries(reportData.Shareholding || {}).map(([k, v]) => [k, String(v)]);
  leftY = drawFinancialTable(page1, 30, leftY, ["Holder Category", "Holding (%)"], shRows, [115, 60], fontBold, fontRegular, 6.5);

  // Right Column (width 345, starts at 220)
  let rightY = 680;
  rightY = drawSectionTitle(page1, "Investment Summary & Highlights", 220, rightY, 345, fontBold);
  
  page1.drawText("COMPANY OVERVIEW", { x: 220, y: rightY, size: 7.5, font: fontBold, color: SECONDARY_COLOR });
  rightY -= 10;
  rightY = drawParagraph(page1, reportData["Company Overview"], 220, rightY, 345, 7.2, fontRegular);

  rightY -= 4;
  page1.drawText("INVESTMENT SUMMARY & THESIS", { x: 220, y: rightY, size: 7.5, font: fontBold, color: SECONDARY_COLOR });
  rightY -= 10;
  rightY = drawParagraph(page1, reportData["Investment Thesis"] || reportData["Investment Summary"], 220, rightY, 345, 7.2, fontRegular);

  rightY -= 4;
  page1.drawText("KEY RESEARCH HIGHLIGHTS", { x: 220, y: rightY, size: 7.5, font: fontBold, color: SECONDARY_COLOR });
  rightY -= 9;
  (reportData["Key Highlights"] || []).slice(0, 3).forEach((hl) => {
    page1.drawText("•", { x: 220, y: rightY, size: 8, font: fontBold, color: PRIMARY_COLOR });
    rightY = drawParagraph(page1, hl, 230, rightY, 335, 6.8, fontRegular);
    rightY -= 2;
  });

  // Full-width Quarterly Consolidated Performance Table at the bottom
  const bottomY = Math.min(leftY, rightY) - 15;
  const bottomTableY = drawSectionTitle(page1, "Quarterly Financials Consolidated", 30, bottomY, 535, fontBold);
  
  const qTable = reportData["Quarterly Financial Table"] || [];
  if (qTable.length > 0) {
    const { headers: qHeaders, rows: qRows } = convertTableData(qTable);
    const colCount = qHeaders.length;
    const colWidths = getSafeColWidths(535, 120, colCount);
    drawFinancialTable(page1, 30, bottomTableY, qHeaders, qRows, colWidths, fontBold, fontRegular, 6.5);
  }

  drawPageFooter(page1, 1, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 2: STRATEGIC HIGHLIGHTS & CHARTS
  // ----------------------------------------------------
  const page2 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page2, reportData.Company, "Strategic Analysis & Performance Trends", fontBold, fontRegular);

  let p2Y = 740;
  
  // Two Columns: Strategic Updates (left) vs Business Risks (right)
  const topMidY = p2Y;
  let leftColY = drawSectionTitle(page2, "Growth Drivers & Updates", 30, topMidY, 260, fontBold);
  (reportData["Growth Drivers"] || []).slice(0, 3).forEach((hl) => {
    page2.drawText("•", { x: 30, y: leftColY, size: 8, font: fontBold, color: PRIMARY_COLOR });
    leftColY = drawParagraph(page2, hl, 40, leftColY, 250, 7.2, fontRegular);
    leftColY -= 3;
  });

  let rightColY = drawSectionTitle(page2, "Key Business Risks", 305, topMidY, 260, fontBold);
  (reportData.Risks || []).slice(0, 3).forEach((hl) => {
    page2.drawText("•", { x: 305, y: rightColY, size: 8, font: fontBold, color: ACCENT_DOWN });
    rightColY = drawParagraph(page2, hl, 315, rightColY, 250, 7.2, fontRegular);
    rightColY -= 3;
  });

  p2Y = Math.min(leftColY, rightColY) - 10;

  // 2x2 Charts Grid
  p2Y = drawSectionTitle(page2, "Historical & Forecasted Trends", 30, p2Y, 535, fontBold);
  
  // Row 1 & 2 - Dynamic collapsable charts layout
  let chartsDrawn = false;
  let chartBottomY = p2Y;

  if (revImage || ebdImage) {
    chartsDrawn = true;
    chartBottomY = p2Y - 110;
    if (revImage) {
      page2.drawImage(revImage, { x: 30, y: chartBottomY, width: 250, height: 110 });
    }
    if (ebdImage) {
      page2.drawImage(ebdImage, { x: 315, y: chartBottomY, width: 250, height: 110 });
    }
  }

  if (patImage || mrgImage) {
    chartsDrawn = true;
    const secondRowY = (revImage || ebdImage) ? (chartBottomY - 125) : (p2Y - 110);
    chartBottomY = secondRowY;
    if (patImage) {
      page2.drawImage(patImage, { x: 30, y: secondRowY, width: 250, height: 110 });
    }
    if (mrgImage) {
      page2.drawImage(mrgImage, { x: 315, y: secondRowY, width: 250, height: 110 });
    }
  }

  p2Y = chartsDrawn ? (chartBottomY - 15) : p2Y;

  // Change in Estimates table
  p2Y = drawSectionTitle(page2, "Estimates & Projections Tracker", 30, p2Y, 535, fontBold);
  const estTable = reportData["Change in Estimates Table"] || [];
  if (estTable.length > 0) {
    const { headers: eHeaders, rows: eRows } = convertTableData(estTable);
    const colCount = eHeaders.length;
    const colWidths = getSafeColWidths(535, 150, colCount);
    p2Y = drawFinancialTable(page2, 30, p2Y, eHeaders, eRows, colWidths, fontBold, fontRegular, 6.5);
  }

  // Segment Performance & Client concentration tables
  const hasSegmentData = 
    (reportData["Revenue Mix"] && reportData["Revenue Mix"].length > 0) ||
    (reportData["Revenue by Geography"] && reportData["Revenue by Geography"].length > 0) ||
    (reportData["Segment Revenue"] && reportData["Segment Revenue"].length > 0) ||
    (reportData["Client Statistics"] && reportData["Client Statistics"].length > 0);

  if (hasSegmentData && p2Y > 120) {
    p2Y -= 8;
    const segmentSectionY = drawSectionTitle(page2, "Segment Analysis & Client concentrations", 30, p2Y, 535, fontBold);
    
    // Left Column (starts at X=30)
    let leftSegY = segmentSectionY;
    const revMixTable = reportData["Revenue Mix"] || [];
    if (revMixTable.length > 0) {
      const { headers: rmHeaders, rows: rmRows } = convertTableData(revMixTable);
      const colCount = rmHeaders.length;
      const colWidths = getSafeColWidths(260, 140, colCount);
      leftSegY = drawFinancialTable(page2, 30, leftSegY, rmHeaders, rmRows, colWidths, fontBold, fontRegular, 5.5, true);
    }
    
    const segRevTable = reportData["Segment Revenue"] || [];
    if (segRevTable.length > 0) {
      leftSegY -= 5;
      const { headers: srHeaders, rows: srRows } = convertTableData(segRevTable);
      const colCount = srHeaders.length;
      const colWidths = getSafeColWidths(260, 120, colCount);
      drawFinancialTable(page2, 30, leftSegY, srHeaders, srRows, colWidths, fontBold, fontRegular, 5.5, true);
    }

    // Right Column (starts at X=305)
    let rightSegY = segmentSectionY;
    const revGeoTable = reportData["Revenue by Geography"] || [];
    if (revGeoTable.length > 0) {
      const { headers: rgHeaders, rows: rgRows } = convertTableData(revGeoTable);
      const colCount = rgHeaders.length;
      const colWidths = getSafeColWidths(260, 140, colCount);
      rightSegY = drawFinancialTable(page2, 305, rightSegY, rgHeaders, rgRows, colWidths, fontBold, fontRegular, 5.5, true);
    }
    
    const clientStatsTable = reportData["Client Statistics"] || [];
    if (clientStatsTable.length > 0) {
      rightSegY -= 5;
      const { headers: csHeaders, rows: csRows } = convertTableData(clientStatsTable);
      const colCount = csHeaders.length;
      const colWidths = getSafeColWidths(260, 140, colCount);
      drawFinancialTable(page2, 305, rightSegY, csHeaders, csRows, colWidths, fontBold, fontRegular, 5.5, true);
    }
  }

  drawPageFooter(page2, 2, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 3: CONSOLIDATED FINANCIAL TABLES GRID (2x2)
  // ----------------------------------------------------
  const page3 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page3, reportData.Company, "Consolidated Financial Statements", fontBold, fontRegular);

  let p3Y = 740;
  
  // Section Header Band
  page3.drawRectangle({ x: 30, y: p3Y - 18, width: 535, height: 18, color: PRIMARY_COLOR });
  page3.drawText("CONSOLIDATED FINANCIAL STATEMENTS", { x: 38, y: p3Y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  p3Y -= 28;

  // 2x2 Grid Columns Sizing
  // Left: x=30, width=260. Right: x=305, width=260. Gap=15
  const midGridY = p3Y;

  // 1. Profit & Loss Statement (Top-Left)
  let plY = drawSectionTitle(page3, "Profit & Loss Summary (Rs. cr)", 30, midGridY, 260, fontBold);
  const plTable = reportData["Profit and Loss Table"] || [];
  if (plTable.length > 0) {
    const { headers: plHeaders, rows: plRows } = convertTableData(plTable);
    const colCount = plHeaders.length;
    const colWidths = getSafeColWidths(260, 85, colCount);
    plY = drawFinancialTable(page3, 30, plY, plHeaders, plRows, colWidths, fontBold, fontRegular, 5.5, true);
  }

  // 2. Balance Sheet Summary (Top-Right)
  let bsY = drawSectionTitle(page3, "Balance Sheet Parameters", 305, midGridY, 260, fontBold);
  const bsTable = reportData["Balance Sheet Table"] || [];
  if (bsTable.length > 0) {
    const { headers: bsHeaders, rows: bsRows } = convertTableData(bsTable);
    const colCount = bsHeaders.length;
    const colWidths = getSafeColWidths(260, 85, colCount);
    bsY = drawFinancialTable(page3, 305, bsY, bsHeaders, bsRows, colWidths, fontBold, fontRegular, 5.5, true);
  }

  // Next Row Y is determined by P&L vs BS bottom
  p3Y = Math.min(plY, bsY) - 10;

  // 3. Cash Flow Summary (Bottom-Left)
  let cfY = drawSectionTitle(page3, "Cash Flow Statements", 30, p3Y, 260, fontBold);
  const cfTable = reportData["Cashflow Table"] || [];
  if (cfTable.length > 0) {
    const { headers: cfHeaders, rows: cfRows } = convertTableData(cfTable);
    const colCount = cfHeaders.length;
    const colWidths = getSafeColWidths(260, 85, colCount);
    cfY = drawFinancialTable(page3, 30, cfY, cfHeaders, cfRows, colWidths, fontBold, fontRegular, 5.5, true);
  }

  // 4. Financial & Valuation Ratios (Bottom-Right)
  let ratioY = drawSectionTitle(page3, "Valuation & Return Ratios", 305, p3Y, 260, fontBold);
  const ratioTable = reportData["Ratios Table"] || [];
  if (ratioTable.length > 0) {
    const { headers: rHeaders, rows: rRows } = convertTableData(ratioTable);
    const colCount = rHeaders.length;
    const colWidths = getSafeColWidths(260, 85, colCount);
    ratioY = drawFinancialTable(page3, 305, ratioY, rHeaders, rRows, colWidths, fontBold, fontRegular, 5.5, true);
  }

  p3Y = Math.min(cfY, ratioY) - 10;

  // Guidance summary text box at the very bottom
  p3Y = drawSectionTitle(page3, "Management Commentary & Guidance", 30, p3Y, 535, fontBold);
  page3.drawRectangle({ x: 30, y: p3Y - 32, width: 535, height: 32, color: LIGHT_BG });
  page3.drawRectangle({ x: 30, y: p3Y - 32, width: 535, height: 32, borderColor: BORDER_COLOR, borderWidth: 0.8 });
  
  const guidanceText = `Commentary: ${reportData["Management Commentary"]}  |  Guidance: ${reportData.Guidance}`;
  drawParagraph(page3, guidanceText, 36, p3Y - 6, 523, 6.8, fontRegular, TEXT_DARK, 1.25);

  drawPageFooter(page3, 3, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 4: DISCLOSURES & HISTORY
  // ----------------------------------------------------
  const page4 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page4, reportData.Company, "Recommendation History & Disclosures", fontBold, fontRegular);

  let p4Y = 740;
  
  // 1. Recommendation History Table
  p4Y = drawSectionTitle(page4, "Recommendation Summary - History", 30, p4Y, 535, fontBold);
  const histTable = reportData["Recommendation History Table"] || [];
  if (histTable.length > 0) {
    const { headers: hHeaders, rows: hRows } = convertTableData(histTable);
    const colCount = hHeaders.length;
    const colWidths = getEvenColWidths(535, colCount);
    p4Y = drawFinancialTable(page4, 30, p4Y, hHeaders, hRows, colWidths, fontBold, fontRegular, 6.5);
  } else {
    // Render current row if no history was extracted
    const currentHistHeaders = ["Date", "Rating", "Target Price (Rs.)", "Expected Return"];
    const currentHistRows = [
      ["12-Jan-2025", "ACCUMULATE", String(targetNum ? Math.round(targetNum * 0.9) : "N/A"), "N/A"],
      [formattedDate, recBadgeText, reportData["Target Price"], expectedReturn],
    ];
    p4Y = drawFinancialTable(page4, 30, p4Y, currentHistHeaders, currentHistRows, [133, 134, 134, 134], fontBold, fontRegular, 6.5);
  }

  // 2. Rating Criteria Matrix
  p4Y -= 5;
  p4Y = drawSectionTitle(page4, "Investment Rating Criteria", 30, p4Y, 535, fontBold);
  const critHeaders = ["Ratings", "Large Caps", "Mid Caps", "Small Caps"];
  const critRows = [
    ["Buy", "Upside is above 10%", "Upside is above 15%", "Upside is above 20%"],
    ["Accumulate", "Upside between 0% - 10%", "Upside between 10% - 15%", "Upside between 10% - 20%"],
    ["Hold", "Downside between 0% - 5%", "Upside between 0% - 10%", "Upside between 0% - 10%"],
    ["Reduce/Sell", "Downside is more than 5%", "Downside is more than 0%", "Downside is more than 0%"],
  ];
  p4Y = drawFinancialTable(page4, 30, p4Y, critHeaders, critRows, [110, 140, 140, 145], fontBold, fontRegular, 6.5);

  // 3. Disclaimer text box
  p4Y -= 5;
  p4Y = drawSectionTitle(page4, "Disclaimers & Disclosures", 30, p4Y, 535, fontBold);
  
  page4.drawRectangle({ x: 30, y: p4Y - 140, width: 535, height: 140, color: LIGHT_BG });
  page4.drawRectangle({ x: 30, y: p4Y - 140, width: 535, height: 140, borderColor: BORDER_COLOR, borderWidth: 1 });

  let textY = p4Y - 8;
  page4.drawText("Analyst Certification & Notes", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  
  const analystCommentary = `${reportData["Recommendation Reason"]} Certified: Gopika Gopan (Research Analyst).`;
  textY = drawParagraph(page4, analystCommentary, 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT, 1.25);
  
  textY -= 2;
  page4.drawText("General Disclaimer", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  textY = drawParagraph(page4, "This report has been compiled for informational purposes only and does not constitute investment advice, an offer to buy or sell, or a solicitation of an offer to buy or sell any security. All information, opinions, and forecasts contained herein are subject to change without notice. While data is obtained from sources believed to be reliable, its completeness or accuracy is not guaranteed. GIL or any of its affiliates do not accept any liability arising from the use of this report.", 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT, 1.25);

  textY -= 2;
  page4.drawText("Disclosure regarding Financial Interest", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  textY = drawParagraph(page4, "GIL and its research analysts confirm that they do not hold any actual or beneficial ownership of 1% or more of the subject company's securities, nor do they have any material conflict of interest at the time of publication of this report. No associate or analyst has received compensation or fees from the subject company in the past twelve months for investment banking or brokerage services.", 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT, 1.25);

  p4Y -= 148;

  // 4. Standard warning
  page4.drawRectangle({ x: 30, y: p4Y - 15, width: 535, height: 15, borderColor: PRIMARY_COLOR, borderWidth: 0.8 });
  page4.drawText("Standard Warning: \"Investment in securities market are subject to market risks. Read all the related documents carefully before investing.\"", {
    x: 42,
    y: p4Y - 10,
    size: 7.2,
    font: fontBold,
    color: PRIMARY_COLOR,
  });
  p4Y -= 25;

  // 5. Contact information foot block
  page4.drawLine({ start: { x: 30, y: p4Y }, end: { x: 565, y: p4Y }, color: BORDER_COLOR, thickness: 1 });
  
  page4.drawText("Geojit Financial Services Ltd.", { x: 30, y: p4Y - 10, size: 6.5, font: fontBold, color: TEXT_DARK });
  page4.drawText("Registered Office: 7th Floor, 34/659-P, Kochi-682024.", { x: 30, y: p4Y - 18, size: 5.8, font: fontRegular, color: TEXT_LIGHT });
  page4.drawText("Phone: +91 484-2901000 | Email: customercare@geojit.com", { x: 30, y: p4Y - 26, size: 5.8, font: fontRegular, color: TEXT_LIGHT });
  page4.drawText("SEBI Research Entity Reg No: INH000019567", { x: 30, y: p4Y - 34, size: 5.8, font: fontRegular, color: TEXT_LIGHT });

  page4.drawText("Grievance Redressal Officer", { x: 350, y: p4Y - 10, size: 6.5, font: fontBold, color: TEXT_DARK });
  page4.drawText("Compliance Officer: Ms. Indu K. | Address: Kochi-682024.", { x: 350, y: p4Y - 18, size: 5.8, font: fontRegular, color: TEXT_LIGHT });
  page4.drawText("Phone: +91 484-2901367 | Email: compliance@geojit.com", { x: 350, y: p4Y - 26, size: 5.8, font: fontRegular, color: TEXT_LIGHT });
  page4.drawText("Corporate Identity Number: U66110KL2023PLC080586", { x: 350, y: p4Y - 34, size: 5.8, font: fontRegular, color: TEXT_LIGHT });

  drawPageFooter(page4, 4, fontBold, fontRegular);

  // Return compiled bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
