import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contentType = req.headers.get("content-type") || "";
  if (
    !contentType.startsWith("multipart/form-data") &&
    !contentType.startsWith("application/x-www-form-urlencoded")
  ) {
    return NextResponse.json(
      {
        error:
          "Content-Type must be multipart/form-data or application/x-www-form-urlencoded.",
      },
      { status: 400 },
    );
  }
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  try {
    const questions = await generateQuestionsFromUploadedFile(file);
    return NextResponse.json({ questions });
  } catch (error) {
    if (error instanceof Error) {
      const knownClientErrors = new Set([
        "Only JSON or TXT files are accepted.",
        "Invalid JSON file.",
        "No course content found in JSON.",
        "Course content is too short or missing.",
        "No valid questions could be generated from the uploaded file.",
      ]);

      if (knownClientErrors.has(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.startsWith("OpenAI generation failed:")) {
        return NextResponse.json(
          { questions: [], error: error.message },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { questions: [], error: "Failed to generate quiz." },
      { status: 500 },
    );
  }
}
