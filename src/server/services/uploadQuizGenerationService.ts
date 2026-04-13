import { strict_output } from "@/server/ai/gptadmin";

const MIN_CONTENT_LENGTH = 10;
const DEFAULT_UPLOAD_MODEL = process.env.OPENAI_QUIZ_MODEL?.trim() || "gpt-4o-mini";

type GeneratedQuestion = {
  question: string;
  answer: string;
};

type RawGeneratedQuestion = {
  question?: unknown;
  answer?: unknown;
};

function ensureAcceptedFile(file: File) {
  if (
    file.type !== "application/json" &&
    file.type !== "text/plain" &&
    !file.name.endsWith(".json") &&
    !file.name.endsWith(".txt")
  ) {
    throw new Error("Only JSON or TXT files are accepted.");
  }
}

async function extractCourseContent(file: File) {
  const text = await file.text();

  if (file.type === "application/json" || file.name.endsWith(".json")) {
    let jsonData: Record<string, unknown>;
    try {
      jsonData = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON file.");
    }

    const content =
      (typeof jsonData.content === "string" && jsonData.content) ||
      (typeof jsonData.text === "string" && jsonData.text) ||
      JSON.stringify(jsonData) ||
      "";

    if (!content) {
      throw new Error("No course content found in JSON.");
    }

    return content;
  }

  return text;
}

function ensureMinimumContentLength(courseContent: string) {
  if (!courseContent || courseContent.trim().length < MIN_CONTENT_LENGTH) {
    throw new Error("Course content is too short or missing.");
  }
}

function normalizeGeneratedQuestions(rawOutput: unknown): GeneratedQuestion[] {
  const rawQuestions = Array.isArray(rawOutput) ? rawOutput : [rawOutput];

  return rawQuestions
    .map((item): GeneratedQuestion | null => {
      const rawQuestion = item as RawGeneratedQuestion;
      const question =
        typeof rawQuestion?.question === "string" ? rawQuestion.question.trim() : "";
      const answer =
        typeof rawQuestion?.answer === "string" ? rawQuestion.answer.trim() : "";

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is GeneratedQuestion => item !== null);
}

export async function generateQuestionsFromCourseContent(
  courseContent: string,
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `
You are a quiz generator. Given the following course content, generate exactly 5 short-answer questions and answers.
Each answer must be an exact, concise target (for example: code output, exact syntax, keyword, identifier, number, or short phrase), 1 to 6 words max.
Do not generate definition/explanation questions that require writing a paragraph.
Course content:
${courseContent}
Respond ONLY with a JSON array of 5 objects, each with BOTH "question" and "answer" fields, like this:
[
  {"question": "What is the output of console.log(2 + 2)?", "answer": "4"},
  ...
]
Do not include any explanation, markdown, or extra text. Only output the JSON array.
If you cannot generate a question or answer, use an empty string for that field.
`;

  const outputFormat = {
    question: "",
    answer: "",
  };

  let generated: unknown;
  try {
    generated = await strict_output(
      systemPrompt,
      "",
      outputFormat,
      "",
      false,
      DEFAULT_UPLOAD_MODEL,
      0,
      3,
      false,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error";
    throw new Error(`OpenAI generation failed: ${message}`);
  }

  const normalizedQuestions = normalizeGeneratedQuestions(generated);
  if (normalizedQuestions.length === 0) {
    throw new Error("No valid questions could be generated from the uploaded file.");
  }

  return normalizedQuestions;
}

export async function generateQuestionsFromUploadedFile(file: File) {
  ensureAcceptedFile(file);
  const courseContent = await extractCourseContent(file);
  ensureMinimumContentLength(courseContent);
  return generateQuestionsFromCourseContent(courseContent);
}