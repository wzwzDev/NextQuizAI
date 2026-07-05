/**
 * POST /(admin)/quizzes/validate
 * 
 * Purpose: Validate file content and extract text
 * Responsibility: SINGLE - Just validate and extract content
 * 
 * Input: FormData { file }
 * Output: { valid: true, extractedText, fileType, format }
 * 
 * Status Codes:
 * - 200: File validated
 * - 400: Invalid file content
 * - 401: Not admin
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to validate files." },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer);

    let extractedText = "";
    // Determine file type from name/mime type
    // File type will be determined from content type header
    let fileType = "unknown";
    // Default to text format for content extraction
    let format = "text";

    try {
      // Check file type and extract content
      if (file.type === "application/json") {
        // JSON file
        fileType = "json";
        const jsonData = JSON.parse(content.toString());

        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          extractedText = jsonData.map((q: any) => q.text || q.question).join("\n");
        } else if (jsonData.questions) {
          extractedText = jsonData.questions.map((q: any) => q.text || q.question).join("\n");
        } else {
          extractedText = JSON.stringify(jsonData);
        }
        format = "structured";
      } else if (
        file.type === "application/pdf"
      ) {
        // PDF file (requires OCR in production)
        fileType = "pdf";
        extractedText = "[PDF content would be extracted here using OCR]";
        format = "document";
      } else if (file.type === "text/plain") {
        // TXT file
        fileType = "text";
        extractedText = content.toString();
      } else if (
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        // Excel file (requires parsing in production)
        fileType = "excel";
        extractedText = "[Excel content would be extracted here]";
        format = "spreadsheet";
      } else {
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 },
        );
      }

      // Validate that we have content
      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "File appears to be empty" },
          { status: 400 },
        );
      }

      // Return result
      return NextResponse.json(
        {
          valid: true,
          extractedText: extractedText.substring(0, 5000), // Limit output
          fileType,
          format,
          fileName: file.name,
          size: file.size,
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { error: "Failed to parse file content" },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("File validation error:", error.message);
      return NextResponse.json(
        { error: "Failed to validate file" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
