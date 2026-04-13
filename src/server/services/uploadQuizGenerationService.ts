import { strict_output } from "@/server/ai/gptadmin";
import { getOpenAIClient } from "@/server/ai/openaiClient";

const MIN_CONTENT_LENGTH = 10;
const DEFAULT_UPLOAD_MODEL = process.env.OPENAI_QUIZ_MODEL?.trim() || "gpt-4o-mini";
const DEFAULT_PDF_OCR_MODEL = process.env.OPENAI_PDF_OCR_MODEL?.trim() || "gpt-4o-mini";
const JSON_MIME = "application/json";
const TEXT_MIME = "text/plain";
const PDF_MIME = "application/pdf";
const MIN_OCR_WORD_COUNT = 6;
const MIN_OCR_ALPHA_WORD_RATIO = 0.45;

type GeneratedQuestion = {
  question: string;
  answer: string;
};

type RawGeneratedQuestion = {
  question?: unknown;
  answer?: unknown;
};

function isJsonFile(file: File) {
  return file.type === JSON_MIME || file.name.toLowerCase().endsWith(".json");
}

function isTextFile(file: File) {
  return file.type === TEXT_MIME || file.name.toLowerCase().endsWith(".txt");
}

function isPdfFile(file: File) {
  return file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
}

function isLikelyReadableOcrText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return false;
  }

  const words = normalized.split(" ").filter(Boolean);
  if (words.length < MIN_OCR_WORD_COUNT) {
    return false;
  }

  const alphaWords = words.filter((word) => /[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(word));
  const alphaWordRatio = alphaWords.length / words.length;
  return alphaWordRatio >= MIN_OCR_ALPHA_WORD_RATIO;
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const pdfJs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfJs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdfDocument = await loadingTask.promise;

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => {
          if (typeof item === "object" && item !== null && "str" in item) {
            const value = (item as { str?: unknown }).str;
            return typeof value === "string" ? value : "";
          }
          return "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    return pages.join("\n");
  } catch {
    throw new Error("Invalid PDF file.");
  }
}

async function extractTextFromPdfWithOcr(file: File): Promise<string> {
  const openai = getOpenAIClient();
  const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const response = await openai.responses.create({
      model: DEFAULT_PDF_OCR_MODEL,
      temperature: 0,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Extract all readable text from this course PDF. Return plain text only without markdown, explanation, or summaries.",
            },
            {
              type: "input_file",
              filename: file.name || "course.pdf",
              file_data: `data:application/pdf;base64,${pdfBase64}`,
            },
          ],
        },
      ],
    });

    return response.output_text?.trim() || "";
  } catch {
    throw new Error("PDF OCR failed.");
  }
}

function ensureAcceptedFile(file: File) {
  if (!isJsonFile(file) && !isTextFile(file) && !isPdfFile(file)) {
    throw new Error("Only JSON, TXT, or PDF files are accepted.");
  }
}

async function extractCourseContent(file: File) {
  if (isPdfFile(file)) {
    let textFromPdf = "";
    try {
      textFromPdf = await extractTextFromPdf(file);
    } catch {
      // Some valid/scanned PDFs can fail low-level parsing in certain runtimes.
      // In that case, fall back to OCR before surfacing an error.
      textFromPdf = "";
    }

    if (textFromPdf.trim().length >= MIN_CONTENT_LENGTH) {
      return textFromPdf;
    }

    const textFromOcr = await extractTextFromPdfWithOcr(file);
    if (!textFromOcr.trim()) {
      throw new Error("Could not extract readable text from PDF.");
    }

    if (!isLikelyReadableOcrText(textFromOcr)) {
      throw new Error(
        "Extracted PDF text quality is too low. Please upload a clearer PDF or a text-based file.",
      );
    }

    return textFromOcr;
  }

  const text = await file.text();

  if (isJsonFile(file)) {
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
Never return empty strings for "question" or "answer".
Every object must include a non-empty "question" and a non-empty concise "answer".
`;

  const fallbackSystemPrompt = `
You are a quiz generator. Create exactly 3 high-confidence short-answer question/answer pairs from the course content below.
Use only facts that are explicitly present in the content.
Each answer must be 1 to 6 words and non-empty.
Course content:
${courseContent}
Return ONLY a valid JSON array of objects with keys "question" and "answer".
Do not include markdown or extra commentary.
`;

  const outputFormat = {
    question: "",
    answer: "",
  };

  async function requestNormalizedQuestions(prompt: string) {
    let generated: unknown;
    try {
      generated = await strict_output(
        prompt,
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

    return normalizeGeneratedQuestions(generated);
  }

  let normalizedQuestions = await requestNormalizedQuestions(systemPrompt);
  if (normalizedQuestions.length === 0) {
    normalizedQuestions = await requestNormalizedQuestions(fallbackSystemPrompt);
  }

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