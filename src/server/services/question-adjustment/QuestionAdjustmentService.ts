/**
 * Application Service: Question Adjustment Service
 * 
 * This service handles the business logic of adjusting questions to a new difficulty level.
 * It coordinates between the domain (DifficultyLevel) and infrastructure (LLM).
 * 
 * Responsibilities:
 * - Orchestrate question adjustment process
 * - Build prompts based on difficulty level
 * - Call LLM to regenerate questions and options
 * - Map LLM responses back to domain models
 */

import { randomInt } from "crypto";
import { DifficultyLevel, DifficultyLevelType } from "@/domain/value-objects/DifficultyLevel";
import { LlmPort } from "@/infrastructure/ports/LlmPort";

export interface Question {
  question: string;
  answer: string;
  options?: string[];
  citation?: {
    source: string;
    snippet: string;
    page?: number;
    lineNumber?: number;
    context?: string;
  };
}

export class QuestionAdjustmentService {
  constructor(private readonly llmAdapter: LlmPort) {}

  /**
   * Adjust a list of questions to a new difficulty level.
   * 
   * For MCQ quizzes, regenerates both questions AND options.
   * For open-ended quizzes, only regenerates questions.
   * 
   * @param questions - Original questions with answers
   * @param newDifficulty - Target difficulty level
   * @param category - Quiz category for context
   * @param quizType - Type of quiz (mcq or open_ended)
   * @returns Questions adjusted to new difficulty with preserved citations
   */
  async adjustQuestions(
    questions: Question[],
    newDifficulty: DifficultyLevel,
    category: string | undefined,
    quizType: "mcq" | "open_ended"
  ): Promise<Question[]> {
    // Step 1: Regenerate questions to match new difficulty
    const adjustedQuestions = await this.regenerateQuestions(
      questions,
      newDifficulty,
      category
    );

    // Step 2: For MCQ, also regenerate options
    if (quizType === "mcq") {
      const questionsWithOptions = await this.regenerateMcqOptions(
        adjustedQuestions,
        newDifficulty,
        category
      );
      return questionsWithOptions;
    }

    return adjustedQuestions;
  }

  /**
   * Call LLM to regenerate questions at new difficulty level.
   */
  private async regenerateQuestions(
    questions: Question[],
    difficulty: DifficultyLevel,
    category: string | undefined
  ): Promise<Question[]> {
    const prompt = this.buildQuestionRegenerationPrompt(
      questions,
      difficulty,
      category
    );

    try {
      const llmResponse = await this.llmAdapter.adjustQuestions(
        prompt,
        questions.length
      );

      // Map LLM response back to Question objects, preserving citations
      return llmResponse.map((adjusted, idx) => ({
        question: adjusted.question || questions[idx]?.question || "",
        answer: adjusted.answer || questions[idx]?.answer || "",
        options: questions[idx]?.options, // Preserve original options for now
        citation: questions[idx]?.citation, // Preserve citation
      }));
    } catch (error) {
      // Fallback: Keep original questions, just add a note about difficulty
      // Don't apply transformations - they cause duplication
      console.warn(`LLM failed, keeping original questions: ${error instanceof Error ? error.message : String(error)}`);
      
      return questions.map(q => ({
        question: q.question,
        answer: q.answer,
        options: q.options,
        citation: q.citation,
      }));
    }
  }

