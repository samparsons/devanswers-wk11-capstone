import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import QuestionContent from '../../../src/components/Question/QuestionContent';
import questionReducer from '../../../src/reducers/questionSlice';

const createMockStore = (userInfo = { userId: 'user-1' }) => {
  return configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo,
        savedQuestionIds: [],
        loading: false,
        error: null,
      }),
    },
  });
};

const mockQuestion = {
  _id: 'q1',
  title: 'How do I use the useEffect hook?',
  description: 'I have trouble with the dependency array.',
  voteCount: 8,
  tags: [
    { _id: 't1', name: 'react' },
    { _id: 't2', name: 'hooks' },
  ],
  author: { _id: 'user-2', name: 'Alice' },
  createdAt: '2026-01-15T00:00:00.000Z',
};

const renderQuestionContent = (question = mockQuestion, userInfo) => {
  const store = createMockStore(userInfo);
  return render(
    <Provider store={store}>
      <QuestionContent question={question} />
    </Provider>
  );
};

describe('QuestionContent Component', () => {
  it('renders the question title', () => {
    renderQuestionContent();
    expect(screen.getByText('How do I use the useEffect hook?')).toBeInTheDocument();
  });

  it('renders the question description', () => {
    renderQuestionContent();
    expect(screen.getByText('I have trouble with the dependency array.')).toBeInTheDocument();
  });

  it('renders the vote count', () => {
    renderQuestionContent();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders tags as badges', () => {
    renderQuestionContent();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('hooks')).toBeInTheDocument();
  });

  it('renders the author name', () => {
    renderQuestionContent();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders upvote and downvote buttons', () => {
    renderQuestionContent();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the "Asked" date text', () => {
    renderQuestionContent();
    expect(screen.getByText(/Asked/i)).toBeInTheDocument();
  });

  it('renders "Posted by" label for the author', () => {
    renderQuestionContent();
    expect(screen.getByText(/Posted by/i)).toBeInTheDocument();
  });

  it('shows the edit affordance only to the author', () => {
    // author is user-2; viewing as user-2 should reveal the pencil
    renderQuestionContent(mockQuestion, { userId: 'user-2' });
    expect(
      screen.getByRole('button', { name: /edit question/i }),
    ).toBeInTheDocument();
  });

  it('hides the edit affordance from non-authors', () => {
    renderQuestionContent(mockQuestion, { userId: 'user-1' });
    expect(
      screen.queryByRole('button', { name: /edit question/i }),
    ).not.toBeInTheDocument();
  });

  it('shows an "edited" indicator only when the question was edited', () => {
    const { unmount } = renderQuestionContent(mockQuestion);
    expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
    unmount();

    renderQuestionContent({
      ...mockQuestion,
      isEdited: true,
      editedAt: '2026-01-16T00:00:00.000Z',
    });
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });
});
