/**
 * Infrastructure Adapter: OpenAI LLM Implementation
 * 
 * This adapter implements the LlmPort interface using OpenAI's API.
 * It handles:
 * - Prompt execution with strict JSON output
 * - Error handling and retries
 * - Response parsing and validation
 * - Rate limiting
 * 
 * This consolidates and improves the duplicate strict_output logic
 * that was previously split between gpt.ts and gptadmin.ts
 */

import { getOpenAIClient } from "@/server/ai/gptadmin";
import { LlmPort } from "@/infrastructure/ports/LlmPort";

export class OpenAiLlmAdapter implements LlmPort {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Execute a prompt with strict JSON output requirement.
   * Handles retries on failure and response validation.
   */
  private async executeWithStrictOutput<T>(
    prompt: string,
    responseFormat: "json_schema" | "json_object" = "json_schema"
  ): Promise<T> {
    const gpt = getOpenAIClient();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= OpenAiLlmAdapter.MAX_RETRIES; attempt++) {
      try {
        const response = await gpt.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: responseFormat },
        });

        if (!response.choices[0]?.message?.content) {
          throw new Error("Empty response from LLM");
        }

        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        return parsed as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a rate limit error
        if (
          lastError.message.includes("429") ||
          lastError.message.includes("rate_limit")
        ) {
          const waitTime = OpenAiLlmAdapter.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await this.sleep(waitTime);
          continue;
        }

        // Check if it's a parsing error
        if (lastError.message.includes("Unexpected token")) {
          if (attempt < OpenAiLlmAdapter.MAX_RETRIES) {
            await this.sleep(OpenAiLlmAdapter.RETRY_DELAY_MS);
            continue;
          }
        }

        // For other errors, throw immediately unless it's the last attempt
        if (attempt === OpenAiLlmAdapter.MAX_RETRIES) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("Failed to execute LLM after all retries");
  }

  /**
   * Adjust existing questions to a new difficulty level.
   */
  async adjustQuestions(
    prompt: string,
    expectedQuestionCount: number
  ): Promise<
    Array<{
      question: string;
      answer: string;
    }>
  > {
    try {
      const response = await this.executeWithStrictOutput<{
        questions: Array<{ question: string; answer: string }>;
      }>(prompt);

      if (
        !response.questions ||
        !Array.isArray(response.questions) ||
        response.questions.length === 0
      ) {
        throw new Error("Invalid response format: missing questions array");
      }

      // Validate we got the expected number of questions
      if (response.questions.length !== expectedQuestionCount) {
        console.warn(
          `Expected ${expectedQuestionCount} questions but got ${response.questions.length}`
        );
      }

      // Validate each question has required fields
      return response.questions.map((q) => {
        if (!q.question || !q.answer) {
          throw new Error("Invalid question format: missing question or answer");
        }
        return {
          question: q.question,
          answer: q.answer,
        };
      });
    } catch (error) {
      throw new Error(
        `Failed to adjust questions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate multiple choice question options.
   */
  async generateMcqOptions(
    prompt: string,
    expectedQuestionCount: number
  ): Promise<
    Array<{
      questionIndex: number;
      options: string[];
    }>
  > {
    try {
      const response = await this.executeWithStrictOutput<{
        options: Array<{ questionIndex: number; options: string[] }>;
      }>(prompt);

      if (!response.options || !Array.isArray(response.options)) {
        throw new Error("Invalid response format: missing options array");
      }

      if (response.options.length !== expectedQuestionCount) {
        console.warn(
          `Expected options for ${expectedQuestionCount} questions but got ${response.options.length}`
        );
      }

      // Validate each option set
      return response.options.map((opt) => {
        if (
          typeof opt.questionIndex !== "number" ||
          !Array.isArray(opt.options) ||
          opt.options.length === 0
        ) {
          throw new Error(
            `Invalid option format: question ${opt.questionIndex}`
          );
        }
        return {
          questionIndex: opt.questionIndex,
          options: opt.options,
        };
      });
    } catch (error) {
      throw new Error(
        `Failed to generate MCQ options: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper: Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