  /**
   * Call LLM to generate new MCQ options for adjusted questions.
   */
  private async regenerateMcqOptions(
    questions: Question[],
    difficulty: DifficultyLevel,
    category: string | undefined
  ): Promise<Question[]> {
    const prompt = this.buildOptionsRegenerationPrompt(questions, difficulty, category);

    let llmResponse: Array<{ options?: string[] }> = [];
    
    try {
      llmResponse = await this.llmAdapter.generateMcqOptions(
        prompt,
        questions.length
      );
    } catch (error) {
      console.warn(`LLM generateMcqOptions failed, using fallback options: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with fallback - use original or generic options
      llmResponse = [];
    }

    // Merge new options with questions
    return questions.map((q, idx) => {
      const correctAnswer = q.answer.trim();
      const newOptions = [correctAnswer];

      // Add LLM-generated distractors if available
      if (llmResponse[idx]?.options && Array.isArray(llmResponse[idx].options)) {
        newOptions.push(
          ...llmResponse[idx].options
            .filter((opt: string) => opt.trim().toLowerCase() !== correctAnswer.toLowerCase())
            .slice(0, 3)
        );
      }

      // Fallback: use original options if needed
      if (newOptions.length < 4 && q.options) {
        newOptions.push(
          ...q.options
            .filter(
              (opt: string) =>
                opt.trim().toLowerCase() !== correctAnswer.toLowerCase()
            )
            .slice(0, 4 - newOptions.length)
        );
      }

      // Fallback: generic options
      const fallbackOptions = [
        "None of the above.",
        "All of the above.",
        "Not mentioned in the provided content.",
        "Insufficient information.",
      ];
      for (const fallback of fallbackOptions) {
        if (
          newOptions.length < 4 &&
          !newOptions.some(
            (opt: string) =>
              opt.trim().toLowerCase() === fallback.trim().toLowerCase()
          )
        ) {
          newOptions.push(fallback);
        }
      }

      // Shuffle options (but keep track of correct answer)
      // Use cryptographically secure random for security
      const shuffled = newOptions
        .slice(1)
        .sort(() => randomInt(-1, 2) - 1);
      shuffled.splice(
        randomInt(0, shuffled.length),
        0,
        correctAnswer
      );

      return {
        question: q.question,
        answer: q.answer,
        options: shuffled.slice(0, 4),
        citation: q.citation,
      };
    });
  }

  /**
   * Build the prompt for regenerating questions at a new difficulty level.
   */
  private buildQuestionRegenerationPrompt(
    questions: Question[],
    difficulty: DifficultyLevel,
    category: string | undefined
  ): string {
    const difficultyGuide = this.buildDifficultyGuide(difficulty.level);
    
    return `You are an expert quiz question writer. Your task is to REWRITE existing quiz questions to a DIFFERENT difficulty level.

⚠️ CRITICAL: You MUST ALWAYS change the questions. NEVER return the original questions unchanged. Changing questions is MANDATORY.

Category: ${category || "General"}
Target Difficulty Level: ${difficulty.level.toUpperCase()}

${difficultyGuide}

ORIGINAL QUESTIONS TO REWRITE:
${questions
  .map(
    (q, idx) =>
      `Q${idx + 1}: ${q.question}\nAnswer: ${q.answer}`
  )
  .join("\n\n")}

REQUIREMENTS:
1. REWRITE EVERY question - do NOT keep original wording
2. Adapt questions to be appropriate for ${difficulty.level.toUpperCase()} difficulty level
3. Keep the CORE ANSWER the same (same fact/concept), but adjust how you ask it
4. For ${difficulty.level === "easy" ? "EASY questions: Make them simpler, use basic vocabulary, remove complex concepts" : difficulty.level === "hard" ? "HARD questions: Make them more complex, require deeper thinking, use advanced vocabulary" : "MEDIUM questions: Require understanding and simple connections between concepts"}
5. Change wording significantly - at least 50% different from original
6. Return exactly ${questions.length} questions in JSON format
7. Questions MUST be verifiably different - use different sentence structure, vocabulary, and phrasing

RETURN ONLY valid JSON (no markdown, no code blocks):
{
  "questions": [
    {
      "question": "COMPLETELY REWRITTEN question that is substantially different from the original",
      "answer": "the answer (core fact must be the same, but phrasing can change)"
    }
  ]
}`;
  }

  /**
   * Build specific guidance for each difficulty level with examples.
   */
  private buildDifficultyGuide(level: DifficultyLevelType): string {
    if (level === "easy") {
      return `EASY DIFFICULTY GUIDELINES:
- Use simple, everyday language
- Ask for direct recall or obvious facts
- Questions should be answerable from a single sentence/concept
- Examples:
  * COMPLEX: "What process is responsible for generating ATP?" → SIMPLE: "What is the name of the process that cells use to make energy?"
  * COMPLEX: "Analyze the causality between X and Y" → SIMPLE: "What is X?" or "True or False: X causes Y?"
  * COMPLEX: "Evaluate the implications of..." → SIMPLE: "What happens when..."
- Do NOT use "analyze", "evaluate", "interpret", "compare" - use "define", "list", "identify", "what is"`;
    } else if (level === "hard") {
      return `HARD DIFFICULTY GUIDELINES:
- Use sophisticated, academic language
- Require analysis, synthesis, or application of concepts
- Questions should require understanding relationships or deeper thinking
- Examples:
  * SIMPLE: "What is ATP?" → COMPLEX: "Compare and contrast the efficiency of aerobic and anaerobic ATP production"
  * SIMPLE: "What is X?" → COMPLEX: "How does understanding X help predict Y?"
  * SIMPLE: "Define X" → COMPLEX: "Critically evaluate the relationship between X and Y in the context of Z"
- Use action words like "analyze", "evaluate", "compare", "synthesize", "predict"`;
    } else {
      return `MEDIUM DIFFICULTY GUIDELINES:
- Use clear, professional language with some academic terms
- Require understanding and making simple connections
- Questions should require inference or connecting 2-3 related concepts
- Examples:
  * SIMPLE: "What is X?" → MEDIUM: "Explain how X contributes to Y"
  * SIMPLE: "Define X" → MEDIUM: "What is the relationship between X and Y?"
  * SIMPLE: "True/False" → MEDIUM: "Identify which statement correctly describes X"
- Use action words like "explain", "describe", "distinguish", "identify"`;
    }
  }

  /**
   * Build the prompt for generating MCQ options at a specific difficulty level.
   */
  private buildOptionsRegenerationPrompt(
    questions: Question[],
    difficulty: DifficultyLevel,
    category: string | undefined
  ): string {
    const distractorGuidance = this.buildDistractorGuidance(difficulty.level);

    return `You are an expert quiz generator creating multiple choice question options.

Task: For each question below, generate 3 plausible but INCORRECT options (distractors) that match the difficulty level.

Category: ${category || "General"}
Target Difficulty: ${difficulty.level.toUpperCase()}

${distractorGuidance}

QUESTIONS AND CORRECT ANSWERS:
${questions
  .map(
    (q, idx) =>
      `Q${idx + 1}: ${q.question}\nCorrect Answer: ${q.answer}`
  )
  .join("\n\n")}

REQUIREMENTS:
1. Create 3 plausible but INCORRECT options for each question
2. Distractors should be difficult to distinguish from the correct answer (for ${difficulty.level} level)
3. Options should be realistic and related to the content area
4. Avoid obviously wrong answers - they should be "tempting" but incorrect
5. Return exactly ${questions.length} question option sets

Return ONLY valid JSON (no markdown, no code blocks):
{
  "options": [
    {
      "questionIndex": 0,
      "options": ["plausible wrong option 1", "plausible wrong option 2", "plausible wrong option 3"]
    }
  ]
}`;
  }

  /**
   * Build specific guidance for creating difficulty-appropriate distractors.
   */
  private buildDistractorGuidance(level: DifficultyLevelType): string {
    if (level === "easy") {
      return `EASY LEVEL DISTRACTOR GUIDELINES:
- Distractors should be partially related but clearly wrong
- Use wrong but familiar concepts
- Obvious errors are acceptable
- Examples:
  * Question: "What is H2O?" Distractors: "Carbon dioxide", "Nitrogen", "Oxygen"
  * Question: "Is 2+2=4?" Distractors: "3", "5", "6"
- Make distractors recognizable but obviously incorrect`;
    } else if (level === "hard") {
      return `HARD LEVEL DISTRACTOR GUIDELINES:
- Distractors should be highly plausible and intellectually challenging
- Use sophisticated but incorrect concepts or close answers
- Require deep knowledge to distinguish from correct answer
- Examples:
  * Question: "Compare anaerobic and aerobic respiration"
  * Distractors: "Similar in ATP yield but different in oxygen requirements", "Aerobic produces less ATP because...", "Both occur in mitochondria and..."
- Make distractors very tempting and require careful analysis to eliminate`;
    } else {
      return `MEDIUM LEVEL DISTRACTOR GUIDELINES:
- Distractors should be somewhat plausible but distinguishable with careful thinking
- Mix obvious and tricky wrong answers
- Require understanding but not deep analysis
- Examples:
  * Question: "What role does X play in Y?"
  * Distractors: "Partially correct but incomplete statements", "Related but wrong concepts", "Common misconceptions"
- Balance between "obviously wrong" and "truly confusing"`;
    }
  }
}
