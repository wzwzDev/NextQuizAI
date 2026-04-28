import { SubmitAndGradeAdminQuizUseCase, AdminQuizNotFoundError, SubmitAdminQuizResult, AdminQuizQuestionResult } from "@/application/use-cases/admin/SubmitAndGradeAdminQuizUseCase";
import { AdminQuizRepositoryAdapter } from "@/infrastructure/admin/AdminQuizRepositoryAdapter";
import { AdminQuizGradingAdapter } from "@/infrastructure/admin/AdminQuizGradingAdapter";

// Export types for backward compatibility
export { AdminQuizNotFoundError, SubmitAdminQuizResult, AdminQuizQuestionResult };
export type AdminQuizGradingMethod = "typo_tolerant" | "exact_match";

const adminQuizRepository = new AdminQuizRepositoryAdapter();
const adminQuizGrading = new AdminQuizGradingAdapter();

const submitAndGradeAdminQuizUseCase = new SubmitAndGradeAdminQuizUseCase(
  adminQuizRepository,
  adminQuizGrading,
);

export async function submitAndGradeAdminQuizAttempt(input: {
  quizId: string;
  userId: string;
  answers: string[];
}): Promise<SubmitAdminQuizResult> {
  return submitAndGradeAdminQuizUseCase.execute(input);
}
