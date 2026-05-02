import * as adminQuizServiceWrapper from "@/server/services/adminQuizService";
import * as adminQuizAttemptServiceWrapper from "@/server/services/adminQuizAttemptService";
import * as adminQuizRepositoryWrapper from "@/server/repositories/adminQuizRepository";

describe("server wrapper re-exports", () => {
  it("re-exports admin quiz service API", () => {
    expect(typeof adminQuizServiceWrapper.getAdminQuizzes).toBe("function");
    expect(typeof adminQuizServiceWrapper.getQuizStatisticsSummary).toBe("function");
  });

  it("re-exports admin quiz attempt service API", () => {
    expect(typeof adminQuizAttemptServiceWrapper.submitAndGradeAdminQuizAttempt).toBe(
      "function",
    );
  });

  it("re-exports admin quiz repository API", () => {
    expect(typeof adminQuizRepositoryWrapper.findAdminQuizzes).toBe("function");
    expect(typeof adminQuizRepositoryWrapper.findApprovedQuizById).toBe("function");
  });
});
