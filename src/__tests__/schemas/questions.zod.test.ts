import { getQuestionsSchema, checkAnswerSchema } from '../../schemas/questions';

describe('Zod schemas - questions', () => {
  test('getQuestionsSchema acepta payload válido', () => {
    const valid = { topic: 'math', amount: 5, type: 'mcq' };
    expect(() => getQuestionsSchema.parse(valid)).not.toThrow();
  });

  test('getQuestionsSchema rechaza payload inválido', () => {
    const invalid = { quizId: 'x' };
    expect(() => getQuestionsSchema.parse(invalid)).toThrow();
  });

  test('checkAnswerSchema rechaza formato incompleto', () => {
    const invalid = { questionId: 'q1' };
    // missing userInput
    expect(() => checkAnswerSchema.parse(invalid)).toThrow();
  });

  test('getQuestionsSchema rechaza amount cero', () => {
    const invalid = { topic: 'math', amount: 0, type: 'mcq' };
    expect(() => getQuestionsSchema.parse(invalid)).toThrow();
  });

  test('getQuestionsSchema rechaza tipo inválido', () => {
    const invalid = { topic: 'math', amount: 5, type: 'invalid_type' };
    expect(() => getQuestionsSchema.parse(invalid)).toThrow();
  });

  test('checkAnswerSchema valida payload correcto', () => {
    const valid = { questionId: 'q1', userInput: 'answer' };
    expect(() => checkAnswerSchema.parse(valid)).not.toThrow();
  });
});
