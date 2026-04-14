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

const DEFAULT_QUESTION_MODELS = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"];
const DEFAULT_TEMPERATURE = 0.5;

function getQuestionGenerationModels() {
  const fromList = (process.env.OPENAI_QUESTION_MODELS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  const fromSingle = [
    process.env.OPENAI_QUESTION_MODEL?.trim(),
    process.env.OPENAI_MODEL?.trim(),
  ].filter((model): model is string => Boolean(model));

  const merged = [...fromList, ...fromSingle];
  if (merged.length === 0) {
    return DEFAULT_QUESTION_MODELS;
  }

  return Array.from(new Set(merged));
}

function getQuestionGenerationTemperature() {
  const raw = process.env.OPENAI_QUESTION_TEMPERATURE;
  const parsed = raw ? Number(raw) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return DEFAULT_TEMPERATURE;
  }

  return Math.min(1.2, Math.max(0, parsed));
}

function normalizeTopic(topic: string) {
  const trimmed = topic.trim();
  return trimmed.length > 0 ? trimmed : "General Knowledge";
}

function buildFallbackOpenEndedQuestions(input: TopicQuestionInput): OpenEndedQuestion[] {
  const topic = normalizeTopic(input.topic);

  const templates = [
    `What is one important concept in ${topic}?`,
    `Name a commonly used practice in ${topic}.`,
    `What is a key term every beginner should know in ${topic}?`,
    `Identify one core building block of ${topic}.`,
  ];

  return Array.from({ length: input.amount }, (_, index) => ({
    question: templates[index % templates.length],
    answer: `Concept ${index + 1}`,
  }));
}

function buildFallbackMcqQuestions(input: TopicQuestionInput): McqQuestion[] {
  const topic = normalizeTopic(input.topic);

  const templates = [
    `Which statement about ${topic} is generally true?`,
    `Which option is a plausible use case for ${topic}?`,
    `What is most likely associated with ${topic}?`,
    `Which choice best aligns with ${topic} fundamentals?`,
  ];

  return Array.from({ length: input.amount }, (_, index) => {
    const answer = `${topic} is used to solve real-world problems`;
    return {
      question: templates[index % templates.length],
      answer,
      option1: `${topic} cannot be used in practical projects`,
      option2: `${topic} has no rules or conventions`,
      option3: `${topic} is unrelated to problem solving`,
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
  const models = getQuestionGenerationModels();
  const temperature = getQuestionGenerationTemperature();

  if (input.type === "open_ended") {
    let lastError: unknown = null;

    for (const model of models) {
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
          "",
          false,
          model,
          temperature,
        );

        const normalizedQuestions = normalizeOpenEndedQuestions(generated, input);
        if (normalizedQuestions.length === 0) {
          throw new Error("AI returned no open-ended questions.");
        }

        return normalizedQuestions;
      } catch (error) {
        lastError = error;
      }
    }

    console.warn("Question generation fallback activated (open_ended)", {
      topic: input.topic,
      models,
      reason: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return buildFallbackOpenEndedQuestions(input);
  }

  let lastError: unknown = null;

  for (const model of models) {
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
        "",
        false,
        model,
        temperature,
      );

      const normalizedQuestions = normalizeMcqQuestions(generated, input);
      if (normalizedQuestions.length === 0) {
        throw new Error("AI returned no mcq questions.");
      }

      return normalizedQuestions;
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("Question generation fallback activated (mcq)", {
    topic: input.topic,
    models,
    reason: lastError instanceof Error ? lastError.message : String(lastError),
  });

  return buildFallbackMcqQuestions(input);
}