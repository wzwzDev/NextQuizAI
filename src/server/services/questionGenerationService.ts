import { strict_output } from "@/server/ai/gpt";

export type TopicQuestionInput = {
  amount: number;
  topic: string;
  type: "open_ended" | "mcq";
};

export async function generateQuestionsByTopic(input: TopicQuestionInput) {
  if (input.type === "open_ended") {
    return strict_output(
      "You are a helpful AI that generates short-answer quiz pairs. Every answer must be an exact, objective target (code output, keyword, syntax token, function name, number, or short phrase). Avoid definition/explanation style questions. Answers must be 1-6 words and never a paragraph.",
      new Array(input.amount).fill(
        `Generate a random hard short-answer question about ${input.topic}. Require an exact concise answer (1-6 words), not a definition.`,
      ),
      {
        question: "question",
        answer: "exact answer with max length of 6 words",
      },
    );
  }

  return strict_output(
    `You are a helpful AI that is able to generate ${input.amount} mcq questions and answers about ${input.topic}. The length of each answer should not be more than 15 words. Store all answers and questions and options in a JSON array. IMPORTANT: If any answer, question, or option contains double quotes, you MUST escape them with a backslash (\\") so the JSON is valid.`,
    [`Generate ${input.amount} random hard mcq questions about ${input.topic}.`],
    {
      question: "question",
      answer: "answer with max length of 15 words",
      option1: "option1 with max length of 15 words",
      option2: "option2 with max length of 15 words",
      option3: "option3 with max length of 15 words",
    },
  );
}