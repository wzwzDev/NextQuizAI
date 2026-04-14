import { strict_output } from "@/server/ai/gpt";

export type TopicQuestionInput = {
  amount: number;
  topic: string;
  type: "open_ended" | "mcq";
};

type OpenEndedQuestion = {
  question: string;
  answer: string;
};

type McqQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

function normalizeTopic(topic: string) {
  const trimmed = topic.trim();
  return trimmed.length > 0 ? trimmed : "General Knowledge";
}

function buildFallbackOpenEndedQuestions(input: TopicQuestionInput): OpenEndedQuestion[] {
  const topic = normalizeTopic(input.topic);

  return Array.from({ length: input.amount }, (_, index) => ({
    question: `Name one key concept in ${topic} (#${index + 1}).`,
    answer: `Concept ${index + 1}`,
  }));
}

function buildFallbackMcqQuestions(input: TopicQuestionInput): McqQuestion[] {
  const topic = normalizeTopic(input.topic);

  return Array.from({ length: input.amount }, (_, index) => {
    const answer = `${topic} principle ${index + 1}`;
    return {
      question: `Which option best relates to ${topic} (#${index + 1})?`,
      answer,
      option1: `${topic} myth ${index + 1}`,
      option2: `${topic} pattern ${index + 1}`,
      option3: `None of the above`,
    };
  });
}

function normalizeOpenEndedQuestions(
  generated: unknown,
  input: TopicQuestionInput,
) {
  const parsed = Array.isArray(generated)
    ? generated
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const candidate = item as { question?: unknown; answer?: unknown };
          if (typeof candidate.question !== "string" || typeof candidate.answer !== "string") {
            return null;
          }

          const question = candidate.question.trim();
          const answer = candidate.answer.trim();

          if (!question || !answer) {
            return null;
          }

          return { question, answer };
        })
        .filter((item): item is OpenEndedQuestion => item !== null)
    : [];

  const fallback = buildFallbackOpenEndedQuestions(input);
  const merged = [...parsed];

  for (const question of fallback) {
    if (merged.length >= input.amount) {
      break;
    }
    merged.push(question);
  }

  return merged.slice(0, input.amount);
}

function normalizeMcqQuestions(generated: unknown, input: TopicQuestionInput) {
  const parsed = Array.isArray(generated)
    ? generated
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const candidate = item as {
            question?: unknown;
            answer?: unknown;
            option1?: unknown;
            option2?: unknown;
            option3?: unknown;
          };

          if (
            typeof candidate.question !== "string" ||
            typeof candidate.answer !== "string" ||
            typeof candidate.option1 !== "string" ||
            typeof candidate.option2 !== "string" ||
            typeof candidate.option3 !== "string"
          ) {
            return null;
          }

          const question = candidate.question.trim();
          const answer = candidate.answer.trim();
          const option1 = candidate.option1.trim();
          const option2 = candidate.option2.trim();
          const option3 = candidate.option3.trim();

          if (!question || !answer || !option1 || !option2 || !option3) {
            return null;
          }

          return { question, answer, option1, option2, option3 };
        })
        .filter((item): item is McqQuestion => item !== null)
    : [];

  const fallback = buildFallbackMcqQuestions(input);
  const merged = [...parsed];

  for (const question of fallback) {
    if (merged.length >= input.amount) {
      break;
    }
    merged.push(question);
  }

  return merged.slice(0, input.amount);
}

export async function generateQuestionsByTopic(input: TopicQuestionInput) {
  if (input.type === "open_ended") {
    try {
      const generated = await strict_output(
        "You are a helpful AI that generates short-answer quiz pairs. Every answer must be an exact, objective target (code output, keyword, syntax token, function name, number, or short phrase). Avoid definition/explanation style questions. Answers must be 1-6 words and never a paragraph.",
        new Array(input.amount).fill(
          `Generate a random hard short-answer question about ${input.topic}. Require an exact concise answer (1-6 words), not a definition.`,
        ),
        {
          question: "question",
          answer: "exact answer with max length of 6 words",
        },
      );

      return normalizeOpenEndedQuestions(generated, input);
    } catch {
      return buildFallbackOpenEndedQuestions(input);
    }
  }

  try {
    const generated = await strict_output(
      `You are a helpful AI that is able to generate ${input.amount} mcq questions and answers about ${input.topic}. The length of each answer should not be more than 15 words. Store all answers and questions and options in a JSON array. IMPORTANT: If any answer, question, or option contains double quotes, you MUST escape them with a backslash (\\") so the JSON is valid.`,
      new Array(input.amount).fill(
        `Generate one random hard mcq question about ${input.topic}.`,
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
        option1: "option1 with max length of 15 words",
        option2: "option2 with max length of 15 words",
        option3: "option3 with max length of 15 words",
      },
    );

    return normalizeMcqQuestions(generated, input);
  } catch {
    return buildFallbackMcqQuestions(input);
  }
}