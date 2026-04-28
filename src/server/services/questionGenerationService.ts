import { strict_output } from "@/server/ai/gpt";
import { QuestionGenerationConfigAdapter } from "@/infrastructure/question-generation/QuestionGenerationConfigAdapter";

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

const configAdapter = new QuestionGenerationConfigAdapter();

function getQuestionGenerationModels() {
  return configAdapter.getAvailableModels();
}

function getQuestionGenerationTemperature() {
  return configAdapter.getTemperature();
}

function createBatchToken() {
  return configAdapter.createBatchToken();
}

function shuffleCopy<T>(items: T[]) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = cloned[index];
    cloned[index] = cloned[randomIndex];
    cloned[randomIndex] = current;
  }
  return cloned;
}

function buildOpenEndedPrompts(input: TopicQuestionInput, batchToken: string) {
  return Array.from({ length: input.amount }, (_, index) => {
    return [
      `Generate one challenging short-answer question about ${input.topic}.`,
      `Question position: ${index + 1}/${input.amount}.`,
      `Batch token: ${batchToken}-${index + 1}.`,
      "Answer must be exact and concise (1-6 words).",
      "Avoid broad definitions, trivia clichés, and repeated phrasing.",
      "Each question in this batch must test a different subtopic.",
    ].join(" ");
  });
}

function buildMcqPrompts(input: TopicQuestionInput, batchToken: string) {
  return Array.from({ length: input.amount }, (_, index) => {
    return [
      `Generate one challenging MCQ question about ${input.topic}.`,
      `Question position: ${index + 1}/${input.amount}.`,
      `Batch token: ${batchToken}-${index + 1}.`,
      "Keep the correct answer and all options under 15 words.",
      "Avoid repeated question stems and avoid generic beginner phrasing.",
      "Each question in this batch must cover a distinct concept.",
    ].join(" ");
  });
}

function normalizeTopic(topic: string) {
  const trimmed = topic.trim();
  return trimmed.length > 0 ? trimmed : "General Knowledge";
}

function getOpenEndedQuestionKey(question: OpenEndedQuestion) {
  return `${question.question.toLowerCase()}|${question.answer.toLowerCase()}`;
}

function getMcqQuestionKey(question: McqQuestion) {
  return question.question.toLowerCase();
}

function appendUniqueOpenEndedQuestions(
  target: OpenEndedQuestion[],
  additions: OpenEndedQuestion[],
  seen: Set<string>,
  amount: number,
) {
  for (const question of additions) {
    if (target.length >= amount) {
      break;
    }

    const key = getOpenEndedQuestionKey(question);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    target.push(question);
  }
}

function appendUniqueMcqQuestions(
  target: McqQuestion[],
  additions: McqQuestion[],
  seen: Set<string>,
  amount: number,
) {
  for (const question of additions) {
    if (target.length >= amount) {
      break;
    }

    const key = getMcqQuestionKey(question);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    target.push(question);
  }
}

function fillOpenEndedQuestionsWithFallback(
  collected: OpenEndedQuestion[],
  input: TopicQuestionInput,
  seen: Set<string>,
) {
  const fallback = buildFallbackOpenEndedQuestions(input);

  appendUniqueOpenEndedQuestions(collected, fallback, seen, input.amount);

  // If dedupe prevents reaching the requested amount, allow repeated fallback entries.
  for (const question of fallback) {
    if (collected.length >= input.amount) {
      break;
    }

    collected.push(question);
  }

  return collected.slice(0, input.amount);
}

function fillMcqQuestionsWithFallback(
  collected: McqQuestion[],
  input: TopicQuestionInput,
  seen: Set<string>,
) {
  const fallback = buildFallbackMcqQuestions(input);

  appendUniqueMcqQuestions(collected, fallback, seen, input.amount);

  // If dedupe prevents reaching the requested amount, allow repeated fallback entries.
  for (const question of fallback) {
    if (collected.length >= input.amount) {
      break;
    }

    collected.push(question);
  }

  return collected.slice(0, input.amount);
}

function buildFallbackOpenEndedQuestions(input: TopicQuestionInput): OpenEndedQuestion[] {
  const topic = normalizeTopic(input.topic);

  const templates = shuffleCopy([
    `What is one important concept in ${topic}?`,
    `Name a practical technique used in ${topic}.`,
    `What is a key term every beginner should know in ${topic}?`,
    `Identify one core building block of ${topic}.`,
    `What is one common pitfall to avoid in ${topic}?`,
    `Name one real-world use case of ${topic}.`,
  ]);

  const answers = shuffleCopy([
    `${topic} fundamentals`,
    `${topic} workflow`,
    `${topic} best practice`,
    `${topic} core concept`,
    `${topic} architecture`,
    `${topic} application`,
  ]);

  return Array.from({ length: input.amount }, (_, index) => ({
    question: templates[index % templates.length],
    answer: answers[index % answers.length],
  }));
}

