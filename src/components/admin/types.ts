export type AdminQuizType = "mcq" | "open_ended";

export type AdminQuizGenerationOptions = {
  category?: string;
  difficulty?: string;
  quizType?: AdminQuizType;
  questionCount?: number;
};

export type AdminQuizAttemptSummary = {
  totalAttempts: number;
  completedAttempts: number;
  pendingAttempts: number;
  averageScore: number | null;
  lastAttemptAt: string | Date | null;
  lastCompletedAt: string | Date | null;
};

export type AdminQuestionCitation = {
  source: string;
  snippet: string;
  confidence?: number;
};

export type AdminQuestion = {
  question: string;
  answer: string;
  options?: string[];
  citation?: AdminQuestionCitation;
};

export type AdminQuizDraft = {
  id?: string;
  title: string;
  category?: string;
  difficulty?: string;
  quizType?: AdminQuizType;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  questionCount?: number;
  generationOptions?: AdminQuizGenerationOptions;
  attemptSummary?: AdminQuizAttemptSummary;
  questions: AdminQuestion[];
};
