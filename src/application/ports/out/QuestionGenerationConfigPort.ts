export interface QuestionGenerationConfigPort {
  /**
   * Get available LLM model names for question generation
   */
  getAvailableModels(): string[];

  /**
   * Get configured temperature for question generation (0-1.2)
   */
  getTemperature(): number;

  /**
   * Get batch token for idempotency
   */
  createBatchToken(): string;
}
