/**
 * POST /(admin)/quizzes/upload
 * 
 * Purpose: Upload and store file for later processing
 * Responsibility: SINGLE - Just store file and return reference
 * 
 * Input: FormData { file }
 * Output: { fileId, fileName, size, type }
 * 
 * Status Codes:
 * - 200: File uploaded
 * - 400: No file provided or invalid file
 * - 401: Not admin
 * - 413: File too large
 * - 500: Server error
 */

import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/json",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getAuthSession(req);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to upload files." },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, JSON, TXT, XLS, XLSX",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    // Store file reference (in production, would save to storage service)
    const fileId = randomUUID();
    const uploadedFile = {
      fileId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    // Return result
    return NextResponse.json(uploadedFile, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("File upload error:", error.message);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
