import { strict_output } from "@/server/ai/gpt";
import { QuestionGenerationConfigAdapter } from "@/infrastructure/question-generation/QuestionGenerationConfigAdapter";
import { randomInt } from "node:crypto";

export type TopicQuestionInput = {
  amount: number;
  topic: string;
  type: "open_ended" | "mcq";
  difficulty?: "easy" | "medium" | "hard";
};

type OpenEndedQuestionKind = "code" | "general";
type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";

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

function getOpenEndedQuestionPlan(amount: number): OpenEndedQuestionKind[] {
  const codeQuestionCount = Math.max(0, Math.floor(amount / 2));
  const generalQuestionCount = Math.max(0, amount - codeQuestionCount);

  return [
    ...Array.from({ length: codeQuestionCount }, () => "code" as const),
    ...Array.from({ length: generalQuestionCount }, () => "general" as const),
  ];
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

function normalizeDifficultyLevel(value?: string): DifficultyLevel {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }
  return "mixed";
}

function getDifficultyInstructions(level: DifficultyLevel) {
  switch (level) {
    case "easy":
      return [
        "Prefer direct recall questions from clearly stated facts.",
        "Use very simple wording and avoid comparisons or multi-step reasoning.",
        "Keep answers extremely short, ideally 1 to 3 words.",
        "Ask for obvious terms, names, values, labels, or literal facts directly present in the topic.",
      ].join(" ");
    case "medium":
      return [
        "Mix direct recall with light inference or comparison.",
        "Questions should require connecting two nearby ideas.",
        "Keep answers concise, usually 2 to 5 words, and avoid obvious one-word clues.",
      ].join(" ");
    case "hard":
      return [
        "Prefer questions that require multi-step reasoning and synthesis.",
        "Ask for relationships, implications, distinctions, or combined concepts.",
        "Use less obvious wording than easy or medium questions.",
        "Keep the answer concise, usually 3 to 6 words, and make it depend on deeper synthesis.",
      ].join(" ");
    default:
      return [
        "Balance direct recall and light inference based on the topic.",
        "Aim for a mixed difficulty set when no specific level is selected.",
      ].join(" ");
  }
}

function buildOpenEndedPrompts(input: TopicQuestionInput, batchToken: string) {
  const questionPlan = getOpenEndedQuestionPlan(input.amount);
  const difficulty = normalizeDifficultyLevel(input.difficulty);
  const difficultyInstructions = getDifficultyInstructions(difficulty);

  return questionPlan.map((kind, index) => {
    const position = index + 1;
    const isCodeQuestion = kind === "code";
    const codeIndex = questionPlan.slice(0, index).filter((item) => item === "code").length;
    const useFillBlankMode = isCodeQuestion ? codeIndex % 2 === 0 : false;

    return [
      isCodeQuestion
        ? `Generate one code-style question about ${input.topic}.`
        : `Generate one general knowledge question about ${input.topic}.`,
      `Question position: ${position}/${input.amount}.`,
      `Batch token: ${batchToken}-${position}.`,
      `Difficulty target: ${difficulty}`,
      `Difficulty requirements: ${difficultyInstructions}`,
      isCodeQuestion
        ? "The question must present a COMPLETE, READY-TO-RUN code snippet with concrete input values included. Show the code as-is without asking the user to write or modify it."
        : "The question must be about the topic itself, not a code snippet or execution output.",
      getCodeModeInstructions(isCodeQuestion, useFillBlankMode),
      getCodeStructureInstructions(isCodeQuestion, useFillBlankMode),
      isCodeQuestion
        ? "The answer must be the exact execution result or output, including line breaks when relevant. NEVER ask the user to implement anything."
        : "The answer must be short, accurate, and directly about the topic.",
      "Avoid repeated phrasing.",
      "Each question in this batch must test a different subtopic.",
      "Make the difference between easy, medium, and hard clearly noticeable in the wording and reasoning required.",
    ].join(" ");
  });
}

function buildMcqPrompts(input: TopicQuestionInput, batchToken: string) {
  const focusAreas = buildMcqFocusAreas(input.topic, input.amount);
  const difficulty = normalizeDifficultyLevel(input.difficulty);
  const difficultyInstructions = getDifficultyInstructions(difficulty);

  return Array.from({ length: input.amount }, (_, index) => {
    const focusArea = focusAreas[index];

    return [
      `Generate one MCQ question about ${input.topic}.`,
      `Question position: ${index + 1}/${input.amount}.`,
      `Batch token: ${batchToken}-${index + 1}.`,
      `Focus area: ${focusArea}.`,
      `Difficulty target: ${difficulty}`,
      `Difficulty requirements: ${difficultyInstructions}`,
      "Keep the correct answer and all options under 15 words.",
      "Avoid repeated question stems and avoid generic beginner phrasing.",
      "Each question in this batch must cover a distinct concept.",
      "Do not use generic framing like 'associated with' or 'generally true' unless it is clearly topic-specific.",
      "Make easy questions direct, medium questions slightly inferential, and hard questions require broader synthesis.",
    ].join(" ");
  });
}

