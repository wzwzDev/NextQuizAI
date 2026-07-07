SELECT 'Users' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Attempts' as table_name, COUNT(*) as count FROM UserQuizAttempt
UNION ALL
SELECT 'Quizzes' as table_name, COUNT(*) as count FROM AdminQuiz
UNION ALL
SELECT 'Topics' as table_name, COUNT(*) as count FROM TopicCount;

SELECT '--- All Users ---' as info;
SELECT id, email, isAdmin FROM User;

SELECT '--- All Quizzes ---' as info;
SELECT id, title FROM AdminQuiz;

SELECT '--- All Attempts ---' as info;
SELECT id, userId, quizId, status, score FROM UserQuizAttempt LIMIT 10;
