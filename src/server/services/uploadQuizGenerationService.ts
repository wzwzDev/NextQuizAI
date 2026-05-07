import { randomUUID } from "crypto";
import * as vision from "@google-cloud/vision";
import { Storage } from "@google-cloud/storage";
import { strict_output } from "@/server/ai/gptadmin";
import { getOpenAIClient } from "@/server/ai/openaiClient";

const MIN_CONTENT_LENGTH = 10;
const DEFAULT_UPLOAD_MODEL = process.env.OPENAI_QUIZ_MODEL?.trim() || "gpt-4o-mini";
const DEFAULT_PDF_OCR_MODEL = process.env.OPENAI_PDF_OCR_MODEL?.trim() || "gpt-4o-mini";
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY?.trim() || "";
const GOOGLE_VISION_FILES_ENDPOINT = "https://vision.googleapis.com/v1/files:annotate";
const GOOGLE_VISION_GCS_BUCKET = process.env.GOOGLE_VISION_GCS_BUCKET?.trim() || "";
const GOOGLE_APPLICATION_CREDENTIALS_JSON =
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() || "";
const JSON_MIME = "application/json";
const TEXT_MIME = "text/plain";
const PDF_MIME = "application/pdf";
const MIN_OCR_WORD_COUNT = 6;
const MIN_OCR_ALPHA_WORD_RATIO = 0.45;
const MIN_OCR_CHAR_COUNT = 80;
const MIN_OCR_UNIQUE_ALPHA_WORDS = 8;
const MAX_CONTENT_CHARS = 16_000;
const FALLBACK_QUESTION_COUNT = 5;
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 15;
const MIN_FALLBACK_SENTENCE_LENGTH = 24;
const MAX_CITATION_SENTENCES = 180;
const MAX_CITATION_SNIPPET_LENGTH = 190;
const MIN_TOKEN_LENGTH = 3;
const DEFAULT_OCR_MODEL_CANDIDATES = [
  DEFAULT_PDF_OCR_MODEL,
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-4o-mini",
];

let visionClient: vision.ImageAnnotatorClient | null = null;
let storageClient: Storage | null = null;
let cachedCredentials:
  | { client_email: string; private_key: string; project_id?: string }
  | null
  | undefined;

function getGcpCredentials() {
  if (cachedCredentials !== undefined) {
    return cachedCredentials;
  }

  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    cachedCredentials = null;
    return cachedCredentials;
  }

  try {
    cachedCredentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON) as {
      client_email: string;
      private_key: string;
      project_id?: string;
    };
  } catch {
    throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON.");
  }

  return cachedCredentials;
}

function getVisionClient() {
  if (!visionClient) {
    const credentials = getGcpCredentials();
    visionClient = new vision.ImageAnnotatorClient(
      credentials ? { credentials, projectId: credentials.project_id } : undefined,
    );
  }
  return visionClient;
}

function getStorageClient() {
  if (!storageClient) {
    const credentials = getGcpCredentials();
    storageClient = new Storage(
      credentials ? { credentials, projectId: credentials.project_id } : undefined,
    );
  }
  return storageClient;
}

const COMMON_STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "into",
  "about",
  "what",
  "when",
  "where",
  "while",
  "will",
  "would",
  "should",
  "could",
  "there",
  "their",
  "then",
  "than",
  "because",
  "which",
  "using",
  "used",
  "each",
  "only",
  "also",
  "been",
  "being",
  "through",
  "between",
  "under",
  "over",
  "before",
  "after",
  "into",
  "they",
  "them",
  "are",
  "was",
  "were",
  "for",
  "you",
  "our",
]);

const REFUSAL_PHRASES = [
  "i'm unable to assist",
  "i am unable to assist",
  "unable to assist with that",
  "i can't assist with that",
  "i cannot assist with that",
  "i can't help with that",
  "i cannot help with that",
  "sorry, i can't assist",
  "sorry, i cannot assist",
  "i'm sorry, but i can't",
  "i am sorry, but i cannot",
  "cannot comply with this request",
];

type GeneratedQuestion = {
  question: string;
  answer: string;
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
};

export type UploadQuizGenerationOptions = {
  questionCount?: number;
  difficulty?: string;
  category?: string;
  quizType?: "mcq" | "open_ended";
  sourceName?: string;
};

