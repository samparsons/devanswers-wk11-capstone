import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BookmarkButton from '../../../src/components/Shared/BookmarkButton';

const createMockStore = ({
  userInfo = { userId: 'user-1', token: 't' },
  savedQuestionIds = [],
} = {}) => {
  return configureStore({
    reducer: {
      user: () => ({ userInfo, savedQuestionIds, savedQuestions: [] }),
    },
  });
};

const renderButton = (props = {}, storeOptions = {}) => {
  const store = createMockStore(storeOptions);
  return render(
    <Provider store={store}>
      <BookmarkButton questionId="question-1" {...props} />
    </Provider>,
  );
};

describe('BookmarkButton Component', () => {
  it('renders the unsaved (outline) state by default', () => {
    renderButton();
    expect(
      screen.getByRole('button', { name: /save question/i }),
    ).toBeInTheDocument();
  });

  it('renders the saved (filled) state when the id is in savedQuestionIds', () => {
    renderButton({}, { savedQuestionIds: ['question-1'] });
    const btn = screen.getByRole('button', { name: /unsave question/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('alerts and does not toggle when an anonymous user clicks', async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderButton({}, { userInfo: null });

    await userEvent.click(screen.getByRole('button'));

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringMatching(/logged in/i),
    );
  });
});
