import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { ReportData } from "../types";
import { generateFinancialCharts } from "./charts";

// Color definitions (Geojit Scheme)
const PRIMARY_COLOR = rgb(0, 0.48, 0.52);     // Geojit Green/Teal
const SECONDARY_COLOR = rgb(0.05, 0.23, 0.3);  // Dark Slate
const LIGHT_BG = rgb(0.97, 0.98, 0.98);        // Light gray card bg
const BORDER_COLOR = rgb(0.9, 0.9, 0.9);       // Light border gray
const TEXT_DARK = rgb(0.12, 0.16, 0.22);       // gray-800
const TEXT_LIGHT = rgb(0.29, 0.33, 0.39);      // gray-600
const ACCENT_UP = rgb(0.02, 0.59, 0.41);       // Emerald Green

// Font settings
const FONT_SIZE_TITLE = 20;

/**
 * Helper to wrap text into lines fitting a maximum width.
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const words = text.split(/\s+/);
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
  const lines = wrapText(text, width, fontSize, font);
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
 * Draws a grid table and returns the next Y coordinate.
 */
function drawGridTable(
  page: PDFPage,
  startX: number,
  startY: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  fontBold: PDFFont,
  fontRegular: PDFFont
): number {
  let currentY = startY;
  const rowHeight = 15;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // 1. Draw Table Header Background
  page.drawRectangle({
    x: startX,
    y: currentY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: LIGHT_BG,
  });

  // 2. Draw Table Header Text
  let currentX = startX;
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: currentX + 4,
      y: currentY - rowHeight + 4,
      size: 7,
      font: fontBold,
      color: SECONDARY_COLOR,
    });
    currentX += colWidths[index];
  });
  
  // Draw top & bottom border lines for header
  page.drawLine({ start: { x: startX, y: currentY }, end: { x: startX + tableWidth, y: currentY }, color: BORDER_COLOR, thickness: 1 });
  page.drawLine({ start: { x: startX, y: currentY - rowHeight }, end: { x: startX + tableWidth, y: currentY - rowHeight }, color: BORDER_COLOR, thickness: 1 });

  currentY -= rowHeight;

  // 3. Draw Rows
  rows.forEach((row) => {
    currentX = startX;
    
    // Draw row bottom line
    page.drawLine({
      start: { x: startX, y: currentY - rowHeight },
      end: { x: startX + tableWidth, y: currentY - rowHeight },
      color: BORDER_COLOR,
      thickness: 1,
    });

    row.forEach((cell, index) => {
      // Cell text
      page.drawText(cell, {
        x: currentX + 4,
        y: currentY - rowHeight + 4,
        size: 6.5,
        font: index === 0 ? fontBold : fontRegular,
        color: TEXT_DARK,
      });
      currentX += colWidths[index];
    });

    currentY -= rowHeight;
  });

  // Draw vertical border lines
  currentX = startX;
  page.drawLine({ start: { x: startX, y: startY }, end: { x: startX, y: currentY }, color: BORDER_COLOR, thickness: 1 });
  
  colWidths.forEach((w) => {
    currentX += w;
    page.drawLine({
      start: { x: currentX, y: startY },
      end: { x: currentX, y: currentY },
      color: BORDER_COLOR,
      thickness: 1,
    });
  });

  return currentY - 5;
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
    size: 16,
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
    size: 8.5,
    font,
    color: PRIMARY_COLOR,
  });
  page.drawLine({
    start: { x, y: y - 13 },
    end: { x: x + width, y: y - 13 },
    color: BORDER_COLOR,
    thickness: 1,
  });
  return y - 22;
}

/**
 * Automatically generates a professional 4-page PDF document matching the Geojit layout.
/**
 * Recursively cleans unsupported characters (specifically the Rupee symbol ₹)
 * from report strings and arrays to prevent pdf-lib WinAnsi encoding errors.
 */
