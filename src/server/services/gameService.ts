import { StartGameUseCase } from "@/application/use-cases/game/StartGameUseCase";
import { EndGameUseCase } from "@/application/use-cases/game/EndGameUseCase";
import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";
import { PermissionCheckAdapter } from "@/infrastructure/game/PermissionCheckAdapter";
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

const MAX_DB_STRING_LENGTH = 180;

function fitDbString(value: string) {
  return value.trim().slice(0, MAX_DB_STRING_LENGTH);
}

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
      const safeQuestion = fitDbString(typedQuestion.question);
      const safeAnswer = fitDbString(typedQuestion.answer);
      const safeOption1 = fitDbString(typedQuestion.option1);
      const safeOption2 = fitDbString(typedQuestion.option2);
      const safeOption3 = fitDbString(typedQuestion.option3);
      const options = [
        safeOption1,
        safeOption2,
        safeOption3,
        safeAnswer,
      ].sort(() => Math.random() - 0.5);
      return {
        question: safeQuestion,
        answer: safeAnswer,
        options: JSON.stringify(options),
        gameId: params.gameId,
        questionType: "mcq" as const,
      };
    });

    await gameRepository.createQuestionsForGame(manyData);
    return;
  }

  const manyData = params.questions.map((question) => {
    const typedQuestion = question as OpenQuestion;
    return {
      question: fitDbString(typedQuestion.question),
      answer: fitDbString(typedQuestion.answer),
      gameId: params.gameId,
      questionType: "open_ended" as const,
    };
  });

  await gameRepository.createQuestionsForGame(manyData);
}

export async function getGameWithQuestions(gameId: string) {
  return gameRepository.findGameWithQuestionsById(gameId);
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