import { AdminQuizAttemptRepositoryPort } from "@/application/ports/admin/AdminQuizAttemptRepositoryPort";
import { listUserQuizAttemptsByQuizIds } from "@/server/repositories/userQuizAttemptRepository";

/**
 * Adapter for admin quiz attempt repository operations
 * Wraps the user quiz attempt repository to implement the AdminQuizAttemptRepositoryPort
 */
export class AdminQuizAttemptRepositoryAdapter
  implements AdminQuizAttemptRepositoryPort
{
  async findUserAttemptsByQuizIds(quizIds: string[]) {
    return listUserQuizAttemptsByQuizIds(
      "", // userId not needed for this query in the repository
      quizIds,
    );
  }
}
