import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { login, register } from '../services/authService.js';
import {
  getSavedQuestions,
  saveQuestion as saveQuestionApi,
  unsaveQuestion as unsaveQuestionApi,
} from '../services/questionService.js';

const initialState = {
  userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
  login: {
    status: 'idle', // 'idle' | 'pending' | 'fulfilled' | 'rejected'
    error: null,
  },
  registration: {
    status: 'idle', // 'idle' | 'pending' | 'fulfilled' | 'rejected'
    error: null,
  },
  // Bookmarks: full list for the profile + ids for fast icon lookups everywhere.
  savedQuestions: [],
  savedQuestionIds: [],
};

// Async thunk: login — localStorage side effects kept out of reducers
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await login({ email, password });
      const { token, userId, name } = data;
      localStorage.setItem('userInfo', JSON.stringify({ token, userId, name }));
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Invalid email or password',
      );
    }
  }
);

// Async thunk: register
export const registerUser = createAsyncThunk(
  'user/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      return await register({ name, email, password, isAdmin: false });
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed',
      );
    }
  }
);

// Thunk: logout — clears localStorage then resets Redux state
export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('userInfo');
  dispatch(userSlice.actions.logout());
};

// Load the user's saved questions (for the profile list + icon state on app load).
export const fetchSavedQuestions = createAsyncThunk(
  'user/fetchSavedQuestions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user.userInfo || {};
      if (!token) return [];
      return await getSavedQuestions(token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch saved questions',
      );
    }
  },
);

// Save a question. Optimistically flips the icon, reverts on failure.
export const saveQuestion = createAsyncThunk(
  'user/saveQuestion',
  async (questionId, { getState, dispatch, rejectWithValue }) => {
    const { token } = getState().user.userInfo || {};
    dispatch(userSlice.actions.addSavedId(questionId));
    try {
      await saveQuestionApi(questionId, token);
      return questionId;
    } catch (error) {
      dispatch(userSlice.actions.removeSavedId(questionId));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save question',
      );
    }
  },
);

// Unsave a question. Optimistically removes it, reverts on failure.
export const unsaveQuestion = createAsyncThunk(
  'user/unsaveQuestion',
  async (questionId, { getState, dispatch, rejectWithValue }) => {
    const { token } = getState().user.userInfo || {};
    dispatch(userSlice.actions.removeSavedId(questionId));
    try {
      await unsaveQuestionApi(questionId, token);
      return questionId;
    } catch (error) {
      dispatch(userSlice.actions.addSavedId(questionId));
      return rejectWithValue(
        error.response?.data?.message || 'Failed to unsave question',
      );
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.login = { status: 'idle', error: null };
      state.registration = { status: 'idle', error: null };
      // Saved questions are per-user; clear them on logout.
      state.savedQuestions = [];
      state.savedQuestionIds = [];
    },
    clearAuthState: (state) => {
      state.login.error = null;
      state.login.status = 'idle';
      state.registration.error = null;
      state.registration.status = 'idle';
    },
    addSavedId: (state, action) => {
      if (!state.savedQuestionIds.includes(action.payload)) {
        state.savedQuestionIds.push(action.payload);
      }
    },
    removeSavedId: (state, action) => {
      state.savedQuestionIds = state.savedQuestionIds.filter(
        (id) => id !== action.payload,
      );
      state.savedQuestions = state.savedQuestions.filter(
        (q) => q._id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => {
        state.login.status = 'pending';
        state.login.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, userId, name } = action.payload;
        state.userInfo = { token, userId, name };
        state.login.status = 'fulfilled';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = 'rejected';
        state.login.error = action.payload || action.error.message;
      })

      // register
      .addCase(registerUser.pending, (state) => {
        state.registration.status = 'pending';
        state.registration.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registration.status = 'fulfilled';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registration.status = 'rejected';
        state.registration.error = action.payload || action.error.message;
      })

      // saved questions
      .addCase(fetchSavedQuestions.fulfilled, (state, action) => {
        state.savedQuestions = action.payload;
        state.savedQuestionIds = action.payload.map((q) => q._id);
      });
  },
});

export const { clearAuthState, logout, addSavedId, removeSavedId } =
  userSlice.actions;

export const selectIsAuthenticated = (state) => !!state.user.userInfo;
export const selectSavedQuestions = (state) => state.user.savedQuestions;
export const selectSavedQuestionIds = (state) => state.user.savedQuestionIds;

export default userSlice.reducer;