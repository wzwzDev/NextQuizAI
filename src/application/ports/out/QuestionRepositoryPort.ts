export interface QuestionRepositoryPort {
  findById(questionId: string): Promise<{
    id: string;
    answer: string;
    questionType: "mcq" | "open_ended";
    game: { userId: string };
  } | null>;

  saveUserAnswer(questionId: string, userAnswer: string): Promise<void>;
  saveMcqResult(questionId: string, isCorrect: boolean): Promise<void>;
  saveOpenEndedResult(questionId: string, percentageSimilar: number): Promise<void>;
}
