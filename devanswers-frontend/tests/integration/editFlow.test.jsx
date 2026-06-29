import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import questionReducer, {
  editQuestion,
  editAnswer,
} from '../../src/reducers/questionSlice';
import { mockQuestions } from '../mocks/mockData';

const createTestStore = () =>
  configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo: { userId: 'user-1', token: 'mock-jwt-token-alice' },
      }),
    },
    preloadedState: {
      question: {
        questions: [],
        // deep clone so reducers can't mutate the shared fixture
        currentQuestion: JSON.parse(JSON.stringify(mockQuestions[0])),
        loading: false,
        error: null,
      },
    },
  });

describe('Edit Flow (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('edits a question in place and marks it edited', async () => {
    await store.dispatch(
      editQuestion({
        questionId: 'question-1',
        title: 'Updated title',
        description: 'Updated description',
        tags: 'react',
      }),
    );

    const current = store.getState().question.currentQuestion;
    expect(current.title).toBe('Updated title');
    expect(current.isEdited).toBe(true);
    expect(current.editedAt).toBeTruthy();
    // answers preserved (the update response omits them)
    expect(current.answers).toHaveLength(2);
  });

  it('edits an answer in place and marks it edited', async () => {
    await store.dispatch(
      editAnswer({ answerId: 'answer-1', answerText: 'Revised answer' }),
    );

    const answers = store.getState().question.currentQuestion.answers;
    const edited = answers.find((a) => a._id === 'answer-1');
    expect(edited.answerText).toBe('Revised answer');
    expect(edited.isEdited).toBe(true);
  });
});