type RawGeneratedQuestion = {
  question?: unknown;
  answer?: unknown;
  citation?: unknown;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRateLimitMessage(message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429")
  );
}

function isRefusalLikeText(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) {
    return false;
  }

  return REFUSAL_PHRASES.some((phrase) => normalized.includes(phrase));
}

function extractSentencesForFallback(courseContent: string) {
  return courseContent
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/[.!?]+/))
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(
      (sentence) =>
        sentence.length >= MIN_FALLBACK_SENTENCE_LENGTH &&
        !isRefusalLikeText(sentence),
    );
}

function extractSentenceCandidates(courseContent: string) {
  return courseContent
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/[.!?]+/))
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 0)
    .slice(0, MAX_CITATION_SENTENCES);
}

function tokenizeForOverlap(value: string) {
  return Array.from(
    new Set(
      (value.match(/[A-Za-z0-9_+#.-]{3,}/g) ?? [])
        .map((token) => token.toLowerCase())
        .filter(
          (token) =>
            token.length >= MIN_TOKEN_LENGTH && !COMMON_STOP_WORDS.has(token),
        ),
    ),
  );
}

function normalizeRawCitation(rawCitation: unknown) {
  if (!rawCitation || typeof rawCitation !== "object") {
    return undefined;
  }

  const citation = rawCitation as {
    source?: unknown;
    snippet?: unknown;
    confidence?: unknown;
  };

  const source =
    typeof citation.source === "string" ? citation.source.trim() : "";
  const snippet =
    typeof citation.snippet === "string" ? citation.snippet.trim() : "";
  const confidence =
    typeof citation.confidence === "number" && Number.isFinite(citation.confidence)
      ? Math.max(0, Math.min(1, citation.confidence))
      : undefined;

  if (!source || !snippet) {
    return undefined;
  }

  return {
    source,
    snippet,
    ...(confidence !== undefined ? { confidence } : {}),
  };
}

function buildCitationForQuestion(params: {
  courseContent: string;
  sourceName?: string;
  question: string;
  answer: string;
}) {
  const source = params.sourceName?.trim() || "Uploaded document";
  const candidates = extractSentenceCandidates(params.courseContent);

  if (candidates.length === 0) {
    const fallbackSnippet = params.courseContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CITATION_SNIPPET_LENGTH);

    return {
      source,
      snippet: fallbackSnippet || "No citation snippet available.",
      confidence: 0.35,
    };
  }

  const answerNormalized = params.answer.trim().toLowerCase();
  const questionTokens = tokenizeForOverlap(params.question);
  let bestSentence = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestContainsAnswer = false;

  for (const sentence of candidates) {
    const sentenceNormalized = sentence.toLowerCase();
    const sentenceTokens = tokenizeForOverlap(sentence);
    const containsAnswer =
      answerNormalized.length > 0 && sentenceNormalized.includes(answerNormalized);

    let overlapScore = 0;
    if (questionTokens.length > 0 && sentenceTokens.length > 0) {
      const sentenceTokenSet = new Set(sentenceTokens);
      const overlapCount = questionTokens.filter((token) =>
        sentenceTokenSet.has(token),
      ).length;
      overlapScore = overlapCount / questionTokens.length;
    }

    const score = (containsAnswer ? 3 : 0) + overlapScore;
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
      bestContainsAnswer = containsAnswer;
    }
  }

  const snippet =
    bestSentence.length > MAX_CITATION_SNIPPET_LENGTH
      ? `${bestSentence.slice(0, MAX_CITATION_SNIPPET_LENGTH - 3)}...`
      : bestSentence;

  const confidence = bestContainsAnswer
    ? 0.95
    : Math.max(0.45, Math.min(0.85, 0.45 + Math.max(bestScore, 0) * 0.1));

  return {
    source,
    snippet,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function normalizeQuestionCount(value?: number) {
  if (!Number.isFinite(value)) {
    return FALLBACK_QUESTION_COUNT;
  }

  const roundedValue = Math.round(Number(value));
  return Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, roundedValue));
}

function trimTokenDelimiters(token: string) {
  const isDelimiter = (char: string) =>
    char === "_" || char === "#" || char === "." || char === "-";

  let start = 0;
  let end = token.length;

  while (start < end && isDelimiter(token[start])) {
    start += 1;
  }

  while (end > start && isDelimiter(token[end - 1])) {
    end -= 1;
  }

  return token.slice(start, end);
}

function pickFallbackAnswerToken(sentence: string) {
  const rawTokens = sentence.match(/[A-Za-z0-9_+#.-]+/g) ?? [];
  const cleanedTokens = rawTokens
    .map((token) => trimTokenDelimiters(token))
    .filter(Boolean);

  const preferred = cleanedTokens.find((token) => {
    const normalizedToken = token.toLowerCase();
    return (
      token.length >= 3 &&
      /[a-zA-Z]/.test(token) &&
      !COMMON_STOP_WORDS.has(normalizedToken)
    );
  });

  if (preferred) {
    return preferred;
  }

  const sortedByLength = [...cleanedTokens].sort((left, right) => right.length - left.length);
  return sortedByLength.find((token) => token.length >= 3) ?? null;
}

function buildFallbackQuestion(sentence: string, answer: string) {
  const normalizedSentence = sentence.replace(/\s+/g, " ").trim();
  const shortenedSentence =
    normalizedSentence.length > 140
      ? `${normalizedSentence.slice(0, 137)}...`
      : normalizedSentence;

  const clozeSentence = shortenedSentence.replace(
    new RegExp(`\\b${escapeRegExp(answer)}\\b`, "i"),
    "_____",
  );

  if (clozeSentence !== shortenedSentence) {
    return `Fill in the blank from the course content: "${clozeSentence}"`;
  }

  return `From this statement, what key term is being referenced: "${shortenedSentence}"`;
}

function generateFallbackQuestionsFromContent(
  courseContent: string,
  questionCount: number = FALLBACK_QUESTION_COUNT,
): GeneratedQuestion[] {
  const sentences = extractSentencesForFallback(courseContent);
  const usedAnswers = new Set<string>();
  const usedQuestions = new Set<string>();
  const generated: GeneratedQuestion[] = [];

  for (const sentence of sentences) {
    const answer = pickFallbackAnswerToken(sentence);
    if (!answer) {
      continue;
    }

    const answerKey = answer.toLowerCase();
    if (usedAnswers.has(answerKey)) {
      continue;
    }

    const question = buildFallbackQuestion(sentence, answer);
    const questionKey = question.toLowerCase();
    if (usedQuestions.has(questionKey)) {
      continue;
    }

    generated.push({ question, answer });
    usedAnswers.add(answerKey);
    usedQuestions.add(questionKey);

    if (generated.length >= questionCount) {
      return generated;
    }
  }

  const backupSource = courseContent
    .split(/\r?\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && !isRefusalLikeText(line))
    .join(" ");

  const backupTokens = (backupSource.match(/[A-Za-z0-9_+#.-]{3,}/g) ?? [])
    .map((token) => token.toLowerCase())
    .filter((token) => /[a-zA-Z]/.test(token) && !COMMON_STOP_WORDS.has(token));

  const uniqueBackupTokens = Array.from(new Set(backupTokens)).slice(0, questionCount);

  for (const token of uniqueBackupTokens) {
    if (generated.length >= questionCount) {
      break;
    }

    const answerKey = token.toLowerCase();
    if (usedAnswers.has(answerKey)) {
      continue;
    }

    const question = `Identify key term #${generated.length + 1} from the provided content.`;
    const questionKey = question.toLowerCase();
    if (usedQuestions.has(questionKey)) {
      continue;
    }

    generated.push({ question, answer: token });
    usedAnswers.add(answerKey);
    usedQuestions.add(questionKey);
  }

  return generated.slice(0, questionCount);
}

function padQuestionsWithPlaceholders(
  questions: GeneratedQuestion[],
  questionCount: number,
) {
  const paddedQuestions = [...questions];

  while (paddedQuestions.length < questionCount) {
    paddedQuestions.push({
      question: `Identify a key term #${paddedQuestions.length + 1} from the provided content.`,
      answer: "term",
    });
  }

  return paddedQuestions.slice(0, questionCount);
}

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

  if (normalized.length < MIN_OCR_CHAR_COUNT) {
    return false;
  }

  if (isRefusalLikeText(normalized)) {
    return false;
  }

  const words = normalized.split(" ").filter(Boolean);
  if (words.length < MIN_OCR_WORD_COUNT) {
    return false;
  }

  const alphaWords = words.filter((word) => /[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(word));
  const uniqueAlphaWords = new Set(alphaWords.map((word) => word.toLowerCase()));
  if (uniqueAlphaWords.size < MIN_OCR_UNIQUE_ALPHA_WORDS) {
    return false;
  }

  const alphaWordRatio = alphaWords.length / words.length;
  return alphaWordRatio >= MIN_OCR_ALPHA_WORD_RATIO;
}

async function extractTextFromPdf(file: File): Promise<string> {
  // In Vercel serverless, canvas APIs are unavailable and pdfjs warnings occur.
  // Skip pdfjs parsing and let Vision OCR handle all PDFs on production.
  if (process.env.VERCEL) {
    return "";
  }

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
  const errors: string[] = [];
  if (GOOGLE_VISION_GCS_BUCKET) {
    try {
      const textFromVision = await extractTextFromPdfWithGoogleVisionGcs(file);
      const trimmed = textFromVision.trim();
      if (trimmed) {
        if (isRefusalLikeText(trimmed)) {
          errors.push("Google Vision GCS OCR returned refusal-like text.");
          console.warn(
            "DEBUG OCR PROVIDER: Google Vision GCS returned refusal-like text (truncated):",
            trimmed.slice(0, 200),
          );
        } else {
          return trimmed;
        }
      } else {
        errors.push("Google Vision GCS OCR returned empty text.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Vision OCR error.";
      errors.push(`Google Vision GCS OCR failed: ${message}`);
    }
  }

  try {
    const textFromVision = await extractTextFromPdfWithGoogleVision(file);
    const trimmed = textFromVision.trim();
    if (trimmed) {
      if (isRefusalLikeText(trimmed)) {
        errors.push("Google Vision OCR returned refusal-like text.");
        console.warn(
          "DEBUG OCR PROVIDER: Google Vision API returned refusal-like text (truncated):",
          trimmed.slice(0, 200),
        );
      } else {
        return trimmed;
      }
    } else {
      errors.push("Google Vision OCR returned empty text.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Vision OCR error.";
    errors.push(`Google Vision OCR failed: ${message}`);
  }

  const openai = getOpenAIClient();
  const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const models = Array.from(
    new Set(
      DEFAULT_OCR_MODEL_CANDIDATES.map((model) => model.trim()).filter(Boolean),
    ),
  );

  for (const model of models) {
    try {
      const response = await openai.responses.create({
        model,
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

      const ocrText = response.output_text?.trim() || "";
      if (!ocrText) {
        errors.push(`${model}: returned empty OCR text.`);
        continue;
      }

      if (isRefusalLikeText(ocrText)) {
        errors.push(`${model}: OCR returned refusal-like text.`);
        console.warn(
          `DEBUG OCR PROVIDER: ${model} returned refusal-like text (truncated):`,
          ocrText.slice(0, 200),
        );
        continue;
      }

      return ocrText;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown OCR provider error.";
      errors.push(`${model}: ${message}`);
    }
  }

  const joinedErrors = errors.join(" | ");
  throw new Error(`OpenAI OCR failed: ${joinedErrors}`);
}

async function extractTextFromPdfWithGoogleVision(file: File): Promise<string> {
  if (GOOGLE_VISION_API_KEY) {
    return extractTextFromPdfWithGoogleVisionApiKey(file);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const client = getVisionClient();
  const [result] = await client.batchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          content: buffer,
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  });

  const fileResponse = result.responses?.[0];
  if (!fileResponse || !fileResponse.responses) {
    return "";
  }

  return fileResponse.responses
    .map((response: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse) =>
      response.fullTextAnnotation?.text ?? "",
    )
    .join("\n")
    .trim();
}

function sanitizeGcsFileName(fileName: string) {
  return fileName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120) || "document.pdf";
}

async function extractTextFromPdfWithGoogleVisionGcs(file: File): Promise<string> {
  if (!GOOGLE_VISION_GCS_BUCKET) {
    throw new Error("Missing GOOGLE_VISION_GCS_BUCKET.");
  }

  const credentials = getGcpCredentials();
  if (!credentials) {
    throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getStorageClient().bucket(GOOGLE_VISION_GCS_BUCKET);
  const id = randomUUID();
  const safeName = sanitizeGcsFileName(file.name || "document.pdf");
  const inputPath = `ocr-input/${id}/${safeName}`;
  const outputPrefix = `ocr-output/${id}/`;

  await bucket.file(inputPath).save(buffer, {
    contentType: "application/pdf",
    resumable: false,
  });

  const client = getVisionClient();
  const [operation] = await client.asyncBatchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          gcsSource: { uri: `gs://${GOOGLE_VISION_GCS_BUCKET}/${inputPath}` },
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: { uri: `gs://${GOOGLE_VISION_GCS_BUCKET}/${outputPrefix}` },
          batchSize: 2,
        },
      },
    ],
  });

  await operation.promise();

  const [files] = await bucket.getFiles({ prefix: outputPrefix });
  const textParts: string[] = [];

  for (const outputFile of files) {
    if (!outputFile.name.endsWith(".json")) {
      continue;
    }

    const [contents] = await outputFile.download();
    const json = JSON.parse(contents.toString("utf8")) as {
      responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
    };

    for (const response of json.responses ?? []) {
      const text = response.fullTextAnnotation?.text?.trim();
      if (text) {
        textParts.push(text);
      }
    }
  }

  await bucket.deleteFiles({ prefix: `ocr-input/${id}/` }).catch(() => undefined);
  await bucket.deleteFiles({ prefix: outputPrefix }).catch(() => undefined);

  return textParts.join("\n").trim();
}

async function extractTextFromPdfWithGoogleVisionApiKey(file: File): Promise<string> {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error("Missing GOOGLE_VISION_API_KEY.");
  }

  const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const response = await fetch(
    `${GOOGLE_VISION_FILES_ENDPOINT}?key=${encodeURIComponent(GOOGLE_VISION_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            inputConfig: {
              mimeType: "application/pdf",
              content: pdfBase64,
            },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Vision OCR failed: ${message}`);
  }

  const data = (await response.json()) as {
    responses?: Array<{ responses?: Array<{ fullTextAnnotation?: { text?: string } }> }>;
  };

  const pages = data.responses?.[0]?.responses ?? [];
  return pages
    .map((page) => page.fullTextAnnotation?.text ?? "")
    .join("\n")
    .trim();
}

function ensureAcceptedFile(file: File) {
  if (!isJsonFile(file) && !isTextFile(file) && !isPdfFile(file)) {
    throw new Error("Only JSON, TXT, or PDF files are accepted.");
  }
}

type ExtractedCourseContent = {
  content: string;
  source: "pdf" | "json" | "text";
  ocrQuality: "ok" | "low" | "unknown";
};

async function extractCourseContent(file: File): Promise<ExtractedCourseContent> {
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
      return { content: textFromPdf, source: "pdf", ocrQuality: "unknown" };
    }

    const textFromOcr = await extractTextFromPdfWithOcr(file);
    // Debug: log a truncated version of OCR text to help diagnose production issues
    try {
      console.warn("DEBUG OCR TEXT (truncated):", (textFromOcr || "").slice(0, 1000));
    } catch {}

    if (!textFromOcr.trim()) {
      throw new Error("Could not extract readable text from PDF.");
    }

    if (!isLikelyReadableOcrText(textFromOcr)) {
      console.warn("Low-quality OCR text detected; continuing with fallback.");
      return { content: textFromOcr, source: "pdf", ocrQuality: "low" };
    }

    return { content: textFromOcr, source: "pdf", ocrQuality: "ok" };
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

    return { content, source: "json", ocrQuality: "unknown" };
  }

  return { content: text, source: "text", ocrQuality: "unknown" };
}

function ensureMinimumContentLength(courseContent: string, minLength: number) {
  if (!courseContent || courseContent.trim().length < minLength) {
    throw new Error("Course content is too short or missing.");
  }
}

function prepareCourseContentForGeneration(courseContent: string) {
  const normalized = courseContent.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_CONTENT_CHARS) {
    return normalized;
  }

  return normalized.slice(0, MAX_CONTENT_CHARS);
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
      const citation = normalizeRawCitation(rawQuestion?.citation);

      if (!question || !answer) {
        return null;
      }

      return {
        question,
        answer,
        ...(citation ? { citation } : {}),
      };
    })
    .filter((item): item is GeneratedQuestion => item !== null);
}

