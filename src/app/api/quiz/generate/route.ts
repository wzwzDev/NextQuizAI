/**
 * POST /api/quiz/generate
 * 
 * Purpose: Generate questions from topic
 * Responsibility: SINGLE - Just generate questions
 * 
 * Input: { topic, type, amount }
 * Output: { questions: [] }
 * 
 * Status Codes:
 * - 200: Questions generated
 * - 400: Invalid input or generation failed
 * - 401: Not authenticated
 * - 429: Rate limited
 * - 500: Server error
 */

import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    // Authentication (optional - can generate without account, but recommended)
    // Auth check - requires authenticated user
    await getAuthSession(req);

    // Parse and validate input
    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);

    // Execute: Generate questions
    const questions = await generateQuestionsByTopic({
      amount,
      topic,
      type,
    });

    // Return result
    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 },
      );
    }

    // OpenAI rate limit
    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("429")) {
        return NextResponse.json(
          { error: "Rate limit reached. Please retry in a few seconds." },
          { status: 429 },
        );
      }

      // OpenAI generation failures
      if (error.message.includes("OpenAI")) {
        console.error("OpenAI error:", error.message);
        return NextResponse.json(
          { error: "Failed to generate questions. Please try again." },
          { status: 500 },
        );
      }

      console.error("Generation error:", error.message);
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
