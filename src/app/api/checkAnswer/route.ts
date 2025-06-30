import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import stringSimilarity from "string-similarity";

export async function POST(req: Request, res: Response) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { message: "Invalid JSON" },
      { status: 500 }
    );
  }

  // Check for missing or empty userInput
  if (!body.userInput || body.userInput.trim() === "") {
    return NextResponse.json(
      { message: "userInput is required" },
      { status: 400 }
    );
  }

  try {
    const { questionId, userInput } = checkAnswerSchema.parse(body);
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { userAnswer: userInput },
    });

    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
      await prisma.question.update({
        where: { id: questionId },
        data: { isCorrect },
      });
      return NextResponse.json({ isCorrect });
    } else if (question.questionType === "open_ended") {
      let percentageSimilar = stringSimilarity.compareTwoStrings(
        question.answer.toLowerCase().trim(),
        userInput.toLowerCase().trim()
      );
      // Set a threshold (e.g., 0.8 = 80%)
      const threshold = 0.8;
      if (percentageSimilar < threshold) {
        percentageSimilar = 0;
      } else {
        percentageSimilar = Math.round(percentageSimilar * 100);
      }
      await prisma.question.update({
        where: { id: questionId },
        data: { percentageCorrect: percentageSimilar },
      });
      return NextResponse.json({ percentageSimilar });
    }
    // If questionType is not recognized
    return NextResponse.json(
      { message: "Invalid question type" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues },
        { status: 400 }
      );
    }
    // Catch-all for unexpected errors
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}