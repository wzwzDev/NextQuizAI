-- Allow same title with different quizType
-- Add unique constraint on (title, quizType)

CREATE UNIQUE INDEX `AdminQuiz_title_quizType_key` ON `AdminQuiz`(`title`, `quizType`);

