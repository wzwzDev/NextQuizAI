export interface PdfOcrPort {
  /**
   * Extract text from PDF file using OCR
   * @param fileData Raw PDF file bytes
   * @returns Extracted text content
   */
  extractTextFromPdf(fileData: Buffer): Promise<string>;

  /**
   * Validate extracted OCR content quality
   * @param text Extracted text to validate
   * @returns True if content meets quality standards
   */
  isValidOcrContent(text: string): boolean;

  /**
   * Get configured PDF OCR model name
   */
  getOcrModel(): string;
}
