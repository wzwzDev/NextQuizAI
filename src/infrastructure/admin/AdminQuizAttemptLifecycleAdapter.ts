import type { AdminQuizAttemptLifecyclePort } from "@/application/ports/admin/AdminQuizAttemptLifecyclePort";
import {
  completePendingQuizAttempt,
  ensurePendingQuizAttempt,
} from "@/server/services/userQuizAttemptService";

export class AdminQuizAttemptLifecycleAdapter
  implements AdminQuizAttemptLifecyclePort
{
  async ensurePendingAttempt(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
    allowedAttempts?: number;
  }): Promise<void> {
    await ensurePendingQuizAttempt(input);
  }

  async completePendingAttempt(input: {
    userId: string;
    quizId: string;
    answers: unknown;
    score: number;
  }): Promise<void> {
    await completePendingQuizAttempt(input);
  }
}
