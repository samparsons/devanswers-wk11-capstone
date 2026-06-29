import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveQuestionService,
  unsaveQuestionService,
} from '../../../src/services/bookmarkService.js';
import User from '../../../src/models/User.js';
import Question from '../../../src/models/Question.js';

vi.mock('../../../src/models/User.js');
vi.mock('../../../src/models/Question.js');
vi.mock('../../../src/models/Answer.js');

describe('bookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveQuestionService', () => {
    it('throws 404 when the question does not exist', async () => {
      Question.findById = vi.fn().mockResolvedValue(null);

      await expect(saveQuestionService('q1', 'u1')).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('adds the question idempotently with $addToSet and reports saved', async () => {
      Question.findById = vi.fn().mockResolvedValue({ _id: 'q1' });
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({});

      const result = await saveQuestionService('q1', 'u1');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
        $addToSet: { savedQuestions: 'q1' },
      });
      expect(result).toEqual({ questionId: 'q1', isSaved: true });
    });
  });

  describe('unsaveQuestionService', () => {
    it('removes the question with $pull and reports not saved', async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({});

      const result = await unsaveQuestionService('q1', 'u1');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
        $pull: { savedQuestions: 'q1' },
      });
      expect(result).toEqual({ questionId: 'q1', isSaved: false });
    });
  });
});
