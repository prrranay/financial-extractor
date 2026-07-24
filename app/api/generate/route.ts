import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { parseFile } from "@/lib/parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const companyName = formData.get("companyName") as string;
    const file = formData.get("file") as File;

    // Validate company name is present
    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Company name must be at least 2 characters." },
        { status: 400 }
      );
    }

    // Validate file exists
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid file." },
        { status: 400 }
      );
    }

    // Validate supported type (PDF, TXT, CSV)
    const allowedExtensions = [".pdf", ".txt", ".csv"];
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload a PDF, TXT, or CSV file." },
        { status: 400 }
      );
    }

    // Convert file (Blob) to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call parser
    const parsed = await parseFile(buffer, file.name);

    // Return success response with parsed text
    return NextResponse.json({
      success: true,
      extractedText: parsed.text,
    });
  } catch (error) {
    console.error("Error in generate API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

