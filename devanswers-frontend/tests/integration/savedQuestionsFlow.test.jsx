import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  fetchSavedQuestions,
  saveQuestion,
  unsaveQuestion,
} from '../../src/reducers/userSlice';

const createTestStore = () =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: {
        userInfo: { userId: 'user-1', token: 'mock-jwt-token-alice', name: 'Alice' },
        login: { status: 'idle', error: null },
        registration: { status: 'idle', error: null },
        savedQuestions: [],
        savedQuestionIds: [],
      },
    },
  });

describe('Saved Questions Flow (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('fetches saved questions and derives their ids', async () => {
    await store.dispatch(fetchSavedQuestions());

    const state = store.getState().user;
    expect(state.savedQuestions).toHaveLength(1);
    expect(state.savedQuestionIds).toHaveLength(1);
    expect(state.savedQuestionIds[0]).toBe(state.savedQuestions[0]._id);
  });

  it('optimistically adds an id when saving a question', async () => {
    await store.dispatch(saveQuestion('question-2'));
    expect(store.getState().user.savedQuestionIds).toContain('question-2');
  });

  it('removes an id when unsaving a question', async () => {
    await store.dispatch(saveQuestion('question-2'));
    expect(store.getState().user.savedQuestionIds).toContain('question-2');

    await store.dispatch(unsaveQuestion('question-2'));
    expect(store.getState().user.savedQuestionIds).not.toContain('question-2');
  });
});
