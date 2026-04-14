import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
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
  const category = String(formData.get("category") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "").trim();
  const rawQuizType = String(formData.get("quizType") ?? "").trim();
  const rawQuestionCount = Number(formData.get("questionCount") ?? 5);

  const quizType = rawQuizType === "mcq" ? "mcq" : "open_ended";
  const questionCount =
    Number.isFinite(rawQuestionCount) && rawQuestionCount > 0
      ? Math.max(1, Math.min(15, Math.round(rawQuestionCount)))
      : 5;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  try {
    const questions = await generateQuestionsFromUploadedFile(file, {
      category: category || undefined,
      difficulty: difficulty || undefined,
      quizType,
      questionCount,
    });

    return NextResponse.json({
      questions,
      generationOptions: {
        category: category || null,
        difficulty: difficulty || null,
        quizType,
        questionCount,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const knownClientErrors = new Set([
        "Only JSON, TXT, or PDF files are accepted.",
        "Invalid JSON file.",
        "Invalid PDF file.",
        "PDF OCR failed.",
        "Could not extract readable text from PDF.",
        "Extracted PDF text quality is too low. Please upload a clearer PDF or a text-based file.",
        "No course content found in JSON.",
        "Course content is too short or missing.",
        "No valid questions could be generated from the uploaded file.",
      ]);

      if (knownClientErrors.has(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.startsWith("OpenAI generation failed:")) {
        if (/rate limit|\b429\b/i.test(error.message)) {
          return NextResponse.json(
            {
              questions: [],
              error:
                "Rate limit reached while generating quiz questions. Please retry in a few seconds.",
            },
            { status: 429 },
          );
        }

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