function normalizeTopic(topic: string) {
  const trimmed = topic.trim();
  return trimmed.length > 0 ? trimmed : "General Knowledge";
}

function isProgrammingTopic(topic: string) {
  return /\b(java|javascript|typescript|python|react|node|sql|html|css|c\+\+|c#|rust|go|kotlin|swift|php|ruby|dart|scala|vue|angular|git|docker|linux|api|database|mongodb|postgres|mysql)\b/i.test(
    topic,
  );
}

function buildMcqFocusAreas(topic: string, amount: number) {
  const normalizedTopic = normalizeTopic(topic);
  const topicKey = normalizedTopic.toLowerCase();

  const focusAreas = isProgrammingTopic(topicKey)
    ? [
        `${normalizedTopic} syntax`,
        `${normalizedTopic} runtime behavior`,
        `${normalizedTopic} type system`,
        `${normalizedTopic} packages or modules`,
        `${normalizedTopic} functions or methods`,
        `${normalizedTopic} error handling`,
        `${normalizedTopic} data structures`,
        `${normalizedTopic} best practices`,
      ]
    : [
        `${normalizedTopic} definition`,
        `${normalizedTopic} purpose`,
        `${normalizedTopic} common use cases`,
        `${normalizedTopic} key features`,
        `${normalizedTopic} comparisons`,
        `${normalizedTopic} practical examples`,
        `${normalizedTopic} common mistakes`,
        `${normalizedTopic} best practices`,
      ];

  return Array.from({ length: amount }, (_, index) => focusAreas[index % focusAreas.length]);
}

function buildMcqQuestionStem(topic: string, focusArea: string, index: number) {
  const variants = [
    `Which statement best describes ${focusArea}?`,
    `Which option is most accurate about ${focusArea}?`,
    `In ${topic}, what is the role of ${focusArea}?`,
    `Which choice best matches ${focusArea}?`,
    `What is the main purpose of ${focusArea}?`,
    `Which answer best describes how ${focusArea} works?`,
    `Which statement about ${focusArea} is correct?`,
    `Which option best fits ${focusArea}?`,
  ];

  return variants[index % variants.length];
}

function buildMcqCorrectAnswer(topic: string, focusArea: string) {
  const normalizedFocus = focusArea.toLowerCase();

  if (normalizedFocus.includes("syntax")) {
    return `${topic} syntax defines how code is written`;
  }

  if (normalizedFocus.includes("runtime behavior")) {
    return `${topic} runtime behavior describes what happens when code runs`;
  }

  if (normalizedFocus.includes("type system")) {
    return `${topic} uses types to represent and validate values`;
  }

  if (normalizedFocus.includes("packages or modules")) {
    return `${topic} packages or modules organize reusable code`;
  }

  if (normalizedFocus.includes("functions or methods")) {
    return `${topic} functions or methods encapsulate reusable logic`;
  }

  if (normalizedFocus.includes("error handling")) {
    return `${topic} error handling helps manage failures safely`;
  }

  if (normalizedFocus.includes("data structures")) {
    return `${topic} data structures store and organize information`;
  }

  if (normalizedFocus.includes("best practices")) {
    return `${topic} best practices improve readability and maintainability`;
  }

  if (normalizedFocus.includes("definition")) {
    return `${topic} is a foundational concept in the subject area`;
  }

  if (normalizedFocus.includes("purpose")) {
    return `${topic} helps solve related practical problems`;
  }

  if (normalizedFocus.includes("common use cases")) {
    return `${topic} is often used in real-world applications`;
  }

  if (normalizedFocus.includes("key features")) {
    return `${topic} has distinguishing characteristics that matter`;
  }

  if (normalizedFocus.includes("comparisons")) {
    return `${topic} differs from related topics in important ways`;
  }

  if (normalizedFocus.includes("practical examples")) {
    return `${topic} can be applied in practical scenarios`;
  }

  if (normalizedFocus.includes("common mistakes")) {
    return `${topic} is often confused with similar ideas`;
  }

  return `${topic} is best understood through its practical use`;
}

