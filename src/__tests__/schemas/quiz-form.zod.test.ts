import { saveUserQuizAttemptSchema } from '../../schemas/questions';

describe('Zod schemas - quiz form', () => {
  test('saveUserQuizAttemptSchema acepta payload mínimo válido', () => {
    const valid = { quizId: 'q1', quizTitle: 'Mini', answers: [], score: 10 };
    expect(() => saveUserQuizAttemptSchema.parse(valid)).not.toThrow();
  });

  test('saveUserQuizAttemptSchema falla sin quizId', () => {
    const invalid = { quizTitle: 'Mini', answers: [], score: 10 };
    expect(() => saveUserQuizAttemptSchema.parse(invalid)).toThrow();
  });
});
