import { z } from "zod";

export const getQuestionsSchema = z.object({
  topic: z.string(),
  amount: z.number().int().positive().min(1).max(10),
  type: z.enum(["mcq", "open_ended"]),
});

export const checkAnswerSchema = z.object({
  userInput: z.string(),
  questionId: z.string(),
});

export const submitAdminQuizAttemptSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.string()),
});

export const saveUserQuizAttemptSchema = z.object({
  quizId: z.string().min(1),
  quizTitle: z.string().min(1),
  answers: z.unknown(),
  score: z.number().min(0).max(100),
});

export const endGameSchema = z.object({
  gameId: z.string(),
});
