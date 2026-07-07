/**
 * API Route: Adjust Questions Difficulty
 * 
 * This is the HTTP layer - it's intentionally thin.
 * All business logic is in the application/infrastructure layers.
 * 
 * Responsibilities:
 * - Auth check (admin only)
 * - Parse and validate HTTP request
 * - Delegate to use case
 * - Format and return HTTP response
 */

import { getAuthSession } from "@/server/core/auth";
import { NextRequest, NextResponse } from "next/server";
import { AdjustQuestionsUseCase } from "@/server/application/use-cases/AdjustQuestionsUseCase";
import { QuestionAdjustmentService } from "@/server/services/question-adjustment/QuestionAdjustmentService";
import { OpenAiLlmAdapter } from "@/infrastructure/llm/OpenAiLlmAdapter";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Auth check
    const session = await getAuthSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = session.user as { email: string; isAdmin?: boolean };
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Access denied: admin only" },
        { status: 403 }
      );
    }

    // Step 2: Parse request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body", details: "Could not parse request body as JSON" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be an object", details: "Request body is empty or not an object" },
        { status: 400 }
      );
    }

    const { questions, difficulty, category, quizType } = body as Record<
      string,
      unknown
    >;

    // Step 2b: Validate required fields
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid questions", details: "Questions must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!difficulty) {
      return NextResponse.json(
        { error: "Invalid difficulty", details: "Difficulty level is required (easy, medium, or hard)" },
        { status: 400 }
      );
    }

    if (!quizType) {
      return NextResponse.json(
        { error: "Invalid quiz type", details: "Quiz type is required (mcq or open_ended)" },
        { status: 400 }
      );
    }

    // Step 3: Instantiate dependency chain
    const llmAdapter = new OpenAiLlmAdapter();
    const questionAdjustmentService = new QuestionAdjustmentService(llmAdapter);
    const useCase = new AdjustQuestionsUseCase(questionAdjustmentService);

    // Step 4: Execute use case
    const result = await useCase.execute({
      questions: questions as Array<{
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
      }>,
      newDifficulty: difficulty as string,
      category: category as string | undefined,
      quizType: quizType as "mcq" | "open_ended",
    });

    console.log("[adjust-questions] Success:", { questionCount: (questions as unknown[]).length, difficulty, result: !!result });

    // Step 5: Return response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[adjust-questions-difficulty] ERROR:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Return detailed error for better debugging
    return NextResponse.json(
      {
        error: "Failed to regenerate questions at new difficulty",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

