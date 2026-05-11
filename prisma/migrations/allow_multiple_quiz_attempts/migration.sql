-- Add allowedAttempts to AdminQuiz if it does not exist yet
SET @admin_quiz_allowed_attempts_exists := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'AdminQuiz'
    AND column_name = 'allowedAttempts'
);
SET @admin_quiz_allowed_attempts_sql := IF(
  @admin_quiz_allowed_attempts_exists = 0,
  'ALTER TABLE `AdminQuiz` ADD COLUMN `allowedAttempts` INT NOT NULL DEFAULT 2',
  'SELECT 1'
);
PREPARE stmt FROM @admin_quiz_allowed_attempts_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add attemptNumber to UserQuizAttempt if it does not exist yet
SET @user_quiz_attempt_number_exists := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'UserQuizAttempt'
    AND column_name = 'attemptNumber'
);
SET @user_quiz_attempt_number_sql := IF(
  @user_quiz_attempt_number_exists = 0,
  'ALTER TABLE `UserQuizAttempt` ADD COLUMN `attemptNumber` INT NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @user_quiz_attempt_number_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the old unique index if it still exists
SET @user_quiz_attempt_unique_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'UserQuizAttempt'
    AND index_name = 'UserQuizAttempt_userId_quizId_key'
);
SET @user_quiz_attempt_unique_sql := IF(
  @user_quiz_attempt_unique_exists > 0,
  'ALTER TABLE `UserQuizAttempt` DROP INDEX `UserQuizAttempt_userId_quizId_key`',
  'SELECT 1'
);
PREPARE stmt FROM @user_quiz_attempt_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the composite index for lookup performance if it does not exist yet
SET @user_quiz_attempt_composite_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'UserQuizAttempt'
    AND index_name = 'user_quiz_attempt_composite_idx'
);
SET @user_quiz_attempt_composite_sql := IF(
  @user_quiz_attempt_composite_exists = 0,
  'CREATE INDEX `user_quiz_attempt_composite_idx` ON `UserQuizAttempt`(`userId`, `quizId`, `status`)',
  'SELECT 1'
);
PREPARE stmt FROM @user_quiz_attempt_composite_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
