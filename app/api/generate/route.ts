import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { parseFile } from "@/lib/parser";
import { classifyTables } from "@/lib/tableClassifier";
import { extractFinancialData, generateAnalysis } from "@/lib/gemini";
import { mapToReportData } from "@/lib/mapper";
import { generateReportPdf } from "@/lib/pdf";
import { getFileHash, getCachedReport, saveCachedReport } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const companyName = formData.get("companyName") as string;
    const file = formData.get("file") as File;

    // 1. Validate parameters
    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Company name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid file." },
        { status: 400 }
      );
    }

    const allowedExtensions = [".pdf", ".txt", ".csv"];
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload a PDF, TXT, or CSV file." },
        { status: 400 }
      );
    }

    // 2. Convert uploaded file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute file hash and check cache
    const fileHash = getFileHash(buffer);
    const cachedReport = getCachedReport(fileHash);

    let reportData;

    if (cachedReport) {
      console.log(`[Cache Hit] Reusing cached financial report for hash: ${fileHash}`);
      reportData = cachedReport;
    } else {
      console.log(`[Cache Miss] Running full extraction pipeline for hash: ${fileHash}`);

      // 3. Parse document & native vector tables
      const parsed = await parseFile(buffer, file.name);
      const classifiedTables = classifyTables(parsed.tables || []);

      // 4. Extract structured financial JSON using Gemini Flash
      const financials = await extractFinancialData(parsed.text, fileHash);

      // Override table fields with native vector tables if extracted directly from document
      (Object.keys(classifiedTables) as Array<keyof typeof classifiedTables>).forEach((key) => {
        const nativeTable = classifiedTables[key];
        if (Array.isArray(nativeTable) && nativeTable.length > 0) {
          (financials as unknown as Record<string, unknown>)[key] = nativeTable;
        }
      });

      // Ensure the Company name from the form matches what the extraction outputs if not present or default
      if (!financials.Company || financials.Company === "N/A") {
        financials.Company = companyName;
      }

      // 5. Generate investment analysis using Gemini Flash
      const analysis = await generateAnalysis(financials, fileHash);

      // 6. Map report data
      reportData = mapToReportData(financials, analysis);

      // Save to cache
      saveCachedReport(fileHash, reportData);
    }

    // 7. Generate PDF report (includes rendering charts under-the-hood)
    const pdfBuffer = await generateReportPdf(reportData);

    // 8. Return downloadable PDF response
    const safeFileName = `${reportData.Company.replace(/[^a-zA-Z0-9]/g, "_")}_Research_Report.pdf`;
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (error) {
    console.error("Error in PDF report generation pipeline:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unexpected error occurred during report generation.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

