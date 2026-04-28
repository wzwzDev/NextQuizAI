import type { LlmGatewayPort } from "@/application/ports/out/LlmGatewayPort";
import type { PdfOcrPort } from "@/application/ports/out/PdfOcrPort";

const MAX_CONTENT_CHARS = 16_000;
const FALLBACK_QUESTION_COUNT = 5;
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 15;

export type PdfQuestion = {
  question: string;
  answer: string;
  option1?: string;
  option2?: string;
  option3?: string;
};

export class GenerateQuestionsFromPdfUseCase {
  constructor(
    private pdfOcr: PdfOcrPort,
    private llmGateway: LlmGatewayPort,
  ) {}

  async execute(input: {
    fileData: Buffer;
    questionCount: number;
    type: "mcq" | "open_ended";
  }): Promise<PdfQuestion[]> {
    // Extract text from PDF
    const extractedText = await this.pdfOcr.extractTextFromPdf(input.fileData);

    // Validate OCR quality
    if (!this.pdfOcr.isValidOcrContent(extractedText)) {
      throw new Error("PDF content could not be extracted properly.");
    }

    // Validate question count
    let questionCount = Math.max(
      MIN_QUESTION_COUNT,
      Math.min(MAX_QUESTION_COUNT, input.questionCount),
    );
    if (Number.isNaN(questionCount) || questionCount === 0) {
      questionCount = FALLBACK_QUESTION_COUNT;
    }

    // Truncate content if necessary
    const content = extractedText.slice(0, MAX_CONTENT_CHARS);

    // Generate questions from content
    const outputFormat =
      input.type === "mcq"
        ? {
            questions: [
              {
                question: "string",
                answer: "string",
                option1: "string",
                option2: "string",
                option3: "string",
              },
            ],
          }
        : {
            questions: [
              {
                question: "string",
                answer: "string",
              },
            ],
          };

    const prompt = [
      `You are an expert educator creating ${input.type === "mcq" ? "multiple-choice" : "short-answer"} questions from the provided text.`,
      `Generate exactly ${questionCount} questions based on the following content:`,
      "",
      content,
      "",
      input.type === "mcq"
        ? "For each question, provide 3 incorrect options and 1 correct answer."
        : "For each question, provide a concise answer (1-6 words).",
    ].join("\n");

    const result = (await this.llmGateway.strictOutput(
      "You are an expert educator.",
      prompt,
      outputFormat,
    )) as { questions: PdfQuestion[] };

    return result.questions.slice(0, questionCount);
  }
}
