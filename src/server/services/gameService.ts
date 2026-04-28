import { StartGameUseCase } from "@/application/use-cases/game/StartGameUseCase";
import { EndGameUseCase } from "@/application/use-cases/game/EndGameUseCase";
import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";
import { PermissionCheckAdapter } from "@/infrastructure/game/PermissionCheckAdapter";
import {
  createQuestionsForGame,
  findGameWithQuestionsById,
} from "@/server/repositories/gameRepository";
import { GameType } from "@prisma/client";

type McqQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

type OpenQuestion = {
  question: string;
  answer: string;
};

const gameRepository = new GameRepositoryAdapter();
const permissionCheck = new PermissionCheckAdapter();
const startGameUseCase = new StartGameUseCase(gameRepository);
const endGameUseCase = new EndGameUseCase(gameRepository, permissionCheck);

export async function createGameWithTopicCount(params: {
  userId: string;
  topic: string;
  type: GameType;
}) {
  return startGameUseCase.execute(params);
}

export async function saveGeneratedQuestionsForGame(params: {
  gameId: string;
  type: GameType;
  questions: Array<McqQuestion | OpenQuestion>;
}) {
  if (params.type === "mcq") {
    const manyData = params.questions.map((question) => {
      const typedQuestion = question as McqQuestion;
      const options = [
        typedQuestion.option1,
        typedQuestion.option2,
        typedQuestion.option3,
        typedQuestion.answer,
      ].sort(() => Math.random() - 0.5);
      return {
        question: typedQuestion.question,
        answer: typedQuestion.answer,
        options: JSON.stringify(options),
        gameId: params.gameId,
        questionType: "mcq" as const,
      };
    });

    await createQuestionsForGame(manyData);
    return;
  }

  const manyData = params.questions.map((question) => {
    const typedQuestion = question as OpenQuestion;
    return {
      question: typedQuestion.question,
      answer: typedQuestion.answer,
      gameId: params.gameId,
      questionType: "open_ended" as const,
    };
  });

  await createQuestionsForGame(manyData);
}

export async function getGameWithQuestions(gameId: string) {
  return findGameWithQuestionsById(gameId);
}

export async function endGame(
  gameId: string,
  requester?: { userId: string; isAdmin?: boolean },
) {
  try {
    await endGameUseCase.execute({
      gameId,
      userId: requester?.userId,
      isAdmin: requester?.isAdmin,
    });
    return { status: 200 as const, body: { message: "Game ended" } };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "GameNotFoundError") {
        return { status: 404 as const, body: { message: "Game not found" } };
      }
      if (error.name === "GameAccessForbiddenError") {
        return { status: 403 as const, body: { message: "Forbidden" } };
      }
    }
    throw error;
  }
}