import type { LlmGatewayPort } from "@/application/ports/out/LlmGatewayPort";
import type { QuestionGenerationConfigPort } from "@/application/ports/out/QuestionGenerationConfigPort";

export type TopicQuestion = {
  question: string;
  answer: string;
  option1?: string;
  option2?: string;
  option3?: string;
};

export class GenerateTopicQuestionsUseCase {
  constructor(
    private llmGateway: LlmGatewayPort,
    private config: QuestionGenerationConfigPort,
  ) {}

  async execute(input: {
    amount: number;
    topic: string;
    type: "open_ended" | "mcq";
  }): Promise<TopicQuestion[]> {
    const batchToken = this.config.createBatchToken();
    const prompts = this.buildPrompts(input, batchToken);
    // models currently unused; keep prompt building deterministic

    const outputFormat =
      input.type === "open_ended"
        ? {
            questions: [
              {
                question: "string",
                answer: "string",
              },
            ],
          }
        : {
            questions: [
              {
                question: "string",
                answer: "string",
                option1: "string",
                option2: "string",
                option3: "string",
              },
            ],
          };

    const systemPrompt =
      input.type === "open_ended"
        ? "You are an expert teacher creating short-answer questions."
        : "You are an expert teacher creating multiple-choice questions.";

    const result = (await this.llmGateway.strictOutput(
      systemPrompt,
      prompts,
      outputFormat,
    )) as { questions: TopicQuestion[] };

    return result.questions;
  }

  private buildPrompts(
    input: { amount: number; topic: string; type: "open_ended" | "mcq" },
    batchToken: string,
  ): string[] {
    return Array.from({ length: input.amount }, (_, index) => {
      if (input.type === "open_ended") {
        return [
          `Generate one challenging short-answer question about ${input.topic}.`,
          `Question position: ${index + 1}/${input.amount}.`,
          `Batch token: ${batchToken}-${index + 1}.`,
          "Answer must be exact and concise (1-6 words).",
          "Avoid broad definitions, trivia clichés, and repeated phrasing.",
          "Each question in this batch must test a different subtopic.",
        ].join(" ");
      }

      return [
        `Generate one multiple-choice question about ${input.topic}.`,
        `Question position: ${index + 1}/${input.amount}.`,
        `Batch token: ${batchToken}-${index + 1}.`,
        "Provide exactly 3 incorrect options and 1 correct answer.",
        "Make incorrect options plausible but clearly wrong.",
        "Each question in this batch must test a different subtopic.",
      ].join(" ");
    });
  }
}
