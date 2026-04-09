import { strict_output } from "@/server/ai/gptadmin";

const MIN_CONTENT_LENGTH = 10;

type GeneratedQuestion = {
  question: string;
  answer: string;
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

export async function generateQuestionsFromCourseContent(
  courseContent: string,
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `
You are a quiz generator. Given the following course content, generate exactly 5 questions and answers.
Course content:
${courseContent}
Respond ONLY with a JSON array of 5 objects, each with BOTH "question" and "answer" fields, like this:
[
  {"question": "What is Java?", "answer": "Java is a popular programming language."},
  ...
]
Do not include any explanation, markdown, or extra text. Only output the JSON array.
If you cannot generate a question or answer, use an empty string for that field.
`;

  const outputFormat = {
    question: "",
    answer: "",
  };

  const generated = await strict_output(
    systemPrompt,
    "",
    outputFormat,
    "",
    false,
    "gpt-3.5-turbo",
    0,
    3,
    false,
  );

  if (!Array.isArray(generated)) {
    return [generated as GeneratedQuestion];
  }

  return generated as GeneratedQuestion[];
}

export async function generateQuestionsFromUploadedFile(file: File) {
  ensureAcceptedFile(file);
  const courseContent = await extractCourseContent(file);
  ensureMinimumContentLength(courseContent);
  return generateQuestionsFromCourseContent(courseContent);
}