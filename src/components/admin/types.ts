export type AdminQuizType = "mcq" | "open_ended";

export type AdminQuestion = {
  question: string;
  answer: string;
  options?: string[];
};

export type AdminQuizDraft = {
  id?: string;
  title: string;
  category?: string;
  difficulty?: string;
  quizType?: AdminQuizType;
  questions: AdminQuestion[];
};
