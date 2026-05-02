import { strict_output } from "@/server/ai/gpt";
import { QuestionGenerationConfigAdapter } from "@/infrastructure/question-generation/QuestionGenerationConfigAdapter";
import { randomInt } from "node:crypto";

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
    const randomIndex = randomInt(0, index + 1);
    const current = cloned[index];
    cloned[index] = cloned[randomIndex];
    cloned[randomIndex] = current;
  }
  return cloned;
}

function buildOpenEndedPrompts(input: TopicQuestionInput, batchToken: string) {
  return Array.from({ length: input.amount }, (_, index) => {
    const isFillBlankMode = index % 2 === 0;
    return [
      `Generate one challenging code-or-script question about ${input.topic}.`,
      `Question position: ${index + 1}/${input.amount}.`,
      `Batch token: ${batchToken}-${index + 1}.`,
      "The question must present a short script, command, code snippet, or console output scenario.",
      isFillBlankMode
        ? "Use fill-in-the-blank mode and include marker [FILL_BLANK] in the question."
        : "Use full-output mode and ask the user to type the full execution result.",
      isFillBlankMode
        ? "The question must contain exactly one visible blank marker: _____."
        : "Do not include blank markers in the question text.",
      "The answer must be the exact execution result, including line breaks when relevant.",
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

  const fallbackPairs = shuffleCopy<OpenEndedQuestion>([
    {
      question:
        "[FILL_BLANK] Complete the blank output.\n\nconsole.log(\"" +
        topic +
        "\".toUpperCase());\nOutput: _____",
      answer: `${topic.toUpperCase()}`,
    },
    {
      question:
        "What does this print?\n\nconsole.log(\"" + topic + " ready\");",
      answer: `${topic} ready`,
    },
    {
      question:
        "[FILL_BLANK] Fill the missing output value.\n\nconst values = [1, 2, 3].map((value) => value * 2);\nconsole.log(values.join(\",\"));\nOutput: _____",
      answer: "2,4,6",
    },
    {
      question:
        "What is the output of this snippet?\n\nfunction greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\nconsole.log(greet(\"" +
        topic +
        "\"));",
      answer: `Hello, ${topic}!`,
    },
    {
      question:
        "What does this program print?\n\nfor (let index = 1; index <= 3; index += 1) {\n  console.log(index);\n}",
      answer: "1\n2\n3",
    },
    {
      question:
        "[FILL_BLANK] Complete the missing output.\n\nconsole.log(JSON.stringify({ topic: \"" +
        topic +
        "\" }));\nOutput: _____",
      answer: `{"topic":"${topic}"}`,
    },
  ]);

  return Array.from({ length: input.amount }, (_, index) => {
    return fallbackPairs[index % fallbackPairs.length];
  });
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
          "You are a helpful AI that generates code-style quiz pairs. Produce a balanced mix of two modes: (1) [FILL_BLANK] questions with exactly one _____ marker, and (2) full-output questions where users type the full execution result. Every question must show a short script, code snippet, or command. The answer must be the exact output of running the code, including line breaks when appropriate. Avoid definitions, explanations, trivia, and paragraph-length answers.",
          buildOpenEndedPrompts(input, batchToken),
          {
            question: "question",
            answer: "exact execution result with line breaks when relevant",
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