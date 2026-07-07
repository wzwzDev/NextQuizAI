/*
  Warnings:

  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topicCount` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `AdminQuizQuestion` MODIFY `question` LONGTEXT NOT NULL,
    MODIFY `answer` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `Question` MODIFY `question` LONGTEXT NOT NULL,
    MODIFY `answer` LONGTEXT NOT NULL,
    MODIFY `userAnswer` LONGTEXT NULL;

-- DropTable
DROP TABLE `Quiz`;

-- DropTable
DROP TABLE `QuizQuestion`;

-- DropTable
DROP TABLE `topicCount`;

-- CreateTable
CREATE TABLE `TopicCount` (
    `id` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL,

    UNIQUE INDEX `TopicCount_topic_key`(`topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
