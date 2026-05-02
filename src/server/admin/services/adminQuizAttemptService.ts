import { SubmitAndGradeAdminQuizUseCase, AdminQuizNotFoundError, SubmitAdminQuizResult, AdminQuizQuestionResult } from "@/application/use-cases/admin/SubmitAndGradeAdminQuizUseCase";
import { AdminQuizRepositoryAdapter } from "@/infrastructure/admin/AdminQuizRepositoryAdapter";
import { AdminQuizGradingAdapter } from "@/infrastructure/admin/AdminQuizGradingAdapter";
import { AdminQuizAttemptLifecycleAdapter } from "@/infrastructure/admin/AdminQuizAttemptLifecycleAdapter";
import { AdminQuizQuestionMetadataAdapter } from "@/infrastructure/admin/AdminQuizQuestionMetadataAdapter";

// Export types and values for backward compatibility
export { AdminQuizNotFoundError };
export type { SubmitAdminQuizResult, AdminQuizQuestionResult };
export type AdminQuizGradingMethod = "typo_tolerant" | "exact_match";

const adminQuizRepository = new AdminQuizRepositoryAdapter();
const adminQuizGrading = new AdminQuizGradingAdapter();
const quizAttemptLifecycle = new AdminQuizAttemptLifecycleAdapter();
const questionMetadata = new AdminQuizQuestionMetadataAdapter();

const submitAndGradeAdminQuizUseCase = new SubmitAndGradeAdminQuizUseCase(
  adminQuizRepository,
  adminQuizGrading,
  quizAttemptLifecycle,
  questionMetadata,
);

export async function submitAndGradeAdminQuizAttempt(input: {
  quizId: string;
  userId: string;
  answers: string[];
}): Promise<SubmitAdminQuizResult> {
  return submitAndGradeAdminQuizUseCase.execute(input);
}
