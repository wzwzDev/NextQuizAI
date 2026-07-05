/**
 * Infrastructure Port: LLM Interface
 * 
 * This is the abstraction layer for Large Language Models.
 * It defines the contract that LLM adapters must implement.
 * 
 * This allows the application to be independent of the specific LLM provider.
 * We can swap OpenAI for another provider without changing application code.
 * 
 * This is a key principle of Clean Architecture: Dependency Inversion Principle.
 * High-level modules (application) depend on abstractions (ports),
 * not on low-level modules (concrete LLM implementations).
 */

export interface LlmPort {
  /**
   * Adjust existing questions to a new difficulty level.
   * 
   * @param prompt - The full prompt with questions and difficulty instructions
   * @param expectedQuestionCount - Expected number of questions in response
   * @returns Array of adjusted questions with new question text
   */
  adjustQuestions(
    prompt: string,
    expectedQuestionCount: number
  ): Promise<
    Array<{
      question: string;
      answer: string;
    }>
  >;

  /**
   * Generate multiple choice question options for a specific difficulty.
   * 
   * @param prompt - The prompt with questions and difficulty level
   * @param expectedQuestionCount - Expected number of questions to generate options for
   * @returns Array of option sets for each question
   */
  generateMcqOptions(
    prompt: string,
    expectedQuestionCount: number
  ): Promise<
    Array<{
      questionIndex: number;
      options: string[];
    }>
  >;
}
