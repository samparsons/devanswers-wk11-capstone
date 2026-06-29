import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AnswerList from '../../../src/components/Answer/AnswerList';
import questionReducer from '../../../src/reducers/questionSlice';

const createMockStore = (userInfo = { userId: 'user-1' }) => {
  return configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo,
        loading: false,
        error: null,
      }),
    },
  });
};

const mockAnswers = [
  {
    _id: 'a1',
    answerText: 'Use the useState hook for local state.',
    author: { _id: 'user-2', name: 'Alice' },
    voteCount: 5,
    createdAt: '2026-01-15T12:00:00.000Z',
  },
  {
    _id: 'a2',
    answerText: 'You can also try lifting state up.',
    author: { _id: 'user-3', name: 'Bob' },
    voteCount: -2,
    createdAt: '2026-01-15T13:00:00.000Z',
  },
];

const renderAnswerList = (answers = mockAnswers, userInfo) => {
  const store = createMockStore(userInfo);
  return render(
    <Provider store={store}>
      <AnswerList answers={answers} />
    </Provider>
  );
};

describe('AnswerList Component', () => {
  it('renders all answer texts', () => {
    renderAnswerList();
    expect(screen.getByText('Use the useState hook for local state.')).toBeInTheDocument();
    expect(screen.getByText('You can also try lifting state up.')).toBeInTheDocument();
  });

  it('renders answer authors', () => {
    renderAnswerList();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders answer vote counts', () => {
    renderAnswerList();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('renders the answers count heading', () => {
    renderAnswerList();
    expect(screen.getByText('2 Answers')).toBeInTheDocument();
  });

  it('shows singular "Answer" for one answer', () => {
    renderAnswerList([mockAnswers[0]]);
    expect(screen.getByText('1 Answer')).toBeInTheDocument();
  });

  it('renders upvote and downvote buttons for each answer', () => {
    renderAnswerList();
    const buttons = screen.getAllByRole('button');
    // At least 2 upvote + 2 downvote = 4 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders "Answered by" label for each answer', () => {
    renderAnswerList();
    const answeredByTexts = screen.getAllByText(/Answered by/i);
    expect(answeredByTexts).toHaveLength(2);
  });

  it('renders empty state when no answers provided', () => {
    renderAnswerList([]);
    expect(screen.getByText(/No answers yet/i)).toBeInTheDocument();
  });

  it('shows "0 Answers" heading when answers array is empty', () => {
    renderAnswerList([]);
    expect(screen.getByText('0 Answers')).toBeInTheDocument();
  });

  it('shows the edit affordance only on the current user\'s own answer', () => {
    // a1 -> user-2, a2 -> user-3; viewing as user-2 reveals exactly one pencil
    renderAnswerList(mockAnswers, { userId: 'user-2' });
    const editButtons = screen.getAllByRole('button', { name: /edit answer/i });
    expect(editButtons).toHaveLength(1);
  });

  it('hides the edit affordance when the user authored none of the answers', () => {
    renderAnswerList(mockAnswers, { userId: 'user-1' });
    expect(
      screen.queryByRole('button', { name: /edit answer/i }),
    ).not.toBeInTheDocument();
  });

  it('shows an "edited" indicator on an edited answer', () => {
    renderAnswerList([
      { ...mockAnswers[0], isEdited: true, editedAt: '2026-01-16T00:00:00.000Z' },
    ]);
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });
});