function buildMcqDistractors(topic: string, focusArea: string) {
  const normalizedTopic = normalizeTopic(topic);
  const normalizedFocus = focusArea.toLowerCase();
  const normalizedTopicKey = normalizedTopic.toLowerCase();
  const shortFocus = normalizedFocus.startsWith(normalizedTopicKey)
    ? normalizedFocus.slice(normalizedTopicKey.length).trim()
    : normalizedFocus;

  const distractors = [
    `${normalizedTopic} ignores ${shortFocus} entirely`,
    `${normalizedTopic} makes ${shortFocus} unnecessary`,
    `${normalizedTopic} treats ${shortFocus} as random`,
    `${normalizedTopic} uses ${shortFocus} only after completion`,
    `${normalizedTopic} never applies ${shortFocus} in practice`,
    `The correct idea is unrelated to ${normalizedTopic}`,
  ];

  return shuffleCopy(distractors).slice(0, 3);
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

function buildDifficultyAwareFallbackOpenEndedQuestion(
  topic: string,
  kind: OpenEndedQuestionKind,
  codeIndex: number,
  difficulty: DifficultyLevel,
): OpenEndedQuestion {
  if (kind === "code") {
    if (difficulty === "hard") {
      const outputs = [`[FILL_BLANK] Advanced: What does this async code output?\n\nasync function process(val) {\n  return (val * 2).toString();\n}\nOutput: _____`, `[FILL_BLANK] Complex: Trace this execution.\n\nconst arr = [1, 2, 3];\nconst result = arr.map(x => x * x).filter(x => x > 4);\nconsole.log(result.join(","));\nOutput: _____`];
      const index = codeIndex % outputs.length;
      return { question: outputs[index], answer: index === 0 ? "function() {}" : "9,16" };
    } else if (difficulty === "medium") {
      const outputs = [`[FILL_BLANK] What is the output?\n\nconsole.log([1, 2, 3].map(x => x + 1).join("-"));\nOutput: _____`, `[FILL_BLANK] Complete the output.\n\nconst x = { a: 1, b: 2 };\nconsole.log(Object.keys(x).length);\nOutput: _____`];
      const index = codeIndex % outputs.length;
      return { question: outputs[index], answer: index === 0 ? "2-3-4" : "2" };
    }
    const outputs = [`[FILL_BLANK] Basic: What is the output?\n\nconsole.log(5 + 3);\nOutput: _____`, `[FILL_BLANK] Simple: What is printed?\n\nconsole.log("${topic}");\nOutput: _____`];
    const index = codeIndex % outputs.length;
    return { question: outputs[index], answer: index === 0 ? "8" : topic };
  }
  if (difficulty === "hard") {
    return {
      question: `Based on your understanding of ${topic}, what relationship exists between two of its key aspects?`,
      answer: `${topic} integrates multiple concepts coherently`,
    };
  } else if (difficulty === "medium") {
    return {
      question: `What is an important characteristic or rule in ${topic}?`,
      answer: `${topic} follows consistent principles`,
    };
  }
  return {
    question: `What is ${topic} primarily used for?`,
    answer: `${topic} solves practical problems`,
  };
}

function buildFallbackOpenEndedQuestions(input: TopicQuestionInput): OpenEndedQuestion[] {
  const topic = normalizeTopic(input.topic);
  const questionPlan = getOpenEndedQuestionPlan(input.amount);
  const difficulty = normalizeDifficultyLevel(input.difficulty);

  const result: OpenEndedQuestion[] = [];
  let codeCounter = 0;

  for (const kind of questionPlan) {
    if (kind === "code") {
      result.push(buildDifficultyAwareFallbackOpenEndedQuestion(topic, kind, codeCounter, difficulty));
      codeCounter += 1;
    } else {
      result.push(buildDifficultyAwareFallbackOpenEndedQuestion(topic, kind, 0, difficulty));
    }
  }

  return result;
}

function buildFallbackMcqQuestions(input: TopicQuestionInput): McqQuestion[] {
  const topic = normalizeTopic(input.topic);
  const focusAreas = buildMcqFocusAreas(topic, input.amount);
  const difficulty = normalizeDifficultyLevel(input.difficulty);

  return Array.from({ length: input.amount }, (_, index) => {
    const focusArea = focusAreas[index];
    let answer = buildMcqCorrectAnswer(topic, focusArea);
    
    if (difficulty === "easy") {
      answer = `${topic} directly addresses ${focusArea}`;
    } else if (difficulty === "hard") {
      answer = `The synthesis of ${topic} concepts shows ${focusArea} is central`;
    }
    
    const [option1, option2, option3] = buildMcqDistractors(topic, focusArea);

    return {
      question: buildMcqQuestionStem(topic, focusArea, index),
      answer,
      option1,
      option2,
      option3,
    };
  });
}

function isCodeLikeContent(text: string): boolean {
  const codePatterns = /\b(function|const|let|var|return|if|else|for|while|switch|class|async|await|import|export|console\.log|=>|[{}\[\]();])\b/i;
  const hasCodeKeywords = codePatterns.test(text);
  const hasMultipleLines = text.includes('\n');
  const hasCodeSymbols = /[{}[\]()=>:;]/.test(text);
  const startsWithBackticks = text.trim().startsWith('```');
  
  return hasCodeKeywords || (hasMultipleLines && hasCodeSymbols) || startsWithBackticks;
}

function ensureCodeQuestionWrapper(question: string, answer: string): OpenEndedQuestion {
  const hasWrapper = /\[fill_blank\]|output:\s*_{3,}/i.test(question);
  
  if (hasWrapper) {
    return { question, answer };
  }
  
  // Auto-wrap code questions that don't have wrapper format
  if (isCodeLikeContent(question)) {
    const normalized = question.replaceAll('\r\n', '\n').trim();
    const alreadyHasOutput = /output:\s*_+/i.test(normalized);
    
    if (!alreadyHasOutput) {
      return {
        question: `[FILL_BLANK] Complete the missing output.\n\n${normalized}\nOutput: _____`,
        answer: answer.trim(),
      };
    }
  }
  
  return { question, answer };
}

function isFillBlankOutputQuestion(question: string) {
  return /\[fill_blank\]|output:\s*_{3,}/i.test(question);
}

function hasConcreteExecutionStep(question: string) {
  // Direct output instructions across common languages
  if (/(console\.log|print\(|system\.out\.println|fmt\.println|echo\s)/i.test(question)) {
    return true;
  }

  // Concrete invocation with literal-like arguments (not a function definition)
  return /(?:^|\n)\s*(?!def\s|function\s)[a-zA-Z_]\w*\s*\(\s*[^)]*(?:\d|["'`]|true|false|\[|\{)[^)]*\)\s*;?/im.test(
    question,
  );
}

function isAmbiguousFillBlankQuestion(question: string) {
  if (!isFillBlankOutputQuestion(question)) {
    return false;
  }

  // Reject ANY pattern that asks user to write/implement code - even with execution step
  const asksToWrite = /\b(write|create|define|implement)\b/i.test(question);
  const asksAboutFunction = /\bfunction\b/i.test(question);
  
  if (asksToWrite && asksAboutFunction) {
    return true;
  }

  // Also reject any fill-blank output prompt that lacks an executable step.
  return !hasConcreteExecutionStep(question);
}

function isAmbiguousCodeExecutionQuestion(question: string) {
  if (!isCodeLikeContent(question)) {
    return false;
  }

  const asksToWriteFunction = /\b(write|create|define|implement)\b[^.\n]*\bfunction\b/i.test(
    question,
  );

  return asksToWriteFunction && !hasConcreteExecutionStep(question);
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

          // Auto-normalize code questions into wrapper format if needed
          const normalized = isCodeLikeContent(question) 
            ? ensureCodeQuestionWrapper(question, answer)
            : { question, answer };

          if (
            isAmbiguousFillBlankQuestion(normalized.question) ||
            isAmbiguousCodeExecutionQuestion(normalized.question)
          ) {
            return null;
          }

          return normalized;
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

// Helper function to get code mode instructions
function getCodeModeInstructions(
  isCode: boolean,
  useFillBlankMode: boolean,
): string {
  if (!isCode) {
    return "Ask for a concise factual answer, definition, or concept-level explanation in 1 to 8 words.";
  }
  if (useFillBlankMode) {
    return "IMPORTANT: Present COMPLETE, READY-TO-RUN code with concrete literal input values already included. The user must ONLY identify/type the exact output—NEVER ask them to write, implement, define, or create any code. The code snippet is a gift; they just predict what it outputs.";
  }
  return "Use full-output mode and ask the user to type the full execution result. Include concrete input values and an executable snippet that produces a single deterministic output.";
}

// Helper function to get code structure instructions
function getCodeStructureInstructions(
  isCode: boolean,
  useFillBlankMode: boolean,
): string {
  if (!isCode) {
    return "Do not ask the user to run or inspect code.";
  }
  if (useFillBlankMode) {
    return "Structure MUST be: [FILL_BLANK] <concise-instruction-about-output> followed by blank line, then the COMPLETE executable code (already written, not partial), then blank line, then 'Output: _____'. CRITICAL: Never include phrases like 'write', 'implement', 'create', 'define a function'. The code is complete—user only predicts/types the output.";
  }
  return "Do not include blank markers in the question text.";
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
          "You are a helpful AI that generates open-ended quiz pairs. Produce the exact mix requested by each prompt: some questions are code-style execution questions and the rest are general topic questions. Follow each prompt type strictly. Do not force every question to be code-based. Avoid duplicate stems, repeated wording, and paragraph-length answers.",
          buildOpenEndedPrompts(input, batchToken),
          {
            question: "question",
            answer: "short answer, exact execution result, or concise topic answer depending on the prompt",
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