function buildFallbackMcqQuestions(input: TopicQuestionInput): McqQuestion[] {
  const topic = normalizeTopic(input.topic);

  const templates = shuffleCopy([
    `Which statement about ${topic} is generally true?`,
    `Which option is a plausible use case for ${topic}?`,
    `What is most likely associated with ${topic}?`,
    `Which choice best aligns with ${topic} fundamentals?`,
    `Which statement best reflects practical work in ${topic}?`,
    `Which option best matches a valid ${topic} principle?`,
  ]);

  const correctAnswers = shuffleCopy([
    `${topic} supports practical problem solving`,
    `${topic} relies on consistent concepts and patterns`,
    `${topic} has real production use cases`,
    `${topic} benefits from best-practice workflows`,
    `${topic} is useful when applied with clear goals`,
  ]);

  const distractorOption1 = shuffleCopy([
    `${topic} never requires structure or planning`,
    `${topic} cannot be applied in real projects`,
    `${topic} has no practical value`,
    `${topic} works only in theory and not in practice`,
    `${topic} is unrelated to solving real problems`,
  ]);

  const distractorOption2 = shuffleCopy([
    `${topic} has no standards or conventions`,
    `${topic} is always random and unstructured`,
    `${topic} has no repeatable techniques`,
    `${topic} cannot be improved through practice`,
    `${topic} is detached from real-world requirements`,
  ]);

  const distractorOption3 = shuffleCopy([
    `${topic} is useful only without any constraints`,
    `${topic} should ignore reliability and correctness`,
    `${topic} does not involve trade-offs or decisions`,
    `${topic} prevents measurable outcomes`,
    `${topic} cannot be evaluated in real scenarios`,
  ]);

  return Array.from({ length: input.amount }, (_, index) => {
    const answer = correctAnswers[index % correctAnswers.length];
    return {
      question: templates[index % templates.length],
      answer,
      option1: distractorOption1[index % distractorOption1.length],
      option2: distractorOption2[index % distractorOption2.length],
      option3: distractorOption3[index % distractorOption3.length],
    };
  });
}

function normalizeOpenEndedQuestions(generated: unknown) {
  const seen = new Set<string>();
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
        .filter((item): item is OpenEndedQuestion => {
          if (!item) {
            return false;
          }

          const key = getOpenEndedQuestionKey(item);
          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        })
    : [];

  return parsed;
}

function normalizeMcqQuestions(generated: unknown) {
  const seenQuestions = new Set<string>();
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
        .filter((item): item is McqQuestion => {
          if (!item) {
            return false;
          }

          const key = getMcqQuestionKey(item);
          if (seenQuestions.has(key)) {
            return false;
          }

          seenQuestions.add(key);
          return true;
        })
    : [];

  return parsed;
}

export async function generateQuestionsByTopic(input: TopicQuestionInput) {
  const models = getQuestionGenerationModels();
  const temperature = getQuestionGenerationTemperature();
  const batchToken = createBatchToken();

  if (input.type === "open_ended") {
    let lastError: unknown = null;
    const collectedQuestions: OpenEndedQuestion[] = [];
    const seenQuestions = new Set<string>();

    for (const model of models) {
      try {
        const generated = await strict_output(
          "You are a helpful AI that generates short-answer quiz pairs. Every answer must be an exact, objective target (code output, keyword, syntax token, function name, number, or short phrase). Avoid definition/explanation style questions. Answers must be 1-6 words and never a paragraph.",
          buildOpenEndedPrompts(input, batchToken),
          {
            question: "question",
            answer: "exact answer with max length of 6 words",
          },
          "",
          false,
          model,
          temperature,
        );

        const normalizedQuestions = normalizeOpenEndedQuestions(generated);
        appendUniqueOpenEndedQuestions(
          collectedQuestions,
          normalizedQuestions,
          seenQuestions,
          input.amount,
        );

        if (collectedQuestions.length >= input.amount) {
          return collectedQuestions.slice(0, input.amount);
        }

        if (normalizedQuestions.length === 0) {
          lastError = new Error(
            `Model ${model} returned no valid open-ended questions.`,
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    console.warn("Question generation fallback activated (open_ended)", {
      topic: input.topic,
      models,
      reason:
        lastError instanceof Error
          ? lastError.message
          : lastError
            ? String(lastError)
            : "All models returned insufficient valid open-ended questions.",
    });

    return fillOpenEndedQuestionsWithFallback(
      collectedQuestions,
      input,
      seenQuestions,
    );
  }

  let lastError: unknown = null;
  const collectedQuestions: McqQuestion[] = [];
  const seenQuestions = new Set<string>();

  for (const model of models) {
    try {
      const generated = await strict_output(
        `You are a helpful AI that is able to generate ${input.amount} mcq questions and answers about ${input.topic}. The length of each answer should not be more than 15 words. Store all answers and questions and options in a JSON array. IMPORTANT: If any answer, question, or option contains double quotes, you MUST escape them with a backslash (\\") so the JSON is valid.`,
        buildMcqPrompts(input, batchToken),
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

      const normalizedQuestions = normalizeMcqQuestions(generated);
      appendUniqueMcqQuestions(
        collectedQuestions,
        normalizedQuestions,
        seenQuestions,
        input.amount,
      );

      if (collectedQuestions.length >= input.amount) {
        return collectedQuestions.slice(0, input.amount);
      }

      if (normalizedQuestions.length === 0) {
        lastError = new Error(`Model ${model} returned no valid mcq questions.`);
      }
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("Question generation fallback activated (mcq)", {
    topic: input.topic,
    models,
    reason:
      lastError instanceof Error
        ? lastError.message
        : lastError
          ? String(lastError)
          : "All models returned insufficient valid mcq questions.",
  });

  return fillMcqQuestionsWithFallback(collectedQuestions, input, seenQuestions);
}