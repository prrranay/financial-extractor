import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const companyName = formData.get("companyName") as string;
    const file = formData.get("file") as File;

    // Validation
    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Company name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please upload a file." },
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

    // Simulate backend processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Ensure target directory exists
    const publicGeneratedDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGeneratedDir)) {
      fs.mkdirSync(publicGeneratedDir, { recursive: true });
    }

    // Generate a simple PDF using pdf-lib as a mock report
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("FINANCIAL EXTRACTOR REPORT", {
      x: 50,
      y: 330,
      size: 24,
      font,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText(`Company Name: ${companyName}`, {
      x: 50,
      y: 280,
      size: 16,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Source File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, {
      x: 50,
      y: 250,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText("Generated on: " + new Date().toLocaleString(), {
      x: 50,
      y: 220,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText("Status: Setup complete. Ready for business logic implementation.", {
      x: 50,
      y: 150,
      size: 14,
      font,
      color: rgb(0.1, 0.6, 0.3),
    });

    const pdfBytes = await pdfDoc.save();
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(publicGeneratedDir, fileName);
    fs.writeFileSync(filePath, pdfBytes);

    return NextResponse.json({
      success: true,
      message: "Report generated successfully.",
      downloadUrl: `/generated/${fileName}`,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
