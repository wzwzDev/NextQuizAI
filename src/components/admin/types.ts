export type AdminQuestion = {
  question: string;
  answer: string;
};

export type AdminQuizDraft = {
  id?: string;
  title: string;
  category?: string;
  difficulty?: string;
  questions: AdminQuestion[];
};
