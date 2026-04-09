export * from "@/server/services/gameService";
import {
  createQuestionsForGame,
  createGame,
  findGameById,
  findGameWithQuestionsById,
  markGameEnded,
} from "@/server/repositories/gameRepository";
import { incrementTopicCount } from "@/server/repositories/topicRepository";
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

export async function createGameWithTopicCount(params: {
  userId: string;
  topic: string;
  type: GameType;
}) {
  const game = await createGame({
    userId: params.userId,
    topic: params.topic,
    gameType: params.type,
  });
  await incrementTopicCount(params.topic);
  return game;
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

export async function endGame(gameId: string) {
  const game = await findGameById(gameId);
  if (!game) {
    return { status: 404 as const, body: { message: "Game not found" } };
  }

  await markGameEnded(gameId);
  return { status: 200 as const, body: { message: "Game ended" } };
}