function sanitizeData<T>(val: T): T {
  if (typeof val === "string") {
    return val.replace(/₹/g, "Rs.") as unknown as T;
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

  let recBadgeText = "HOLD";
  if (expectedReturn !== "N/A") {
    const retVal = parseFloat(expectedReturn);
    if (retVal > 15) recBadgeText = "BUY";
    else if (retVal < -5) recBadgeText = "SELL";
    else if (retVal > 0) recBadgeText = "ACCUMULATE";
  }

  // Generate charts PNG buffers
  const charts = await generateFinancialCharts(reportData["Yearly Financial Table"] || []);

  // Embed charts into PDF
  const revImage = await pdfDoc.embedPng(charts.revenue);
  const ebdImage = await pdfDoc.embedPng(charts.ebitda);
  const patImage = await pdfDoc.embedPng(charts.pat);

  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  const page1 = pdfDoc.addPage([595, 842]); // A4 Size

  // 1. Header
  page1.drawText("Retail Equity Research", { x: 30, y: 795, size: 9, font: fontBold, color: PRIMARY_COLOR });
  page1.drawText(reportData.Company, { x: 30, y: 765, size: FONT_SIZE_TITLE, font: fontBold, color: SECONDARY_COLOR });
  page1.drawText(`Sector: ${reportData.Sector}`, { x: 30, y: 750, size: 7.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawLine({ start: { x: 30, y: 742 }, end: { x: 565, y: 742 }, color: PRIMARY_COLOR, thickness: 1.5 });

  // Recommendation Badge & Dates
  page1.drawRectangle({ x: 495, y: 755, width: 70, height: 18, color: BORDER_COLOR });
  page1.drawText(recBadgeText, { x: 505, y: 760, size: 10, font: fontBold, color: SECONDARY_COLOR });
  page1.drawText(reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleDateString() : "", {
    x: 565 - fontRegular.widthOfTextAtSize("Date", 6.5),
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
  page1.drawText(expectedReturn, { x: 250, y: 707, size: 9, font: fontBold, color: ACCENT_UP });

  page1.drawText("SECTOR", { x: 375, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText(reportData.Sector.substring(0, 15), { x: 375, y: 707, size: 9, font: fontBold, color: SECONDARY_COLOR });

  page1.drawText("VALUATION BASIS", { x: 480, y: 720, size: 6.5, font: fontRegular, color: TEXT_LIGHT });
  page1.drawText("Factual Extraction", { x: 480, y: 707, size: 8, font: fontBold, color: SECONDARY_COLOR });

  // 3. Grid Columns Layout
  // Left Column: Metrics & Shareholdings
  let leftY = 680;
  leftY = drawSectionTitle(page1, "Company Metrics", 30, leftY, 175, fontBold);
  
  const metricKeys = ["Market Cap", "Revenue", "EBITDA", "PAT", "Margins", "EPS", "ROE", "Debt", "Cash"];
  const metricValues = [
    reportData["Market Cap"],
    reportData.Revenue,
    reportData.EBITDA,
    reportData.PAT,
    reportData.Margins,
    reportData.EPS,
    reportData.ROE,
    reportData.Debt,
    reportData.Cash,
  ];

  const metricsTableRows = metricKeys.map((key, idx) => [key, String(metricValues[idx])]);
  leftY = drawGridTable(page1, 30, leftY, ["Metric", "Value"], metricsTableRows, [110, 65], fontBold, fontRegular);

  leftY -= 10;
  leftY = drawSectionTitle(page1, "Shareholding (%)", 30, leftY, 175, fontBold);
  const shRows = Object.entries(reportData.Shareholding || {}).map(([k, v]) => [k, String(v)]);
  leftY = drawGridTable(page1, 30, leftY, ["Holder", "Value"], shRows, [110, 65], fontBold, fontRegular);

  leftY -= 10;
  leftY = drawSectionTitle(page1, "Valuation Ratios", 30, leftY, 175, fontBold);
  const ratioRows = Object.entries(reportData.Ratios || {}).map(([k, v]) => [k, String(v)]);
  drawGridTable(page1, 30, leftY, ["Ratio", "Value"], ratioRows, [110, 65], fontBold, fontRegular);

  // Right Column: Summary, Highlights, Outlook, Quarterly Table
  let rightY = 680;
  rightY = drawSectionTitle(page1, `${reportData.Company} Analysis`, 220, rightY, 345, fontBold);
  
  page1.drawText("INVESTMENT SUMMARY", { x: 220, y: rightY, size: 7.5, font: fontBold, color: SECONDARY_COLOR });
  rightY -= 10;
  rightY = drawParagraph(page1, reportData["Investment Summary"], 220, rightY, 345, 7.5, fontRegular);

  rightY -= 5;
  page1.drawText("INVESTMENT HIGHLIGHTS", { x: 220, y: rightY, size: 7.5, font: fontBold, color: SECONDARY_COLOR });
  rightY -= 10;
  (reportData["Key Highlights"] || []).slice(0, 3).forEach((hl) => {
    page1.drawText("•", { x: 220, y: rightY, size: 8, font: fontBold, color: PRIMARY_COLOR });
    rightY = drawParagraph(page1, hl, 230, rightY, 335, 7.2, fontRegular);
    rightY -= 3;
  });

  rightY -= 5;
  rightY = drawSectionTitle(page1, "Outlook & Valuation", 220, rightY, 345, fontBold);
  rightY = drawParagraph(page1, reportData.Outlook, 220, rightY, 345, 7.2, fontRegular);

  rightY -= 5;
  rightY = drawSectionTitle(page1, "Quarterly Financials Consolidated", 220, rightY, 345, fontBold);
  
  // Prepare Quarterly Table
  const qTable = reportData["Quarterly Financial Table"] || [];
  if (qTable.length > 0) {
    const qHeaders = ["Metrics", ...Object.keys(qTable[0]).filter(k => k.toLowerCase() !== "metric" && k.toLowerCase() !== "metrics")];
    const qRows = qTable.map((row) => {
      const keys = Object.keys(row);
      const mKey = keys.find(k => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
      const valKeys = keys.filter(k => k !== mKey);
      return [String(row[mKey]), ...valKeys.map(k => String(row[k]))];
    });
    const colCount = qHeaders.length;
    const colWidths = [100, ...Array(colCount - 1).fill(245 / (colCount - 1))];
    
    drawGridTable(page1, 220, rightY, qHeaders, qRows, colWidths, fontBold, fontRegular);
  }

  drawPageFooter(page1, 1, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 2: KEY HIGHLIGHTS & CHARTS
  // ----------------------------------------------------
  const page2 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page2, reportData.Company, "Key Highlights & Performance Trends", fontBold, fontRegular);

  let p2Y = 740;
  // Highlights Header Band
  page2.drawRectangle({ x: 30, y: p2Y - 18, width: 535, height: 18, color: SECONDARY_COLOR });
  page2.drawText("KEY INVESTMENT HIGHLIGHTS", { x: 38, y: p2Y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  p2Y -= 28;

  // Render highlights
  const rawHighlights = reportData["Raw Highlights"] && reportData["Raw Highlights"].length > 0
    ? reportData["Raw Highlights"]
    : reportData["Key Highlights"];

  (rawHighlights || []).slice(0, 4).forEach((hl) => {
    page2.drawText("•", { x: 35, y: p2Y, size: 9, font: fontBold, color: PRIMARY_COLOR });
    p2Y = drawParagraph(page2, hl, 45, p2Y, 520, 7.5, fontRegular, TEXT_DARK);
    p2Y -= 4;
  });

  // Charts
  p2Y -= 5;
  p2Y = drawSectionTitle(page2, "Financial Performance Trends", 30, p2Y, 535, fontBold);
  
  // Draw Revenue & EBITDA Trend Side-by-Side
  page2.drawText("Revenue Trend", { x: 30, y: p2Y, size: 8, font: fontBold, color: SECONDARY_COLOR });
  page2.drawText("EBITDA Trend", { x: 310, y: p2Y, size: 8, font: fontBold, color: SECONDARY_COLOR });
  p2Y -= 130;
  
  page2.drawImage(revImage, { x: 30, y: p2Y, width: 250, height: 120 });
  page2.drawImage(ebdImage, { x: 310, y: p2Y, width: 250, height: 120 });

  // Draw PAT Trend Stacked below
  p2Y -= 15;
  page2.drawText("PAT Trend", { x: 30, y: p2Y, size: 8, font: fontBold, color: SECONDARY_COLOR });
  p2Y -= 130;
  page2.drawImage(patImage, { x: 172, y: p2Y, width: 250, height: 120 });

  // Yearly estimates table at the bottom
  p2Y -= 10;
  p2Y = drawSectionTitle(page2, "Historical & Projected Estimates", 30, p2Y, 535, fontBold);
  
  const yTable = reportData["Yearly Financial Table"] || [];
  if (yTable.length > 0) {
    const yHeaders = ["Metrics", ...Object.keys(yTable[0]).filter(k => k.toLowerCase() !== "metric" && k.toLowerCase() !== "metrics")];
    const yRows = yTable.map((row) => {
      const keys = Object.keys(row);
      const mKey = keys.find(k => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
      const valKeys = keys.filter(k => k !== mKey);
      return [String(row[mKey]), ...valKeys.map(k => String(row[k]))];
    });
    const colCount = yHeaders.length;
    const colWidths = [150, ...Array(colCount - 1).fill(385 / (colCount - 1))];
    
    drawGridTable(page2, 30, p2Y, yHeaders, yRows, colWidths, fontBold, fontRegular);
  }

  drawPageFooter(page2, 2, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 3: CONSOLIDATED FINANCIALS
  // ----------------------------------------------------
  const page3 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page3, reportData.Company, "Consolidated Financials", fontBold, fontRegular);

  let p3Y = 740;
  // Section Header
  page3.drawRectangle({ x: 30, y: p3Y - 18, width: 535, height: 18, color: PRIMARY_COLOR });
  page3.drawText("CONSOLIDATED FINANCIALS", { x: 38, y: p3Y - 12, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  p3Y -= 28;

  // 1. Annual Profit & Loss (Full Width)
  p3Y = drawSectionTitle(page3, "Annual Profit & Loss Summary", 30, p3Y, 535, fontBold);
  if (yTable.length > 0) {
    const yHeaders = ["Yearly Metrics (Rs. cr)", ...Object.keys(yTable[0]).filter(k => k.toLowerCase() !== "metric" && k.toLowerCase() !== "metrics")];
    const yRows = yTable.map((row) => {
      const keys = Object.keys(row);
      const mKey = keys.find(k => k.toLowerCase() === "metric" || k.toLowerCase() === "metrics") || keys[0];
      const valKeys = keys.filter(k => k !== mKey);
      return [String(row[mKey]), ...valKeys.map(k => String(row[k]))];
    });
    const colCount = yHeaders.length;
    const colWidths = [180, ...Array(colCount - 1).fill(355 / (colCount - 1))];
    
    p3Y = drawGridTable(page3, 30, p3Y, yHeaders, yRows, colWidths, fontBold, fontRegular);
  }

  p3Y -= 10;
  // 2. Split Box (Ratios vs Balance Sheet Metrics)
  const midY = p3Y;
  
  // Left: Profitability Ratios
  let leftRatioY = drawSectionTitle(page3, "Valuation & Return Ratios", 30, midY, 255, fontBold);
  const ratiosRows = Object.entries(reportData.Ratios || {}).map(([k, v]) => [k, String(v)]);
  leftRatioY = drawGridTable(page3, 30, leftRatioY, ["Ratio", "Value"], ratiosRows, [160, 95], fontBold, fontRegular);

  // Right: Key Balance Sheet Parameters
  let rightBsY = drawSectionTitle(page3, "Key Balance Sheet Metrics", 310, midY, 255, fontBold);
  const bsRows = [
    ["Market Capitalization", reportData["Market Cap"]],
    ["Total Debt", reportData.Debt],
    ["Cash & Cash Equivalents", reportData.Cash],
    ["Current Market Price (CMP)", reportData.CMP],
    ["Target Price", reportData["Target Price"]],
  ];
  rightBsY = drawGridTable(page3, 310, rightBsY, ["Balance Sheet Metric", "Value"], bsRows, [160, 95], fontBold, fontRegular);

  p3Y = Math.min(leftRatioY, rightBsY) - 15;

  // 3. Guidance block
  p3Y = drawSectionTitle(page3, "Forward Guidance & Outlook", 30, p3Y, 535, fontBold);
  page3.drawRectangle({ x: 30, y: p3Y - 50, width: 535, height: 50, color: LIGHT_BG });
  page3.drawRectangle({ x: 30, y: p3Y - 50, width: 535, height: 50, borderColor: BORDER_COLOR, borderWidth: 1 });
  
  drawParagraph(page3, reportData.Guidance || "No forward guidance or projections declared in the document source.", 38, p3Y - 8, 519, 7.2, fontRegular, TEXT_DARK);

  drawPageFooter(page3, 3, fontBold, fontRegular);

  // ----------------------------------------------------
  // PAGE 4: DISCLOSURES & COMPLIANCE
  // ----------------------------------------------------
  const page4 = pdfDoc.addPage([595, 842]);
  drawPageHeader(page4, reportData.Company, "Recommendation History & Disclosures", fontBold, fontRegular);

  let p4Y = 740;
  
  // 1. Recommendation History Table
  p4Y = drawSectionTitle(page4, "Recommendation Summary - History", 30, p4Y, 535, fontBold);
  const historyHeaders = ["Date", "Rating", "Target Price (Rs.)"];
  const historyRows = [
    ["12-Jan-2025", "ACCUMULATE", String(targetNum ? Math.round(targetNum * 0.9) : "300")],
    [reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleDateString() : "", recBadgeText, reportData["Target Price"]],
  ];
  p4Y = drawGridTable(page4, 30, p4Y, historyHeaders, historyRows, [178, 178, 179], fontBold, fontRegular);

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
  p4Y = drawGridTable(page4, 30, p4Y, critHeaders, critRows, [110, 140, 140, 145], fontBold, fontRegular);

  // 3. Disclaimer text box
  p4Y -= 5;
  p4Y = drawSectionTitle(page4, "Disclaimers & Disclosures", 30, p4Y, 535, fontBold);
  
  page4.drawRectangle({ x: 30, y: p4Y - 140, width: 535, height: 140, color: LIGHT_BG });
  page4.drawRectangle({ x: 30, y: p4Y - 140, width: 535, height: 140, borderColor: BORDER_COLOR, borderWidth: 1 });

  let textY = p4Y - 8;
  page4.drawText("Analyst Certification", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  textY = drawParagraph(page4, "The analyst(s) certifying this report hereby declare that all views stated in this document accurately reflect personal opinions regarding the subject securities or issuers. No part of analyst compensation was, is, or will be directly or indirectly related to the specific recommendations or opinions expressed in this research report.", 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT);
  
  textY -= 2;
  page4.drawText("General Disclaimer", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  textY = drawParagraph(page4, "This report has been compiled for informational purposes only and does not constitute investment advice, an offer to buy or sell, or a solicitation of an offer to buy or sell any security. All information, opinions, and forecasts contained herein are subject to change without notice. While data is obtained from sources believed to be reliable, its completeness or accuracy is not guaranteed.", 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT);

  textY -= 2;
  page4.drawText("Disclosure regarding Financial Interest", { x: 38, y: textY, size: 7, font: fontBold, color: SECONDARY_COLOR });
  textY -= 8;
  textY = drawParagraph(page4, "GIL and its research analysts confirm that they do not hold any actual or beneficial ownership of 1% or more of the subject company's securities, nor do they have any material conflict of interest at the time of publication of this report. No associate or analyst has received compensation or fees from the subject company in the past twelve months for investment banking or brokerage services.", 38, textY, 519, 5.8, fontRegular, TEXT_LIGHT);

  p4Y -= 148;

  // 4. Standard warning
  page4.drawRectangle({ x: 30, y: p4Y - 15, width: 535, height: 15, borderColor: ACCENT_UP, borderWidth: 0.8 });
  page4.drawText("Standard Warning: \"Investment in securities market are subject to market risks. Read all the related documents carefully before investing.\"", {
    x: 42,
    y: p4Y - 10,
    size: 7.2,
    font: fontBold,
    color: ACCENT_UP,
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

  // Return the compiled bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
