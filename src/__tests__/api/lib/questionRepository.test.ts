jest.mock("@/server/core/db", () => ({
  prisma: {
    question: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import {
  findQuestionById,
  saveMcqResult,
  saveOpenEndedResult,
  saveUserAnswer,
} from "@/server/repositories/questionRepository";
import { prisma } from "@/server/core/db";

describe("questionRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("finds question by id", async () => {
    await findQuestionById("q1");
    expect(prisma.question.findUnique).toHaveBeenCalledWith({ where: { id: "q1" } });
  });

  it("saves user answer", async () => {
    await saveUserAnswer("q1", "Paris");
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { userAnswer: "Paris" },
    });
  });

  it("saves mcq result", async () => {
    await saveMcqResult("q1", true);
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { isCorrect: true },
    });
  });

  it("saves open-ended result", async () => {
    await saveOpenEndedResult("q1", 88);
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { percentageCorrect: 88 },
    });
  });
});