export async function generateQuestionsFromCourseContent(
  courseContent: string,
  options: UploadQuizGenerationOptions = {},
): Promise<GeneratedQuestion[]> {
  const questionCount = normalizeQuestionCount(options.questionCount);
  const difficultyHint = options.difficulty?.trim() || "mixed";
  const categoryHint = options.category?.trim() || "content-derived";
  const quizTypeHint = options.quizType === "mcq" ? "mcq-ready" : "open-ended";

  const systemPrompt = `
You are a quiz generator. Given the following course content, generate exactly ${questionCount} short-answer questions and answers.
Difficulty target: ${difficultyHint}
Category focus: ${categoryHint}
Target style: ${quizTypeHint}
Each answer must be an exact, concise target (for example: code output, exact syntax, keyword, identifier, number, or short phrase), 1 to 6 words max.
Do not generate definition/explanation questions that require writing a paragraph.
Course content:
${courseContent}
Respond ONLY with a JSON array of ${questionCount} objects, each with BOTH "question" and "answer" fields, like this:
[
  {"question": "What is the output of console.log(2 + 2)?", "answer": "4"},
  ...
]
Do not include any explanation, markdown, or extra text. Only output the JSON array.
Never return empty strings for "question" or "answer".
Every object must include a non-empty "question" and a non-empty concise "answer".
`;

  const fallbackSystemPrompt = `
You are a quiz generator. Create exactly ${questionCount} high-confidence short-answer question/answer pairs from the course content below.
Difficulty target: ${difficultyHint}
Category focus: ${categoryHint}
Target style: ${quizTypeHint}
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

    // Debug: log raw AI output so we can see why normalization may drop results
    try {
      console.warn("DEBUG AI RAW OUTPUT (truncated):", JSON.stringify(generated).slice(0, 2000));
    } catch {}

    return normalizeGeneratedQuestions(generated);
  }

  let normalizedQuestions: GeneratedQuestion[] = [];
  try {
    normalizedQuestions = await requestNormalizedQuestions(systemPrompt);
    if (normalizedQuestions.length === 0) {
      normalizedQuestions = await requestNormalizedQuestions(fallbackSystemPrompt);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error";
    if (isRateLimitMessage(message)) {
      console.warn(
        "OpenAI rate limit encountered during upload generation; using deterministic fallback questions.",
      );

      const fallbackQuestions = generateFallbackQuestionsFromContent(
        courseContent,
        questionCount,
      );

      return padQuestionsWithPlaceholders(fallbackQuestions, questionCount);
    }

    throw error;
  }

  if (normalizedQuestions.length === 0) {
    console.warn("Question generation produced 0 items; synthesizing placeholders.");
    normalizedQuestions = padQuestionsWithPlaceholders(normalizedQuestions, questionCount);
  }

  if (normalizedQuestions.length > questionCount) {
    normalizedQuestions = normalizedQuestions.slice(0, questionCount);
  }

  if (normalizedQuestions.length < questionCount) {
    const fallbackQuestions = generateFallbackQuestionsFromContent(
      courseContent,
      questionCount,
    );
    const usedQuestionKeys = new Set(
      normalizedQuestions.map((item) => item.question.trim().toLowerCase()),
    );

    for (const fallbackQuestion of fallbackQuestions) {
      const key = fallbackQuestion.question.trim().toLowerCase();
      if (usedQuestionKeys.has(key)) {
        continue;
      }

      normalizedQuestions.push(fallbackQuestion);
      usedQuestionKeys.add(key);
      if (normalizedQuestions.length >= questionCount) {
        break;
      }
    }

    if (normalizedQuestions.length < questionCount) {
      console.warn(
        `Only ${normalizedQuestions.length}/${questionCount} questions generated; padding with placeholders.`,
      );
      normalizedQuestions = padQuestionsWithPlaceholders(normalizedQuestions, questionCount);
    }
  }

  return normalizedQuestions.map((question) => ({
    ...question,
    citation:
      question.citation ??
      buildCitationForQuestion({
        courseContent,
        sourceName: options.sourceName,
        question: question.question,
        answer: question.answer,
      }),
  }));
}

export async function generateQuestionsFromUploadedFile(
  file: File,
  options: UploadQuizGenerationOptions = {},
) {
  ensureAcceptedFile(file);
  const extracted = await extractCourseContent(file);
  const minLength =
    extracted.source === "pdf" && extracted.ocrQuality === "low" ? 1 : MIN_CONTENT_LENGTH;
  ensureMinimumContentLength(extracted.content, minLength);
  return generateQuestionsFromCourseContent(
    prepareCourseContentForGeneration(extracted.content),
    {
      ...options,
      sourceName: options.sourceName || file.name || "Uploaded document",
    },
  );
}