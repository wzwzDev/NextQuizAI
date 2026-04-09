import { strict_output } from "@/server/ai/gpt";

export type TopicQuestionInput = {
  amount: number;
  topic: string;
  type: "open_ended" | "mcq";
};

export async function generateQuestionsByTopic(input: TopicQuestionInput) {
  if (input.type === "open_ended") {
    return strict_output(
      "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 words, store all the pairs of answers and questions in a JSON array",
      new Array(input.amount).fill(
        `You are to generate a random hard open-ended questions about ${input.topic}`,
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
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