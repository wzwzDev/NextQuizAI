import type { PdfOcrPort } from "@/application/ports/out/PdfOcrPort";
import { getOpenAIClient } from "@/server/ai/openaiClient";

const MIN_OCR_WORD_COUNT = 6;
const MIN_OCR_ALPHA_WORD_RATIO = 0.45;
const MIN_OCR_CHAR_COUNT = 80;
const MIN_OCR_UNIQUE_ALPHA_WORDS = 8;
const DEFAULT_PDF_OCR_MODEL = process.env.OPENAI_PDF_OCR_MODEL?.trim() || "gpt-4o-mini";
const DEFAULT_OCR_MODEL_CANDIDATES = [
  DEFAULT_PDF_OCR_MODEL,
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-4.1",
];

export class PdfOcrAdapter implements PdfOcrPort {
  getOcrModel(): string {
    return DEFAULT_PDF_OCR_MODEL;
  }

  async extractTextFromPdf(fileData: Buffer): Promise<string> {
    const client = getOpenAIClient();
    const base64Data = fileData.toString("base64");

    const response = await client.messages.create({
      model: this.getOcrModel(),
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Extract all text content from this PDF document. Return only the extracted text, no additional commentary.",
            },
          ],
        },
      ],
    } as Parameters<typeof client.messages.create>[0]);

    const textContent = response.content.find((block) => block.type === "text");
    return textContent && "text" in textContent ? textContent.text : "";
  }

  isValidOcrContent(text: string): boolean {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length < MIN_OCR_WORD_COUNT) {
      return false;
    }

    if (text.length < MIN_OCR_CHAR_COUNT) {
      return false;
    }

    const alphaWords = words.filter((w) => /^[a-z]+$/.test(w));
    if (alphaWords.length < words.length * MIN_OCR_ALPHA_WORD_RATIO) {
      return false;
    }

    const uniqueAlphaWords = new Set(alphaWords).size;
    if (uniqueAlphaWords < MIN_OCR_UNIQUE_ALPHA_WORDS) {
      return false;
    }

    return true;
  }
}
